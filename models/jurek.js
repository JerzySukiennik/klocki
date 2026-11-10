// Klocki: Jurek as a BrickHeadz-style figure. Hollow 6x5 head with an overhanging fringe and sloped hair, side-mounted arms, hood on the back.

const BRICKS = { 1: '3005', 2: '3004', 3: '3622', 4: '3010', 6: '3009' };
const PLATES = { 1: '3024', 2: '3023', 3: '3623', 4: '3710', 6: '3666' };
const WIDE_BRICKS = { 2: '3003', 3: '3002', 4: '3001' };
const WIDE_PLATES = { 2: '3022', 3: '3021', 4: '3020', 6: '3795' };
const SPLITS = {
  1: [[1]],
  2: [[2], [1, 1]],
  3: [[3], [2, 1]],
  4: [[4], [2, 2], [3, 1]],
  5: [[3, 2], [4, 1], [2, 2, 1]],
  6: [[6], [4, 2], [3, 3], [2, 2, 2]],
};
const WIDE_SPLITS = { 4: [[4], [2, 2]], 6: [[6], [4, 2], [3, 3], [2, 2, 2]] };
const BLACK = 0;
const WHITE = 15;
const ACCENT = 14;
const LEVELS = [0, 1, 2];

const xAt = (i) => -50 + 20 * i;
const zAt = (j) => -40 + 20 * j;
const yAt = (h, k) => -(h + k) * 8;

function line(table, k, { axis, i, j, h, color }, split, level = 0) {
  let offset = 0;
  return split.map((length) => {
    const mid = offset + (length - 1) / 2;
    offset += length;
    return {
      part: table[length],
      color,
      x: xAt(axis === 'x' ? i + mid : i),
      y: yAt(h + level, k),
      z: zAt(axis === 'x' ? j : j + mid),
      rot: axis === 'x' ? 0 : 90,
    };
  });
}

function slab(table, k, { i, j, h, color }, split) {
  let offset = 0;
  return split.map((length) => {
    const mid = offset + (length - 1) / 2;
    offset += length;
    return { part: table[length], color, x: xAt(i + mid), y: yAt(h, k), z: zAt(j + 0.5), rot: 0 };
  });
}

const rows = (table, k, cell, split) => [0, 1].flatMap((row) => line(table, k, { ...cell, axis: 'x', j: cell.j + row }, split));

const brickRun = (cell) => ({
  ...cell,
  options: [
    ...SPLITS[cell.n].map((split) => line(BRICKS, 3, cell, split)),
    ...SPLITS[cell.n].map((split) => LEVELS.flatMap((level) => line(PLATES, 1, cell, split, level))),
  ],
});

const plateRun = (cell) => ({ ...cell, options: SPLITS[cell.n].map((split) => line(PLATES, 1, cell, split)) });

const plateSlab = (cell) => ({
  ...cell,
  options: [
    ...WIDE_SPLITS[cell.n].map((split) => slab(WIDE_PLATES, 1, cell, split)),
    ...SPLITS[cell.n].slice(0, 2).map((split) => rows(PLATES, 1, cell, split)),
  ],
});

const brickSlab = (cell) => ({
  ...cell,
  options: [
    ...WIDE_SPLITS[cell.n].map((split) => slab(WIDE_BRICKS, 3, cell, split)),
    ...SPLITS[cell.n].slice(0, 2).map((split) => rows(BRICKS, 3, cell, split)),
  ],
});

const loose = (step, options) => ({ step, options });
const fromCells = (cell) => cell.options;

