// Klocki: Jurek as a 24 cm BrickHeadz-style statue. Hollow 16x14 head with layered 4x4 eyes, nose, smile, a two-tier side-mounted fringe and a curved hair dome; hollow 12x10 hoodie with a plate-mosaic chest logo, pocket, hood and hung arms; rounded clogs.

import { ANY } from '../src/catalog.js';

const BRICKS = { 1: '3005', 2: '3004', 3: '3622', 4: '3010', 6: '3009', 8: '3008' };
const PLATES = { 1: '3024', 2: '3023', 3: '3623', 4: '3710', 6: '3666', 8: '3460' };
const WIDE_BRICKS = { 2: '3003', 3: '3002', 4: '3001', 6: '2456', 8: '3007' };
const WIDE_PLATES = { 2: '3022', 3: '3021', 4: '3020', 6: '3795', 8: '3034' };
const NARROW = [8, 6, 4, 3, 2, 1];
const WIDE = [8, 6, 4, 3, 2];
const CAPS = [8, 6, 4, 2];
const LEVELS = [0, 1, 2];
const BLACK = 0;
const WHITE = 15;
const ACCENT = 14;

const H = { sole: 1, shoe: 2, toe: 5, leg: 7, hip: 17, torso: 18, floor: 36, head: 37, roof: 67, dome: 68 };
const FACE = -140;
const NAPE = 140;
const CHEST = -100;
const SPINE = 100;
const FLANK = 120;

const xAt = (i) => -150 + 20 * i;
const zAt = (j) => -130 + 20 * j;
const top = (h, k) => -(h + k) * 8;
const foot = (h) => -h * 8;
const stud = (h) => top(h, 3) + 10;
const loose = (step, options) => ({ step, options });
const fromCells = (cell) => cell.options;

function partition(n, cap, sizes) {
  const out = [];
  let left = n;
  while (left > 0) {
    const fits = sizes.filter((size) => size <= cap && size <= left);
    const size = fits.find((s) => left - s !== 1 || sizes.includes(1)) ?? null;
    const tidy = fits.find((s) => left - s !== 1) ?? size;
    if (!tidy) return null;
    out.push(tidy);
    left -= tidy;
  }
  return out;
}

function splits(n, sizes) {
  const seen = new Set();
  const out = [];
  for (const cap of CAPS) {
    const split = partition(n, cap, sizes);
    if (!split || seen.has(split.join())) continue;
    seen.add(split.join());
    out.push(split);
  }
  return out;
}

function line(table, k, { axis, i, j, h, color }, split, level = 0) {
  let offset = 0;
  return split.map((length) => {
    const mid = offset + (length - 1) / 2;
    offset += length;
    return {
      part: table[length],
      color,
      x: xAt(axis === 'x' ? i + mid : i),
      y: top(h + level, k),
      z: zAt(axis === 'x' ? j : j + mid),
      rot: axis === 'x' ? 0 : 90,
    };
  });
}

function slab(table, k, { axis, i, j, h, color }, split) {
  let offset = 0;
  return split.map((length) => {
    const mid = offset + (length - 1) / 2;
    offset += length;
    return {
      part: table[length],
      color,
      x: xAt(axis === 'x' ? i + mid : i + 0.5),
      y: top(h, k),
      z: zAt(axis === 'x' ? j + 0.5 : j + mid),
      rot: axis === 'x' ? 0 : 90,
    };
  });
}

const twoLines = (table, k, cell, split) =>
  [0, 1].flatMap((d) => line(table, k, cell.axis === 'x' ? { ...cell, j: cell.j + d } : { ...cell, i: cell.i + d }, split));

const brickRun = (cell) => ({
  ...cell,
  options: [
    ...splits(cell.n, NARROW).map((split) => line(BRICKS, 3, cell, split)),
    ...splits(cell.n, NARROW).map((split) => LEVELS.flatMap((level) => line(PLATES, 1, cell, split, level))),
  ],
});

