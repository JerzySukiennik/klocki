// Klocki: greedy planner that fills every model cell with parts confirmed on the pile and lists what still has to be found.

import { keyOf } from './catalog.js';

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
    for (const p of built) placements.push({ ...p, step: group.step(cell), group: group.id });
  };

  for (const group of model.groups) {
    if (group.uniform) {
      const option = group.options.find((o) => fits(group.cells.flatMap((cell) => o.build(cell))));
      if (option) for (const cell of group.cells) take(group, cell, option.build(cell));
      else gaps.push({ group: group.id, label: group.label, count: group.cells.length });
      continue;
    }
    let missing = 0;
    for (const cell of group.cells) {
      const option = group.options.find((o) => fits(o.build(cell)));
      if (option) take(group, cell, option.build(cell));
      else missing += 1;
    }
    if (missing) gaps.push({ group: group.id, label: group.label, count: missing });
  }

  const ask = [];
  for (const key of order) {
    const have = pile[key]?.have || 0;
    const total = used.get(key);
    if (total > have) ask.push({ key, need: total - have, total, have });
  }

  return { placements, used, gaps, ask };
}

export function answer(pile, question, count) {
  const previous = pile[question.key] || { have: 0, done: false };
  const got = Math.max(0, Math.min(Math.floor(count), question.need));
  return { ...pile, [question.key]: { have: previous.have + got, done: got < question.need } };
}
