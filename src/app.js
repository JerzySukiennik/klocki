// Klocki: app flow. Find parts by swiping, review the pile, then follow the step-by-step build.

import { COLORS, PARTS, splitKey } from './catalog.js';
import { answer, plan } from './planner.js';
import { createViewer } from './viewer.js';
import tars from '../models/tars.js';

const MODELS = { tars };
const THEMES = ['biel', 'noc', 'papier'];
const THRESHOLD = 110;
const $ = (id) => document.getElementById(id);

const state = {
  model: 'tars',
  view: 'find',
  piles: {},
  history: {},
  settings: { theme: 'biel', flip: false, scale: 1 },
  real: false,
  typed: '',
  step: 0,
};

const card = $('card');
const viewer = await createViewer($('canvas'));
let current = null;
let busy = false;
let saveTimer = 0;

const model = () => MODELS[state.model];
const pile = () => (state.piles[state.model] ||= {});
const past = () => (state.history[state.model] ||= []);
const plural = (n, one, few, many) => {
  if (n === 1) return one;
  const tens = n % 100;
  const units = n % 10;
  return units >= 2 && units <= 4 && (tens < 12 || tens > 14) ? few : many;
};
const label = (key) => {
  const { part, color } = splitKey(key);
  return `${PARTS[part].name}, ${COLORS[color].name.toLowerCase()}`;
};

function pxPerLdu() {
  const guess = (226 * screen.width) / 3072;
  const ppi = guess > 90 && guess < 170 ? guess : 127;
  return ((ppi * state.settings.scale) / 25.4) * 0.4;
}

function report(id) {
  const result = plan(MODELS[id], state.piles[id] || {});
  return {
    complete: !result.ask.length && !result.gaps.length,
    pile: Object.entries(state.piles[id] || {}).map(([key, entry]) => ({
      key,
      name: label(key),
      have: entry.have,
      noMore: entry.done,
    })),
    stillLooking: result.ask.map((q) => ({ key: q.key, name: label(q.key), need: q.need })),
    gaps: result.gaps,
  };
}

async function load() {
  try {
    const saved = await (await fetch('/api/state')).json();
    Object.assign(state.settings, saved.settings || {});
    for (const [id, entry] of Object.entries(saved.models || {})) {
      if (!MODELS[id]) continue;
      state.piles[id] = entry.pile || {};
      state.history[id] = entry.history || [];
    }
  } catch {}
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const models = {};
    for (const id of Object.keys(MODELS)) {
      models[id] = { pile: state.piles[id] || {}, report: report(id), history: (state.history[id] || []).slice(-200) };
    }
    const body = JSON.stringify({ version: 1, updated: new Date().toISOString(), settings: state.settings, models }, null, 2);
    fetch('/api/state', { method: 'PUT', headers: { 'content-type': 'application/json' }, body }).catch(() => {});
  }, 250);
}

function refresh() {
  current = plan(model(), pile());
  const total = Object.values(pile()).reduce((sum, entry) => sum + entry.have, 0);
  $('pile-count').textContent = total || '';
}

function paintSwatch(element, color) {
  element.style.background = COLORS[color].hex;
}

function renderTyped() {
  const box = $('typed');
  box.hidden = !state.typed;
  box.innerHTML = state.typed ? `Mam tylko ${state.typed}<small>Enter</small>` : '';
}