const plateRun = (cell) => ({ ...cell, options: splits(cell.n, NARROW).map((split) => line(PLATES, 1, cell, split)) });

const plateSlab = (cell) => ({
  ...cell,
  options: [
    ...splits(cell.n, WIDE).map((split) => slab(WIDE_PLATES, 1, cell, split)),
    ...splits(cell.n, NARROW).slice(0, 2).map((split) => twoLines(PLATES, 1, cell, split)),
  ],
});

const brickSlab = (cell) => ({
  ...cell,
  options: [
    ...splits(cell.n, WIDE).map((split) => slab(WIDE_BRICKS, 3, cell, split)),
    ...splits(cell.n, NARROW).slice(0, 2).map((split) => twoLines(BRICKS, 3, cell, split)),
  ],
});

function chunked(make, cell, flip) {
  const lengths = cell.n <= 8 ? [cell.n] : partition(cell.n, 8, NARROW);
  if (flip) lengths.reverse();
  let offset = 0;
  return lengths.map((n) => {
    const piece = make({ ...cell, n, i: cell.axis === 'x' ? cell.i + offset : cell.i, j: cell.axis === 'x' ? cell.j : cell.j + offset });
    offset += n;
    return piece;
  });
}

function ring({ k, h, i0, i1, j0, j1, color, skip, step }) {
  const even = k % 2 === 0;
  const cells = [];
  const sides = [
    { axis: 'x', fixed: j0, from: even ? i0 + 1 : i0, to: even ? i1 - 1 : i1 },
    { axis: 'x', fixed: j1, from: even ? i0 + 1 : i0, to: even ? i1 - 1 : i1 },
    { axis: 'z', fixed: i0, from: even ? j0 : j0 + 1, to: even ? j1 : j1 - 1 },
    { axis: 'z', fixed: i1, from: even ? j0 : j0 + 1, to: even ? j1 : j1 - 1 },
  ];
  const emit = (run) => {
    const colors = run.key.split(',').map(Number);
    const cell = { axis: run.axis, i: run.axis === 'x' ? run.start : run.fixed, j: run.axis === 'x' ? run.fixed : run.start, n: run.n, h, step };
    if (colors.every((c) => c === colors[0])) cells.push(...chunked(brickRun, { ...cell, color: colors[0] }, even));
    else LEVELS.forEach((level) => cells.push(...chunked(plateRun, { ...cell, h: h + level, color: colors[level] }, even)));
  };
  for (const side of sides) {
    let run = null;
    for (let t = side.from; t <= side.to + 1; t += 1) {
      const i = side.axis === 'x' ? t : side.fixed;
      const j = side.axis === 'x' ? side.fixed : t;
      const key = t > side.to || skip(k, i, j) ? null : LEVELS.map((level) => color(k, i, j, level)).join(',');
      if (run && run.key === key) {
        run.n += 1;
        continue;
      }
      if (run) emit(run);
      run = key === null ? null : { key, n: 1, start: t, axis: side.axis, fixed: side.fixed };
    }
  }
  return cells;
}

function holders(color, axis, i, j, h, rot, n) {
  const at = (offset, part) => ({ part, color, x: xAt(axis === 'x' ? i + offset : i), y: top(h, 3), z: zAt(axis === 'x' ? j : j + offset), rot });
  const singles = Array.from({ length: n }, (_, k) => at(k, '87087'));
  if (n === 1) return [singles];
  const twins = Array.from({ length: n / 2 }, (_, k) => at(2 * k + 0.5, '11211'));
  return n === 4 ? [[at(1.5, '30414')], twins, singles] : [twins, singles];
}

