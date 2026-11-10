// Klocki: greedy planner that fills every model cell with parts confirmed on the pile and lists what still has to be found.

import { keyOf, splitKey } from './catalog.js';

function tally(placements) {
  const needs = new Map();
  for (const p of placements) {
    const key = keyOf(p.part, p.color);
    needs.set(key, (needs.get(key) || 0) + 1);
  }
  return needs;
}

export function plan(model, pile) {
  const used = new Map();
  const order = [];
  const placements = [];
  const gaps = [];

  const left = (key) => {
    const entry = pile[key];
    return entry && entry.done ? entry.have - (used.get(key) || 0) : Infinity;
  };

  const fits = (built) => {
    for (const [key, count] of tally(built)) if (left(key) < count) return false;
    return true;
  };

  const take = (group, cell, built) => {
    for (const [key, count] of tally(built)) {
      if (!used.has(key)) order.push(key);
      used.set(key, (used.get(key) || 0) + count);
    }
    const step = group.step ? group.step(cell) : cell.step;
    for (const p of built) placements.push({ ...p, step, group: group.id });
  };

  const recipes = (group, cell) => (group.recipes ? group.recipes(cell) : group.options.map((option) => option.build(cell)));

  for (const group of model.groups) {
    if (group.uniform) {
      const sets = group.cells.map((cell) => recipes(group, cell));
      const count = Math.min(...sets.map((set) => set.length));
      let chosen = -1;
      for (let index = 0; index < count && chosen < 0; index += 1) {
        if (fits(sets.flatMap((set) => set[index]))) chosen = index;
      }
      if (chosen < 0) gaps.push({ group: group.id, label: group.label, count: group.cells.length });
      else group.cells.forEach((cell, index) => take(group, cell, sets[index][chosen]));
      continue;
    }
    let missing = 0;
    for (const cell of group.cells) {
      const built = recipes(group, cell).find(fits);
      if (built) take(group, cell, built);
      else missing += 1;
    }
    if (missing) gaps.push({ group: group.id, label: group.label, count: missing });
  }

  const colours = [];
  for (const key of order) {
    const { color } = splitKey(key);
    if (!colours.includes(color)) colours.push(color);
  }

  const ask = [];
  for (const key of order) {
    const have = pile[key]?.have || 0;
    const total = used.get(key);
    if (total > have) ask.push({ key, need: total - have, total, have });
  }
  ask.sort((a, b) => colours.indexOf(splitKey(a.key).color) - colours.indexOf(splitKey(b.key).color));

  return { placements, used, gaps, ask };
}

export function answer(pile, question, count) {
  const previous = pile[question.key] || { have: 0, done: false };
  const got = Math.max(0, Math.min(Math.floor(count), question.need));
  return { ...pile, [question.key]: { have: previous.have + got, done: got < question.need } };
}
