// Klocki: Jurek as a BrickHeadz-style figure (hollow 6x5 head on a 4x3 body), every cell with fallback recipes.

const BRICKS = { 1: '3005', 2: '3004', 3: '3622', 4: '3010', 6: '3009' };
const PLATES = { 1: '3024', 2: '3023', 3: '3623', 4: '3710', 6: '3666' };
const WIDE_BRICKS = { 2: '3003', 3: '3002', 4: '3001' };
const WIDE_PLATES = { 2: '3022', 3: '3021', 4: '3020', 6: '3795' };
const SPLITS = { 1: [[1]], 2: [[2], [1, 1]], 3: [[3], [2, 1]], 4: [[4], [2, 2], [3, 1]], 6: [[6], [4, 2], [3, 3], [2, 2, 2]] };
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
    return loose(9, [
      [socket, pupil('4073')],
      [socket, pupil('98138')],
      [{ part: '3005', color: BLACK, x: xAt(i), y: yAt(17, 3), z: zAt(0), rot: 0 }],
    ]);
  };

  const hand = (sign) => {
    const i = sign < 0 ? 1 : 4;
    const socket = { part: '87087', color: BLACK, x: xAt(i), y: yAt(7, 3), z: zAt(2), rot: sign < 0 ? 90 : -90 };
    const palm = (part) => ({ part, color: skin, x: xAt(i) + sign * 18, y: yAt(7, 3) + 10, z: zAt(2), rz: sign * 90 });
    return loose(5, [
      [socket, palm('4073')],
      [socket, palm('3024')],
      [{ part: '3005', color: BLACK, x: xAt(i), y: yAt(7, 3), z: zAt(2), rot: 0 }],
    ]);
  };

  const fringe = loose(10, [
    [
      { part: '3023', color: skin, x: xAt(2.5), y: yAt(20, 1), z: zAt(0), rot: 0 },
      { part: '3023', color: hair, x: xAt(2.5), y: yAt(21, 1), z: zAt(0), rot: 0 },
      { part: '3023', color: hair, x: xAt(2.5), y: yAt(22, 1), z: zAt(0), rot: 0 },
    ],
    [{ part: '3004', color: hair, x: xAt(2.5), y: yAt(20, 3), z: zAt(0), rot: 0 }],
    [
      { part: '3005', color: hair, x: xAt(2), y: yAt(20, 3), z: zAt(0), rot: 0 },
      { part: '3005', color: hair, x: xAt(3), y: yAt(20, 3), z: zAt(0), rot: 0 },
    ],
  ]);

  const tuft = (part, i, j, h) => loose(12, [[{ part, color: hair, x: xAt(i), y: yAt(h, 1), z: zAt(j), rot: 0 }], []]);

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
        brickRun({ axis: 'x', i: 0, j: 4, n: 6, h: 14, color: hair, step: 8 }),
        brickRun({ axis: 'z', i: 0, j: 2, n: 3, h: 17, color: hair, step: 9 }),
        brickRun({ axis: 'z', i: 5, j: 2, n: 3, h: 17, color: hair, step: 9 }),
        brickRun({ axis: 'x', i: 1, j: 4, n: 4, h: 17, color: hair, step: 9 }),
        brickRun({ axis: 'x', i: 0, j: 0, n: 2, h: 20, color: hair, step: 10 }),
        brickRun({ axis: 'x', i: 4, j: 0, n: 2, h: 20, color: hair, step: 10 }),
        fringe,
        brickRun({ axis: 'z', i: 0, j: 1, n: 3, h: 20, color: hair, step: 10 }),
        brickRun({ axis: 'z', i: 5, j: 1, n: 3, h: 20, color: hair, step: 10 }),
        brickRun({ axis: 'x', i: 0, j: 4, n: 6, h: 20, color: hair, step: 10 }),
        plateSlab({ i: 0, j: 0, n: 6, h: 23, color: hair, step: 11 }),
        plateRun({ axis: 'x', i: 0, j: 2, n: 6, h: 23, color: hair, step: 11 }),
        plateSlab({ i: 0, j: 3, n: 6, h: 23, color: hair, step: 11 }),
        loose(12, [
          [
            { part: '3020', color: hair, x: xAt(2.5), y: yAt(24, 1), z: zAt(2.5), rot: 0 },
            { part: '3023', color: hair, x: xAt(2.5), y: yAt(25, 1), z: zAt(3), rot: 0 },
          ],
          [{ part: '3020', color: hair, x: xAt(2.5), y: yAt(24, 1), z: zAt(2.5), rot: 0 }],
          [
            { part: '3022', color: hair, x: xAt(1.5), y: yAt(24, 1), z: zAt(2.5), rot: 0 },
            { part: '3022', color: hair, x: xAt(3.5), y: yAt(24, 1), z: zAt(2.5), rot: 0 },
          ],
          [],
        ]),
        tuft('3022', 3.5, 0.5, 24),
        tuft('3023', 0.5, 1, 24),
      ],
    },
    { id: 'eyes', label: 'Oczy', uniform: true, recipes: fromCells, cells: [eye(1), eye(4)] },
    {
      id: 'face',
      label: 'Twarz',
      recipes: fromCells,
      cells: [
        plateSlab({ i: 0, j: 0, n: 6, h: 13, color: skin, step: 7 }),
        plateRun({ axis: 'x', i: 0, j: 2, n: 6, h: 13, color: skin, step: 7 }),
        plateSlab({ i: 0, j: 3, n: 6, h: 13, color: skin, step: 7 }),
        brickRun({ axis: 'x', i: 0, j: 0, n: 6, h: 14, color: skin, step: 8 }),
        brickRun({ axis: 'z', i: 0, j: 1, n: 3, h: 14, color: skin, step: 8 }),
        brickRun({ axis: 'z', i: 5, j: 1, n: 3, h: 14, color: skin, step: 8 }),
        brickRun({ axis: 'z', i: 0, j: 0, n: 2, h: 17, color: skin, step: 9 }),
        brickRun({ axis: 'z', i: 5, j: 0, n: 2, h: 17, color: skin, step: 9 }),
        brickRun({ axis: 'x', i: 2, j: 0, n: 2, h: 17, color: skin, step: 9 }),
      ],
    },
    { id: 'hands', label: 'Dłonie', uniform: true, recipes: fromCells, cells: [hand(-1), hand(1)] },
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
        brickRun({ axis: 'x', i: 1, j: 1, n: 4, h: 7, color: BLACK, step: 5 }),
        brickRun({ axis: 'x', i: 2, j: 2, n: 2, h: 7, color: BLACK, step: 5 }),
        brickRun({ axis: 'x', i: 1, j: 3, n: 4, h: 7, color: BLACK, step: 5 }),
        brickRun({ axis: 'x', i: 1, j: 1, n: 1, h: 10, color: BLACK, step: 6 }),
        brickRun({ axis: 'x', i: 4, j: 1, n: 1, h: 10, color: BLACK, step: 6 }),
        brickSlab({ i: 1, j: 2, n: 4, h: 10, color: BLACK, step: 6 }),
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
  size: '4,8 × 4,8 × 8,3 cm',
  notes: {
    2: 'Buty wystają o jedną wypustkę przed nogi.',
    5: 'Klocki z wypustką z boku idą na boki tułowia, wypustką na zewnątrz. Na wypustkę wciśnij okrągłą płytkę, to dłoń.',
    6: 'Żółty i biały klocek to znaczek na bluzie, idą z przodu.',
    8: 'Głowa jest pusta w środku. Tył już z koloru włosów.',
    9: 'Oko to klocek z wypustką do przodu i czarna okrągła płytka na wypustce.',
    10: 'Grzywka. Żółta płytka na środku to czoło widoczne między kosmykami.',
    12: 'Luźne płytki na górze robią potargane włosy. Możesz je poukładać po swojemu.',
  },
  roles: {
    hair: { label: 'Włosy', colors: [70, 6, 308] },
    skin: { label: 'Skóra', colors: [14, 19] },
    shoes: { label: 'Buty', colors: [2, 10, 27] },
  },
  build,
};