function build({ hair, skin, eyes, shoes }) {
  const head = [];
  const face = [];
  const hoodie = [];
  const limbs = [];
  const feet = [];
  const hidden = [];

  const headColor = (k, i, j, level) => {
    if (j === 13) return hair;
    if (j === 0) {
      if (i === 0 || i === 15) return k >= 5 ? hair : skin;
      if (k === 2 && level === 2 && i >= 6 && i <= 9) return BLACK;
      if (k === 3 && level === 0 && (i === 5 || i === 10)) return BLACK;
      return skin;
    }
    const hairFrom = k <= 2 ? 7 : k <= 4 ? 6 : 0;
    return j >= hairFrom ? hair : skin;
  };

  const headSkip = (k, i, j) => {
    if (j !== 0) return false;
    if (k >= 8) return i >= 1 && i <= 14;
    if (k === 5) return (i >= 2 && i <= 5) || (i >= 10 && i <= 13);
    if (k === 4) return i === 7 || i === 8;
    return false;
  };

  const LOGO = ['WWWWWW', 'WKKWWK', 'WKKWKW', 'WYYWWK', 'WKKWKW', 'WWWWWW'];
  const INK = { W: WHITE, K: BLACK, Y: ACCENT };

  const torsoColor = (k, i, j, level) => {
    if (j !== 2) return BLACK;
    if ((k === 4 || k === 5) && i >= 5 && i <= 10) return INK[LOGO[(k - 4) * 3 + level][i - 5]];
    if (k === 6 && (i === 6 || i === 9)) return WHITE;
    return BLACK;
  };

  const torsoSkip = (k, i, j) => {
    if (k === 2 && j === 2) return i >= 4 && i <= 11;
    if (k === 6 && j === 11) return i >= 4 && i <= 11;
    if (k === 6 && (i === 2 || i === 13)) return j >= 5 && j <= 8;
    return false;
  };

  const base = loose(1, [
    [{ part: '91405', color: BLACK, x: 0, y: top(0, 1), z: -10, rot: 0 }],
    [-80, 80].flatMap((x) => [-90, 70].map((z) => ({ part: '41539', color: BLACK, x, y: top(0, 1), z, rot: 0 }))),
    [],
  ]);

  for (const a of [3, 9]) {
    const x = xAt(a + 1.5);
    feet.push(
      loose(2, [
        [{ part: '3030', color: shoes, x, y: top(H.sole, 1), z: zAt(4.5), rot: 90 }],
        [
          { part: '3032', color: shoes, x, y: top(H.sole, 1), z: zAt(2.5), rot: 90 },
          { part: '3031', color: shoes, x, y: top(H.sole, 1), z: zAt(7.5), rot: 0 },
        ],
        [0, 2].flatMap((d) => slab(WIDE_PLATES, 1, { axis: 'z', i: a + d, j: 0, h: H.sole, color: shoes }, [6, 4])),
      ]),
      brickSlab({ axis: 'z', i: a, j: 4, n: 6, h: H.shoe, color: shoes, step: 3 }),
      brickSlab({ axis: 'z', i: a + 2, j: 4, n: 6, h: H.shoe, color: shoes, step: 3 }),
      brickSlab({ axis: 'x', i: a, j: 0, n: 4, h: H.shoe, color: shoes, step: 3 }),
      brickSlab({ axis: 'x', i: a, j: 2, n: 4, h: H.shoe, color: shoes, step: 3 }),
      plateSlab({ axis: 'x', i: a, j: 4, n: 4, h: H.toe, color: shoes, step: 4 }),
      plateSlab({ axis: 'x', i: a, j: 6, n: 4, h: H.toe, color: shoes, step: 4 }),
      plateSlab({ axis: 'x', i: a, j: 8, n: 4, h: H.toe, color: shoes, step: 4 }),
      plateSlab({ axis: 'z', i: a, j: 4, n: 6, h: H.toe + 1, color: shoes, step: 4 }),
      plateSlab({ axis: 'z', i: a + 2, j: 4, n: 6, h: H.toe + 1, color: shoes, step: 4 }),
      plateSlab({ axis: 'x', i: a, j: 2, n: 4, h: H.toe, color: shoes, step: 4 }),
      plateSlab({ axis: 'x', i: a, j: 2, n: 4, h: H.toe + 1, color: shoes, step: 4 }),
      ...[0.5, 2.5].map((d) =>
        loose(4, [
          [{ part: '15068', color: shoes, x: xAt(a + d), y: foot(H.toe), z: zAt(0.5), rot: 0 }],
          [-10, 10].map((dx) => ({ part: '11477', color: shoes, x: xAt(a + d) + dx, y: foot(H.toe), z: zAt(0.5), rot: 0 })),
          [0, 1].map((level) => ({ part: '3022', color: shoes, x: xAt(a + d), y: top(H.toe + level, 1), z: zAt(0.5), rot: 0 })),
          [],
        ]),
      ),
    );
    limbs.push(
      brickSlab({ axis: 'z', i: a, j: 4, n: 6, h: H.leg, color: BLACK, step: 5 }),
      brickSlab({ axis: 'z', i: a + 2, j: 4, n: 6, h: H.leg, color: BLACK, step: 5 }),
      ...[4, 6, 8].map((j) => brickSlab({ axis: 'x', i: a, j, n: 4, h: H.leg + 3, color: BLACK, step: 6 })),
      brickSlab({ axis: 'z', i: a, j: 4, n: 6, h: H.leg + 6, color: BLACK, step: 7 }),
      brickSlab({ axis: 'z', i: a + 2, j: 4, n: 6, h: H.leg + 6, color: BLACK, step: 7 }),
      ...[4, 6, 8].map((j) => plateSlab({ axis: 'x', i: a, j, n: 4, h: H.leg + 9, color: BLACK, step: 7 })),
    );
  }

  for (const j of [2, 4, 6, 8, 10]) hoodie.push(...chunked(plateSlab, { axis: 'x', i: 2, j, n: 12, h: H.hip, color: BLACK, step: 8 }, j % 4 === 0));

  for (let k = 1; k <= 6; k += 1) {
    hoodie.push(...ring({ k, h: H.torso + 3 * (k - 1), i0: 2, i1: 13, j0: 2, j1: 11, color: torsoColor, skip: torsoSkip, step: 8 + k }));
  }

  const pocketLevel = H.torso + 3;
  const collar = H.torso + 15;
  for (const i of [4, 8]) {
    const centre = { x: xAt(i + 1.5), y: stud(pocketLevel) + 10 };
    const sets = holders(BLACK, 'x', i, 2, pocketLevel, 0, 4);
    hoodie.push(
      loose(10, [
        ...sets.map((set) => [...set, { part: '87079', color: BLACK, ...centre, z: CHEST - 8, rx: 90, step: 15 }]),
        ...sets.map((set) => [...set, { part: '3020', color: BLACK, ...centre, z: CHEST - 8, rx: 90, step: 15 }]),
        line(BRICKS, 3, { axis: 'x', i, j: 2, h: pocketLevel, color: BLACK }, [4]),
      ]),
    );
    const back = holders(BLACK, 'x', i, 11, collar, 180, 4);
    const bulge = [0.5, 2.5].map((d) => ({ part: '15068', color: BLACK, x: xAt(i + d), y: stud(collar) + 10, z: SPINE, rx: -90, step: 15 }));
    const curls = [0, 1, 2, 3].map((d) => ({ part: '11477', color: BLACK, x: xAt(i + d), y: stud(collar) + 10, z: SPINE, rx: -90, step: 15 }));
    hoodie.push(
      loose(14, [
        ...back.map((set) => [...set, ...bulge]),
        ...back.map((set) => [...set, ...curls]),
        line(BRICKS, 3, { axis: 'x', i, j: 11, h: collar, color: BLACK }, [4]),
      ]),
    );
  }

  const arm = (sign) => {
    const i = sign < 0 ? 2 : 13;
    const s = stud(collar);
    const sets = holders(BLACK, 'z', i, 5, collar, sign < 0 ? 90 : -90, 4);
    const side = (part, color, layer, dy, j = 6.5) => ({ part, color, x: sign * (FLANK + 8 + 8 * layer), y: s + dy, z: zAt(j), rz: sign * 90, step: 15 });
    const across = (part, color, layer, dy) => ({ ...side(part, color, layer, dy), rx: 90 });
    const joints = [5, 6, 7, 8].map((j) => side('4073', BLACK, 0, 0, j));
    const limb = side('3035', BLACK, 1, 70);
    const block = (color, dy) => ({ part: '3001', color, x: sign * (FLANK + 40), y: s + dy, z: zAt(6.5), rx: 90, rz: sign * 90, step: 15 });
    const shoulder = { part: '3037', color: BLACK, x: sign * (FLANK + 40), y: s + 20, z: zAt(6.5), rx: -90, rz: sign * 90, step: 15 };
    const badge = { part: '14769', color: WHITE, x: sign * (FLANK + 48), y: s + 50, z: zAt(6.5), rz: sign * 90, step: 15 };
    const sleeve = [block(BLACK, 50), block(BLACK, 90)];
    const hand = block(skin, 130);
    const thin = [across('2431', BLACK, 2, 40), across('3020', BLACK, 2, 70), across('2431', BLACK, 2, 100), across('3020', skin, 2, 130)];
    return loose(14, [
      ...sets.map((set) => [...set, ...joints, limb, shoulder, ...sleeve, hand, badge]),
      ...sets.map((set) => [...set, ...joints, limb, shoulder, ...sleeve, hand]),
      ...sets.map((set) => [...set, ...joints, limb, block(BLACK, 10), ...sleeve, hand]),
      ...sets.map((set) => [...set, ...joints, limb, ...thin]),
      ...sets.map((set) => [...set, ...joints, limb, across('3020', skin, 2, 130)]),
      line(BRICKS, 3, { axis: 'z', i, j: 5, h: collar, color: BLACK }, [4]),
    ]);
  };

  face.push(
    ...chunked(plateSlab, { axis: 'x', i: 0, j: 0, n: 16, h: H.floor, color: skin, step: 16 }, false),
    ...chunked(plateSlab, { axis: 'x', i: 0, j: 12, n: 16, h: H.floor, color: skin, step: 16 }, true),
    ...chunked(plateSlab, { axis: 'z', i: 0, j: 2, n: 10, h: H.floor, color: skin, step: 16 }, false),
    ...chunked(plateSlab, { axis: 'z', i: 14, j: 2, n: 10, h: H.floor, color: skin, step: 16 }, true),
  );
  for (const j of [2, 4, 6, 8, 10]) hidden.push(...chunked(plateSlab, { axis: 'x', i: 2, j, n: 12, h: H.floor, color: ANY, step: 16 }, j % 4 === 0));

  const layer = (k) => H.head + 3 * (k - 1);
  for (let k = 1; k <= 10; k += 1) {
    head.push(...ring({ k, h: layer(k), i0: 0, i1: 15, j0: 0, j1: 13, color: headColor, skip: headSkip, step: 16 + k }));
  }

  const eye = (i) => {
    const level = layer(5);
    const cx = xAt(i + 1.5);
    const cy = stud(level) + 10;
    const front = (part, color, dx, dy, depth) => ({ part, color, x: cx + dx, y: cy + dy, z: FACE - depth, rx: 90, step: 27 });
    const iris = front('60474', eyes, 0, 0, 8);
    const pupil = front('14769', BLACK, 0, 0, 16);
    const glints = [front('98138', WHITE, -10, -30, 16), front('98138', WHITE, -30, -10, 16)];
    const sets = holders(skin, 'x', i, 0, level, 0, 4);
    return loose(21, [
      ...sets.map((set) => [...set, iris, pupil, ...glints]),
      ...sets.map((set) => [...set, iris, pupil]),
      ...sets.map((set) => [...set, iris, ...glints]),
      ...sets.map((set) => [...set, iris]),
      ...sets.map((set) => [...set, front('4032a', BLACK, 0, 0, 8), front('98138', WHITE, -10, -10, 16)]),
      line(BRICKS, 3, { axis: 'x', i, j: 0, h: level, color: BLACK }, [4]),
    ]);
  };

  const nose = (() => {
    const level = layer(4);
    const sets = holders(skin, 'x', 7, 0, level, 0, 2);
    const tip = { part: '85984', color: skin, x: 0, y: stud(level), z: FACE, rx: -90, rz: 180, step: 27 };
    return loose(20, [...sets.map((set) => [...set, tip]), line(BRICKS, 3, { axis: 'x', i: 7, j: 0, h: level, color: skin }, [2])]);
  })();

  const upper = H.head + 27;
  const lower = H.head + 22;
  head.push(
    ...chunked(plateRun, { axis: 'x', i: 1, j: 0, n: 14, h: H.head + 21, color: skin, step: 24 }, false),
    ...chunked(plateRun, { axis: 'x', i: 1, j: 0, n: 14, h: H.head + 25, color: skin, step: 25 }, true),
    ...chunked(plateRun, { axis: 'x', i: 1, j: 0, n: 14, h: H.head + 26, color: skin, step: 25 }, false),
  );

  const hang = (part, i, h, down) => ({ part, color: hair, x: xAt(i), y: stud(h) + 10, z: FACE, ...(down ? { rx: 90 } : { rx: -90, rz: 180 }), step: 28 });
  const tile = (part, i, h, upright) => ({ part, color: hair, x: xAt(i), y: stud(h) + 10, z: FACE - 8, rx: 90, ...(upright ? { rot: 90 } : {}), step: 28 });
  const wide = (i, h, down) => [[hang('15068', i + 0.5, h, down)], [hang('11477', i, h, down), hang('11477', i + 1, h, down)], [tile('3068b', i + 0.5, h, false)]];
  const thin = (i, h) => [[hang('11477', i, h, true)], [tile('3069b', i, h, true)]];

  const fringe = (step, i, n, h, pieces, plain) => {
    const sets = holders(skin, 'x', i, 0, h, 0, n);
    const looks = pieces[0].map((_, rank) => pieces.flatMap((list) => list[Math.min(rank, list.length - 1)]));
    return loose(step, [
      ...looks.flatMap((look) => sets.map((set) => [...set, ...look])),
      line(BRICKS, 3, { axis: 'x', i, j: 0, h, color: plain }, [n]),
    ]);
  };

  head.push(
    fringe(24, 1, 4, lower, [wide(1, lower, true), wide(3, lower, true)], skin),
    fringe(24, 5, 1, lower, [thin(5, lower)], skin),
    ...chunked(brickRun, { axis: 'x', i: 6, j: 0, n: 1, h: lower, color: skin, step: 24 }, false),
    fringe(24, 7, 4, lower, [thin(7, lower), wide(8, lower, true), thin(10, lower)], skin),
    fringe(24, 11, 4, lower, [wide(11, lower, true), wide(13, lower, true)], skin),
    fringe(26, 1, 4, upper, [wide(1, upper, false), wide(3, upper, false)], hair),
    fringe(26, 5, 4, upper, [wide(5, upper, false), wide(7, upper, false)], hair),
    fringe(26, 9, 4, upper, [wide(9, upper, false), wide(11, upper, false)], hair),
    fringe(26, 13, 2, upper, [wide(13, upper, false)], hair),
  );

  head.push(
    ...chunked(plateSlab, { axis: 'x', i: 0, j: -1, n: 16, h: H.roof, color: hair, step: 29 }, false),
    ...chunked(plateSlab, { axis: 'x', i: 0, j: 12, n: 16, h: H.roof, color: hair, step: 29 }, true),
    ...chunked(plateSlab, { axis: 'z', i: 0, j: 1, n: 11, h: H.roof, color: hair, step: 29 }, false),
    ...chunked(plateSlab, { axis: 'z', i: 14, j: 1, n: 11, h: H.roof, color: hair, step: 29 }, true),
  );
  for (const j of [1, 3, 5, 7, 9]) hidden.push(...chunked(plateSlab, { axis: 'x', i: 2, j, n: 12, h: H.roof, color: ANY, step: 29 }, j % 4 === 1));
  hidden.push(...chunked(plateRun, { axis: 'x', i: 2, j: 11, n: 12, h: H.roof, color: ANY, step: 29 }, false));

  const curl = (step, h, i, j, rot) => {
    const along = rot === 0 || rot === 180;
    const lean = { 0: [0, 10], 180: [0, -10], 90: [10, 0], [-90]: [-10, 0] }[rot];
    return loose(step, [
      [{ part: '15068', color: hair, x: xAt(i), y: foot(h), z: zAt(j), rot }],
      [-0.5, 0.5].map((d) => ({ part: '11477', color: hair, x: xAt(along ? i + d : i), y: foot(h), z: zAt(along ? j : j + d), rot })),
      [{ part: '3039', color: hair, x: xAt(i) + lean[0], y: top(h, 3), z: zAt(j) + lean[1], rot }],
      [0, 1].map((level) => ({ part: '3022', color: hair, x: xAt(i), y: top(h + level, 1), z: zAt(j), rot: 0 })),
      [],
    ]);
  };

  const wisp = (step, h, i, j, rot) =>
    loose(step, [
      [{ part: '11477', color: hair, x: xAt(i), y: foot(h), z: zAt(j), rot }],
      [0, 1].map((level) => ({ part: '3023', color: hair, x: xAt(i), y: top(h + level, 1), z: zAt(j), rot: rot === 0 || rot === 180 ? 90 : 0 })),
      [],
    ]);

  const tier = (step, h, i0, i1, j0, j1) => {
    const out = [];
    for (let i = i0; i < i1; i += 2) out.push(curl(step, h, i + 0.5, j0 + 0.5, 0), curl(step, h, i + 0.5, j1 - 0.5, 180));
    let j = j0 + 2;
    for (; j + 1 <= j1 - 2; j += 2) out.push(curl(step, h, i0 + 0.5, j + 0.5, 90), curl(step, h, i1 - 0.5, j + 0.5, -90));
    if (j <= j1 - 2) out.push(wisp(step, h, i0 + 0.5, j, 90), wisp(step, h, i1 - 0.5, j, -90));
    return out;
  };

  const deck = (step, h, i0, i1, j0, j1, color, rim = color) => {
    const out = [];
    const width = i1 - i0 + 1;
    const depth = j1 - j0 + 1;
    let j = j0;
    for (; j + 1 <= j1; j += 2) out.push(...chunked(plateSlab, { axis: 'x', i: i0, j, n: width, h, color, step }, j % 4 === 1));
    if (j <= j1) out.push(...chunked(plateRun, { axis: 'x', i: i0, j, n: width, h, color, step }, false));
    for (let i = i0; i + 1 <= i1; i += 2) {
      out.push(...chunked(plateSlab, { axis: 'z', i, j: j0, n: depth, h: h + 1, color: i === i0 || i + 1 === i1 ? rim : color, step }, i % 4 === 0));
    }
    return out;
  };

  head.push(...tier(30, H.dome, 0, 15, -1, 13));
  hidden.push(...deck(30, H.dome, 2, 13, 1, 11, ANY, hair));
  head.push(...tier(31, H.dome + 2, 2, 13, 1, 11));
  hidden.push(...deck(31, H.dome + 2, 4, 11, 3, 9, ANY));
  for (const j of [3, 5, 7]) head.push(...chunked(plateSlab, { axis: 'x', i: 4, j, n: 8, h: H.dome + 4, color: hair, step: 32 }, false));
  head.push(...chunked(plateRun, { axis: 'x', i: 4, j: 9, n: 8, h: H.dome + 4, color: hair, step: 32 }, false));
  head.push(
    curl(33, H.dome + 5, 6.5, 4.5, 0),
    curl(33, H.dome + 5, 8.5, 4.5, -90),
    curl(33, H.dome + 5, 8.5, 6.5, 180),
    curl(33, H.dome + 5, 6.5, 6.5, 90),
    wisp(33, H.dome + 5, 4.5, 4, 90),
    wisp(33, H.dome + 5, 10.5, 7, -90),
    wisp(33, H.dome + 5, 5, 8.5, 180),
    wisp(33, H.dome + 5, 10, 3.5, 0),
  );

  return [
    { id: 'head', label: 'Głowa i włosy', recipes: fromCells, cells: head },
    { id: 'eyes', label: 'Oczy', uniform: true, recipes: fromCells, cells: [eye(2), eye(10)] },
    { id: 'face', label: 'Twarz', recipes: fromCells, cells: [...face, nose] },
    { id: 'arms', label: 'Ręce', uniform: true, recipes: fromCells, cells: [arm(-1), arm(1)] },
    { id: 'hoodie', label: 'Bluza', recipes: fromCells, cells: hoodie },
    { id: 'legs', label: 'Spodnie', recipes: fromCells, cells: limbs },
    { id: 'shoes', label: 'Buty', recipes: fromCells, cells: feet },
    { id: 'base', label: 'Podstawka', uniform: true, recipes: fromCells, cells: [base] },
    { id: 'hidden', label: 'Wypełnienie w środku', recipes: fromCells, cells: hidden },
  ];
}