function build({ hair, skin, shoes }) {
  const eye = (i) => {
    const socket = { part: '87087', color: skin, x: xAt(i), y: yAt(17, 3), z: zAt(0), rot: 0 };
    const pupil = (part) => ({ part, color: BLACK, x: xAt(i), y: yAt(17, 3) + 10, z: zAt(0) - 18, rx: 90 });
    return loose(10, [
      [socket, pupil('98138')],
      [socket, pupil('4073')],
      [{ part: '3005', color: BLACK, x: xAt(i), y: yAt(17, 3), z: zAt(0), rot: 0 }],
    ]);
  };

  const arm = (sign) => {
    const i = sign < 0 ? 1 : 4;
    const socket = { part: '87087', color: BLACK, x: xAt(i), y: yAt(10, 3), z: zAt(2), rot: sign < 0 ? 90 : -90 };
    const long = { part: '3623', color: BLACK, x: sign * 48, y: -74, z: zAt(2), rz: sign * 90, step: 7 };
    const short = { part: '3023', color: BLACK, x: sign * 48, y: -84, z: zAt(2), rz: sign * 90, step: 7 };
    const hand = (part, y) => ({ part, color: skin, x: sign * 56, y, z: zAt(2), rz: sign * 90, step: 7 });
    return loose(6, [
      [socket, long, hand('4073', -54)],
      [socket, long, hand('3024', -54)],
      [socket, short, hand('4073', -74)],
      [socket, short, hand('3024', -74)],
      [socket, long],
      [socket, short],
      [{ part: '3005', color: BLACK, x: xAt(i), y: yAt(10, 3), z: zAt(2), rot: 0 }],
    ]);
  };

  const hood = (() => {
    const sockets = [2, 3].map((i) => ({ part: '87087', color: BLACK, x: xAt(i), y: yAt(10, 3), z: zAt(3), rot: 180 }));
    return loose(6, [
      [...sockets, { part: '85984', color: BLACK, x: 0, y: -94, z: 30, rx: -90 }],
      [...sockets, { part: '3023', color: BLACK, x: 0, y: -94, z: 38, rx: -90 }],
      [{ part: '3004', color: BLACK, x: 0, y: yAt(10, 3), z: zAt(3), rot: 0 }],
    ]);
  })();

  const strandTip = (i) =>
    loose(12, [
      [{ part: '4073', color: hair, x: xAt(i), y: yAt(20, 1), z: zAt(-1), rot: 0 }],
      [{ part: '3024', color: hair, x: xAt(i), y: yAt(20, 1), z: zAt(-1), rot: 0 }],
      [],
    ]);

  const edge = (i, j, rot) => {
    const along = rot === 0 || rot === 180;
    const pair = (part, h, turn) =>
      [-0.5, 0.5].map((d) => ({ part, color: hair, x: xAt(along ? i + d : i), y: h, z: zAt(along ? j : j + d), rot: turn }));
    const flat = (level) => ({ part: '3023', color: hair, x: xAt(i), y: yAt(24 + level, 1), z: zAt(j), rot: along ? 0 : 90 });
    return loose(13, [
      [{ part: '85984', color: hair, x: xAt(i), y: -192, z: zAt(j), rot }],
      pair('54200', -192, rot),
      [flat(0), flat(1)],
      [flat(0)],
      [],
    ]);
  };

  const spike = (i, j, rot) => loose(14, [[{ part: '54200', color: hair, x: xAt(i), y: -208, z: zAt(j), rot }], []]);

  const lock = (i, j) => loose(14, [[{ part: '3023', color: hair, x: xAt(i), y: yAt(25, 1), z: zAt(j), rot: 0 }], []]);

  const toe = (i) =>
    loose(3, [
      [{ part: '54200', color: shoes, x: xAt(i), y: -24, z: zAt(0), rot: 0 }],
      [{ part: '4073', color: shoes, x: xAt(i), y: yAt(3, 1), z: zAt(0), rot: 0 }],
      [{ part: '3024', color: shoes, x: xAt(i), y: yAt(3, 1), z: zAt(0), rot: 0 }],
      [],
    ]);

  const base = loose(1, [
    ...['3958', '3036', '3032', '41539', '3035', '3031'].map((part) => [{ part, color: BLACK, x: 0, y: yAt(0, 1), z: -10, rot: 0 }]),
    [],
  ]);

  return [
    {
      id: 'hair',
      label: 'Włosy',
      recipes: fromCells,
      cells: [
        brickRun({ axis: 'x', i: 0, j: 4, n: 6, h: 14, color: hair, step: 9 }),
        brickRun({ axis: 'z', i: 0, j: 0, n: 5, h: 17, color: hair, step: 10 }),
        brickRun({ axis: 'z', i: 5, j: 0, n: 5, h: 17, color: hair, step: 10 }),
        brickRun({ axis: 'x', i: 1, j: 4, n: 4, h: 17, color: hair, step: 10 }),
        brickRun({ axis: 'x', i: 0, j: 0, n: 1, h: 20, color: hair, step: 11 }),
        brickRun({ axis: 'x', i: 5, j: 0, n: 1, h: 20, color: hair, step: 11 }),
        brickRun({ axis: 'z', i: 0, j: 1, n: 3, h: 20, color: hair, step: 11 }),
        brickRun({ axis: 'z', i: 5, j: 1, n: 3, h: 20, color: hair, step: 11 }),
        brickRun({ axis: 'x', i: 0, j: 4, n: 6, h: 20, color: hair, step: 11 }),
        plateSlab({ i: 0, j: -1, n: 6, h: 23, color: hair, step: 12 }),
        plateSlab({ i: 0, j: 1, n: 6, h: 23, color: hair, step: 12 }),
        plateSlab({ i: 0, j: 3, n: 6, h: 23, color: hair, step: 12 }),
        plateRun({ axis: 'x', i: 0, j: -1, n: 6, h: 22, color: hair, step: 12 }),
        plateRun({ axis: 'x', i: 0, j: -1, n: 2, h: 21, color: hair, step: 12 }),
        plateRun({ axis: 'x', i: 3, j: -1, n: 3, h: 21, color: hair, step: 12 }),
        strandTip(0),
        strandTip(5),
        plateSlab({ i: 1, j: 0, n: 4, h: 24, color: hair, step: 13 }),
        plateSlab({ i: 1, j: 2, n: 4, h: 24, color: hair, step: 13 }),
        plateSlab({ i: 1, j: 1, n: 4, h: 25, color: hair, step: 13 }),
        edge(0.5, -1, 0),
        edge(2.5, -1, 0),
        edge(4.5, -1, 0),
        edge(0, 0.5, 90),
        edge(0, 2.5, 90),
        edge(5, 0.5, -90),
        edge(5, 2.5, -90),
        edge(0.5, 4, 180),
        edge(2.5, 4, 180),
        edge(4.5, 4, 180),
        lock(1.5, 0),
        lock(3.5, 3),
        spike(1, 1, 90),
        spike(3, 1, 0),
        spike(2, 2, 180),
        spike(4, 2, -90),
      ],
    },
    { id: 'eyes', label: 'Oczy', uniform: true, recipes: fromCells, cells: [eye(1), eye(4)] },
    {
      id: 'face',
      label: 'Twarz',
      recipes: fromCells,
      cells: [
        plateSlab({ i: 0, j: 0, n: 6, h: 13, color: skin, step: 8 }),
        plateRun({ axis: 'x', i: 0, j: 2, n: 6, h: 13, color: skin, step: 8 }),
        plateSlab({ i: 0, j: 3, n: 6, h: 13, color: skin, step: 8 }),
        brickRun({ axis: 'x', i: 0, j: 0, n: 6, h: 14, color: skin, step: 9 }),
        brickRun({ axis: 'z', i: 0, j: 1, n: 3, h: 14, color: skin, step: 9 }),
        brickRun({ axis: 'z', i: 5, j: 1, n: 3, h: 14, color: skin, step: 9 }),
        brickRun({ axis: 'x', i: 2, j: 0, n: 2, h: 17, color: skin, step: 10 }),
        brickRun({ axis: 'x', i: 1, j: 0, n: 4, h: 20, color: skin, step: 11 }),
      ],
    },
    { id: 'arms', label: 'Ręce', uniform: true, recipes: fromCells, cells: [arm(-1), arm(1)] },
    { id: 'hood', label: 'Kaptur', uniform: true, recipes: fromCells, cells: [hood] },
    {
      id: 'chest',
      label: 'Znaczek na bluzie',
      recipes: fromCells,
      cells: [
        brickRun({ axis: 'x', i: 2, j: 1, n: 1, h: 10, color: ACCENT, step: 6 }),
        brickRun({ axis: 'x', i: 3, j: 1, n: 1, h: 10, color: WHITE, step: 6 }),
      ],
    },
    {
      id: 'body',
      label: 'Bluza i spodnie',
      recipes: fromCells,
      cells: [
        brickRun({ axis: 'z', i: 1, j: 1, n: 3, h: 3, color: BLACK, step: 3 }),
        brickRun({ axis: 'z', i: 4, j: 1, n: 3, h: 3, color: BLACK, step: 3 }),
        plateSlab({ i: 1, j: 1, n: 4, h: 6, color: BLACK, step: 4 }),
        plateRun({ axis: 'x', i: 1, j: 3, n: 4, h: 6, color: BLACK, step: 4 }),
        brickSlab({ i: 1, j: 1, n: 4, h: 7, color: BLACK, step: 5 }),
        brickRun({ axis: 'x', i: 1, j: 3, n: 4, h: 7, color: BLACK, step: 5 }),
        brickRun({ axis: 'x', i: 1, j: 1, n: 1, h: 10, color: BLACK, step: 6 }),
        brickRun({ axis: 'x', i: 4, j: 1, n: 1, h: 10, color: BLACK, step: 6 }),
        brickRun({ axis: 'x', i: 2, j: 2, n: 2, h: 10, color: BLACK, step: 6 }),
        brickRun({ axis: 'x', i: 1, j: 3, n: 1, h: 10, color: BLACK, step: 6 }),
        brickRun({ axis: 'x', i: 4, j: 3, n: 1, h: 10, color: BLACK, step: 6 }),
      ],
    },
    {
      id: 'shoes',
      label: 'Buty',
      recipes: fromCells,
      cells: [1, 4].flatMap((i) => [
        plateRun({ axis: 'z', i, j: 0, n: 4, h: 1, color: shoes, step: 2 }),
        plateRun({ axis: 'z', i, j: 0, n: 4, h: 2, color: shoes, step: 2 }),
        toe(i),
      ]),
    },
    { id: 'base', label: 'Podstawka', uniform: true, recipes: fromCells, cells: [base] },
  ];
}