function renderFind() {
  const question = current.ask[0];
  $('find-info').hidden = !question;
  $('keys').hidden = !question;
  $('progress').hidden = !question;
  $('find-done').hidden = Boolean(question);
  if (!question) {
    const whole = !current.gaps.length;
    $('done-title').textContent = whole ? 'Masz wszystko' : 'Lista przejrzana';
    $('done-text').textContent = whole
      ? 'Cała lista leży na kupce. Możesz składać.'
      : `Brakuje: ${current.gaps.map((gap) => `${gap.label} (${gap.count})`).join(', ')}. Napisz Claude'owi „sprawdź”, przerobi model pod Twoją kupkę.`;
    $('done-go').hidden = !whole;
    viewer.setReal(false);
    viewer.showModel(current.placements, Infinity);
    return;
  }
  const { part, color } = splitKey(question.key);
  const answered = Object.keys(pile()).length;
  $('count').textContent = `×${question.need}`;
  $('more').textContent = question.have ? `jeszcze tyle, na kupce masz już ${question.have}` : '';
  $('name').textContent = PARTS[part].name;
  $('number').textContent = `nr ${part}`;
  $('color').textContent = `${COLORS[color].name} · ${COLORS[color].lego}`;
  $('hint').textContent = COLORS[color].hint || '';
  $('progress').textContent = `Część ${answered + 1} z ${answered + current.ask.length}`;
  paintSwatch($('swatch'), color);
  viewer.setReal(state.real, pxPerLdu());
  viewer.showPart(part, color);
}

function tile(key, count, className) {
  const { part, color } = splitKey(key);
  const element = document.createElement('div');
  element.className = className;
  const image = document.createElement('img');
  image.alt = '';
  viewer.thumb(part, color).then((url) => {
    image.src = url;
  });
  const text = document.createElement('div');
  text.innerHTML = `<b>×${count}</b><div>${PARTS[part].name}</div><span><i class="swatch"></i>${COLORS[color].name}</span>`;
  paintSwatch(text.querySelector('.swatch'), color);
  element.append(image, text);
  return element;
}

function renderPile() {
  const entries = Object.entries(pile());
  const owned = entries.filter(([, entry]) => entry.have > 0).sort(([a], [b]) => splitKey(a).color - splitKey(b).color);
  const total = owned.reduce((sum, [, entry]) => sum + entry.have, 0);
  $('pile-total').textContent = total
    ? `Na kupce ${total} ${plural(total, 'klocek', 'klocki', 'klocków')}`
    : 'Kupka jest pusta';
  $('pile-grid').replaceChildren(...owned.map(([key, entry]) => tile(key, entry.have, 'tile')));

  const out = entries.filter(([, entry]) => entry.done);
  $('pile-out').innerHTML = out.length
    ? `<h3>Skończyły się</h3>${out.map(([key, entry]) => `<p>${label(key)}: ${entry.have ? `masz tylko ${entry.have}` : 'nie masz'}</p>`).join('')}`
    : '';
  $('pile-gaps').innerHTML = current.gaps.length
    ? `<h3>Brakuje do modelu</h3>${current.gaps.map((gap) => `<p>${gap.label}: ${gap.count}</p>`).join('')}`
    : '';
}

function stepNumbers() {
  return [...new Set(current.placements.map((p) => p.step))].sort((a, b) => a - b);
}