export default {
  id: 'jurek',
  name: 'Jurek',
  size: '12,8 × 12,8 × 24 cm',
  notes: {
    2: 'Podeszwy butów na całą długość, czubki wystają przed nogi.',
    4: 'Łukowe noski Crocsów. Wypustki za nimi to dziurki w butach.',
    8: 'Płyta bioder spina obie nogi i jest dnem bluzy.',
    10: 'Bluza jest pusta w środku. W tej warstwie z przodu idą klocki z bocznymi wypustkami pod kieszeń.',
    12: 'Logo na piersi układasz z płytek, warstwa po warstwie. Patrz na kolory w podglądzie.',
    14: 'Klocki z wypustkami: po bokach pod ręce, z tyłu pod kaptur. Dwa białe klocki z przodu to sznurki kaptura.',
    15: 'Kieszeń to dwa kafelki 2×4 z przodu. Kaptur to łukowe skosy z tyłu, cienkim końcem do góry. Ręka: cztery okrągłe płytki na bocznych wypustkach, na nich pionowo płytka 4×8, a na niej bokiem skos dachowy (bark), dwa czarne klocki 2×4 (rękaw) i żółty klocek 2×4 (dłoń). Białe kółko na rękawie to logo.',
    16: 'Podłoga głowy. Środek może być z dowolnych kolorów, nie będzie go widać.',
    18: 'Czarne płytki w tej i następnej warstwie to uśmiech.',
    20: 'Klocek z dwiema wypustkami na środku twarzy jest pod nos.',
    21: 'Dwa klocki 1×4 z wypustkami są pod oczy.',
    24: 'Od tej warstwy przód głowy to klocki z wypustkami pod grzywkę. Jeden zwykły żółty klocek zostawia przedziałek.',
    27: 'Oko: okrągła płytka 4×4 na czterech wypustkach (tęczówka), na środku czarny okrągły kafelek 2×2 (źrenica), a w lewym górnym rogu dwa białe kafelki 1×1 (błysk). Nos: niski skos cienkim końcem do góry.',
    28: 'Grzywka w dwóch piętrach. Górne skosy cienkim końcem do góry, dolne cienkim końcem w dół.',
    29: 'Dach głowy. Brąz tylko dookoła, środek z dowolnych kolorów.',
    30: 'Pierwszy pierścień włosów: łukowe skosy niską stroną na zewnątrz.',
    33: 'Wicherek na czubku i kilka luźnych kosmyków.',
  },
  roles: {
    hair: { label: 'Włosy', colors: [70, 6, 308] },
    skin: { label: 'Skóra', colors: [14, 19] },
    eyes: { label: 'Oczy', colors: [0, 2, 70] },
    shoes: { label: 'Buty', colors: [2, 10, 27] },
  },
  build,
};