export default {
  id: 'jurek',
  name: 'Jurek',
  size: '4,8 × 4,8 × 8,8 cm',
  notes: {
    2: 'Buty wystają o jedną wypustkę przed nogi.',
    6: 'Klocki z wypustką z boku: dwa na boki (na ręce), dwa do tyłu (na kaptur). Żółty i biały klocek z przodu to znaczek na bluzie.',
    7: 'Ręka to czarna płytka wciśnięta pionowo, górnym końcem na boczną wypustkę. Dłoń wchodzi na dolną wypustkę tej płytki.',
    9: 'Głowa jest pusta w środku. Tył już z koloru włosów.',
    10: 'Oko to klocek z wypustką do przodu i czarny okrągły kafelek na wypustce.',
    12: 'Grzywkę przyczep od spodu do przedniej płytki dachu, dopiero potem załóż tę płytkę na głowę.',
    13: 'Skosy dookoła zaokrąglają fryzurę. Niską stroną na zewnątrz.',
    14: 'Luźne kosmyki. Możesz je poukładać po swojemu.',
  },
  roles: {
    hair: { label: 'Włosy', colors: [70, 6, 308] },
    skin: { label: 'Skóra', colors: [14, 19] },
    shoes: { label: 'Buty', colors: [2, 10, 27] },
  },
  build,
};