function renderBuild(keepView) {
  const ready = !current.ask.length;
  $('build-wait').hidden = ready;
  $('build-ui').hidden = !ready;
  viewer.setReal(false);
  if (!ready) {
    const left = current.ask.length;
    $('build-wait-text').textContent = `Najpierw dokończ szukanie. ${plural(left, 'Została', 'Zostały', 'Zostało')} ${left} ${plural(left, 'część', 'części', 'części')}.`;
    viewer.showModel(current.placements, Infinity);
    return;
  }
  const numbers = stepNumbers();
  state.step = Math.min(Math.max(state.step, 0), numbers.length - 1);
  const number = numbers[state.step];
  const counts = new Map();
  for (const p of current.placements) {
    if (p.step !== number) continue;
    const key = `${p.part}:${p.color}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  $('step-now').textContent = state.step + 1;
  $('step-all').textContent = numbers.length;
  $('step-note').textContent = model().notes?.[number] || '';
  $('build-gaps').textContent = current.gaps.length
    ? `Model niepełny, brakuje: ${current.gaps.map((gap) => `${gap.label} (${gap.count})`).join(', ')}.`
    : '';
  $('step-parts').replaceChildren(...[...counts].map(([key, count]) => tile(key, count, 'chip')));
  $('prev').disabled = state.step === 0;
  $('next').disabled = state.step === numbers.length - 1;
  const spread = model().spread?.[number] || 0;
  const shown = spread
    ? current.placements.map((p) => ({ ...p, x: p.x + ((p.col ?? 1.5) - 1.5) * spread }))
    : current.placements;
  viewer.showModel(shown, number, keepView);
}

function show() {
  document.body.dataset.view = state.view;
  for (const button of document.querySelectorAll('[data-go]')) button.classList.toggle('on', button.dataset.go === state.view);
  $('scale').hidden = state.view !== 'find';
  $('scale').classList.toggle('on', state.real);
  if (state.view === 'find') renderFind();
  if (state.view === 'pile') renderPile();
  if (state.view === 'build') renderBuild(false);
}

function go(view) {
  document.activeElement?.blur();
  state.view = view;
  state.typed = '';
  renderTyped();
  resetCard();
  show();
}

function applyTheme() {
  document.body.dataset.theme = state.settings.theme;
  for (const button of document.querySelectorAll('[data-pick]')) button.classList.toggle('on', button.dataset.pick === state.settings.theme);
  viewer.setGhost(getComputedStyle(document.body).getPropertyValue('--stage').trim());
}

function setTheme(theme) {
  state.settings.theme = theme;
  applyTheme();
  save();
  show();
}

function resetCard() {
  card.classList.remove('snap');
  card.style.transform = '';
  $('yes').style.opacity = 0;
  $('no').style.opacity = 0;
}

function dragCard(dx) {
  card.classList.remove('snap');
  card.style.transform = `translateX(${dx * 0.9}px) rotate(${dx * 0.018}deg)`;
  const pull = Math.min(1, Math.abs(dx) / THRESHOLD);
  $('yes').style.opacity = dx > 0 ? pull : 0;
  $('no').style.opacity = dx < 0 ? pull : 0;
}

function releaseCard() {
  card.classList.add('snap');
  card.style.transform = '';
  $('yes').style.opacity = 0;
  $('no').style.opacity = 0;
}

async function commit(count) {
  const question = current.ask[0];
  if (!question || busy || state.view !== 'find') return;
  busy = true;
  const direction = count > 0 ? 1 : -1;
  past().push(structuredClone(pile()));
  state.piles[state.model] = answer(pile(), question, count);
  state.typed = '';
  renderTyped();
  save();
  $(direction > 0 ? 'yes' : 'no').style.opacity = 1;
  const from = card.style.transform || 'none';
  const to = `translateX(${direction * window.innerWidth * 0.55}px) rotate(${direction * 7}deg)`;
  const fling = card.animate([{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }], { duration: 190, easing: 'cubic-bezier(.4, 0, 1, 1)' });
  await Promise.race([fling.finished, new Promise((resolve) => setTimeout(resolve, 260))]);
  fling.cancel();
  resetCard();
  refresh();
  renderFind();
  card.animate([{ transform: 'scale(.93)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  $('find-info').animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2, .8, .2, 1)' });
  busy = false;
}

function undo() {
  const previous = past().pop();
  if (!previous || busy) return;
  state.piles[state.model] = previous;
  save();
  refresh();
  show();
}

function turn(delta) {
  const count = stepNumbers().length;
  const next = Math.min(Math.max(state.step + delta, 0), count - 1);
  if (next === state.step || current.ask.length) return;
  state.step = next;
  renderBuild(true);
}

function swipe(direction) {
  if (state.view === 'find') {
    if (direction > 0) commit(state.typed ? Number(state.typed) : current.ask[0]?.need || 0);
    else commit(0);
  }
  if (state.view === 'build') turn(direction > 0 ? -1 : 1);
}

const gesture = { dx: 0, locked: false, last: 0, timer: 0 };

function endGesture() {
  gesture.dx = 0;
  gesture.locked = false;
  gesture.last = 0;
  if (state.view === 'find' && !busy) releaseCard();
}

window.addEventListener(
  'wheel',
  (event) => {
    if (state.view === 'pile' || !$('sheet').hidden) return;
    event.preventDefault();
    if (event.ctrlKey) {
      viewer.zoomBy(Math.exp(-event.deltaY * 0.012));
      return;
    }
    const size = Math.abs(event.deltaX);
    if (size < Math.abs(event.deltaY) && Math.abs(gesture.dx) < 8) return;
    clearTimeout(gesture.timer);
    gesture.timer = setTimeout(endGesture, 150);
    if (gesture.locked) {
      if (size > gesture.last + 6 && size > 14) {
        gesture.locked = false;
        gesture.dx = 0;
      } else {
        gesture.last = size;
        return;
      }
    }
    gesture.last = size;
    gesture.dx += (state.settings.flip ? 1 : -1) * event.deltaX;
    if (state.view === 'find' && !busy) dragCard(gesture.dx);
    if (Math.abs(gesture.dx) > THRESHOLD) {
      gesture.locked = true;
      swipe(Math.sign(gesture.dx));
    }
  },
  { passive: false },
);

window.addEventListener('keydown', (event) => {
  if (event.key === 'z' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    undo();
    return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const key = event.key;
  if (key === 't' || key === 'T') return setTheme(THEMES[(THEMES.indexOf(state.settings.theme) + 1) % THEMES.length]);
  if (state.view === 'build') {
    if (key === 'ArrowRight') turn(1);
    if (key === 'ArrowLeft') turn(-1);
    return;
  }
  if (state.view !== 'find') return;
  if (key === 'ArrowRight') swipe(1);
  else if (key === 'ArrowLeft') swipe(-1);
  else if (key === 'Enter' && state.typed) commit(Number(state.typed));
  else if (key === 'Backspace') {
    state.typed = state.typed.slice(0, -1);
    renderTyped();
  } else if (key === 'Escape') {
    state.typed = '';
    renderTyped();
  } else if (/^\d$/.test(key) && current.ask[0]) {
    state.typed = (state.typed + key).replace(/^0+(?=\d)/, '').slice(0, 3);
    renderTyped();
  } else if (key === 'z' || key === 'Z') undo();
  else if (key === 's' || key === 'S') toggleReal();
});

function toggleReal() {
  state.real = !state.real;
  $('scale').classList.toggle('on', state.real);
  viewer.setReal(state.real && Boolean(current.ask[0]), pxPerLdu());
}

function renderScale() {
  $('scale-value').textContent = `${Math.round(state.settings.scale * 100)}%`;
  $('flip').checked = state.settings.flip;
}

function nudgeScale(delta) {
  state.settings.scale = Math.min(1.5, Math.max(0.6, Math.round((state.settings.scale + delta) * 100) / 100));
  renderScale();
  save();
  if (state.real && state.view === 'find') viewer.setReal(true, pxPerLdu());
}

for (const button of document.querySelectorAll('[data-go]')) button.addEventListener('click', () => go(button.dataset.go));
for (const button of document.querySelectorAll('[data-pick]')) button.addEventListener('click', () => setTheme(button.dataset.pick));
$('scale').addEventListener('click', toggleReal);
$('done-go').addEventListener('click', () => go('build'));
$('build-back').addEventListener('click', () => go('find'));
$('prev').addEventListener('click', () => turn(-1));
$('next').addEventListener('click', () => turn(1));
$('menu').addEventListener('click', () => {
  $('sheet').hidden = !$('sheet').hidden;
});
$('flip').addEventListener('change', () => {
  state.settings.flip = $('flip').checked;
  save();
});
$('scale-down').addEventListener('click', () => nudgeScale(-0.01));
$('scale-up').addEventListener('click', () => nudgeScale(0.01));
$('reset').addEventListener('click', () => {
  past().push(structuredClone(pile()));
  state.piles[state.model] = {};
  state.step = 0;
  $('sheet').hidden = true;
  save();
  refresh();
  go('find');
});
document.addEventListener('pointerdown', (event) => {
  if (!$('sheet').hidden && !event.target.closest('#sheet, #menu')) $('sheet').hidden = true;
});
$('canvas').addEventListener('dblclick', () => viewer.resetView());

await load();
$('model-name').textContent = model().name;
$('model-size').textContent = model().size;
applyTheme();
renderScale();
refresh();
show();
