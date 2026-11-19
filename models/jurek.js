// Klocki: Jurek as a large BrickHeadz-style figure. Hollow 8x7 head with 2x2 eyes, a fringe of side-mounted curved strands and a curved hair dome; 6x5 body with arms hung off the torso, hood and rounded shoes.

const BRICKS = { 1: '3005', 2: '3004', 3: '3622', 4: '3010', 6: '3009', 8: '3008' };
const PLATES = { 1: '3024', 2: '3023', 3: '3623', 4: '3710', 6: '3666', 8: '3460' };
const WIDE_BRICKS = { 2: '3003', 3: '3002', 4: '3001', 6: '2456', 8: '3007' };
const WIDE_PLATES = { 2: '3022', 3: '3021', 4: '3020', 6: '3795', 8: '3034' };
const SPLITS = {
  1: [[1]],
  2: [[2], [1, 1]],
  3: [[3], [2, 1]],
  4: [[4], [2, 2], [3, 1]],
  5: [[3, 2], [4, 1], [2, 2, 1]],
  6: [[6], [4, 2], [3, 3], [2, 2, 2]],
  7: [[4, 3], [6, 1], [3, 2, 2]],
  8: [[8], [4, 4], [6, 2], [3, 3, 2], [2, 2, 2, 2]],
};
const WIDE_SPLITS = {
  4: [[4], [2, 2]],
  6: [[6], [4, 2], [3, 3], [2, 2, 2]],
  8: [[8], [4, 4], [6, 2], [4, 2, 2], [2, 2, 2, 2]],
};
const BLACK = 0;
const WHITE = 15;
const ACCENT = 14;
const LEVELS = [0, 1, 2];
const H = { sole: 1, shoe: 2, leg: 4, thigh: 7, hip: 9, b1: 10, b2: 13, b3: 16, floor: 19, l1: 20, l2: 23, l3: 26, l4: 29, l5: 32, roof: 35, t1: 36, t2: 38 };
const FACE = -70;
const BACK = 50;
const SIDE = 60;

const xAt = (i) => -70 + 20 * i;
const zAt = (j) => -60 + 20 * j;
const top = (h, k) => -(h + k) * 8;
const foot = (h) => -h * 8;
const sideStud = (h) => top(h, 3) + 10;

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

function slab(table, k, { i, j, h, color }, split) {
  let offset = 0;
  return split.map((length) => {
    const mid = offset + (length - 1) / 2;
    offset += length;
    return { part: table[length], color, x: xAt(i + mid), y: top(h, k), z: zAt(j + 0.5), rot: 0 };
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
const walls = (step, list) => list.map((cell) => brickRun({ ...cell, step }));

function build({ hair, skin, shoes }) {
  const socket = (color, i, j, h, rot) => ({ part: '87087', color, x: xAt(i), y: top(h, 3), z: zAt(j), rot });
  const twin = (color, i, j, h, rot) => ({ part: '11211', color, x: xAt(i + 0.5), y: top(h, 3), z: zAt(j), rot });
  const sockets = (color, i, j, h, rot) => [[twin(color, i, j, h, rot)], [socket(color, i, j, h, rot), socket(color, i + 1, j, h, rot)]];

  const strand = (kind, i, h) => {
    const y = sideStud(h) + 10;
    if (kind === 'curl') return { part: '11477', color: hair, x: xAt(i), y, z: FACE, rx: 90 };
    return { part: kind, color: hair, x: xAt(i), y, z: FACE - 8, rx: 90, rot: 90 };
  };
  const strandKinds = ['curl', '3069b', '3023'];

  const fringePair = (i) =>
    loose(14, [
      ...strandKinds.flatMap((kind) => sockets(skin, i, 0, H.l5, 0).map((holder) => [...holder, strand(kind, i, H.l5), strand(kind, i + 1, H.l5)])),
      [{ part: '3004', color: hair, x: xAt(i + 0.5), y: top(H.l5, 3), z: zAt(0), rot: 0 }],
    ]);

  const fringeOne = (i, h, step, plain) =>
    loose(step, [
      ...strandKinds.map((kind) => [socket(skin, i, 0, h, 0), strand(kind, i, h)]),
      [{ part: '3005', color: plain, x: xAt(i), y: top(h, 3), z: zAt(0), rot: 0 }],
    ]);

  const eye = (i) => {
    const centre = { x: xAt(i + 0.5), y: sideStud(H.l3) + 10 };
    const disc = { part: '4032a', color: BLACK, ...centre, z: FACE - 8, rx: 90 };
    const smooth = { part: '14769', color: BLACK, ...centre, z: FACE - 8, rx: 90 };
    const glint = { part: '98138', color: WHITE, x: centre.x - 10, y: centre.y - 10, z: FACE - 16, rx: 90 };
    const holders = sockets(skin, i, 0, H.l3, 0);
    return loose(12, [
      ...holders.map((holder) => [...holder, disc, glint]),
      ...holders.map((holder) => [...holder, smooth]),
      ...holders.map((holder) => [...holder, disc]),
      [{ part: '3004', color: BLACK, x: centre.x, y: top(H.l3, 3), z: zAt(0), rot: 0 }],
    ]);
  };

  const arm = (sign) => {
    const i = sign < 0 ? 1 : 6;
    const turn = sign < 0 ? 90 : -90;
    const stud = sideStud(H.b3);
    const y = top(H.b3, 3);
    const holders = [
      [{ part: '11211', color: BLACK, x: xAt(i), y, z: zAt(2.5), rot: turn }],
      [socket(BLACK, i, 2, H.b3, turn), socket(BLACK, i, 3, H.b3, turn)],
    ];
    const side = (part, color, layer, dy, j = 2.5) => ({ part, color, x: sign * (SIDE + 8 + 8 * layer), y: stud + dy, z: zAt(j), rz: sign * 90, step: 8 });
    const across = (part, color, layer, dy) => ({ ...side(part, color, layer, dy), rx: 90 });
    const joints = [side('4073', BLACK, 0, 0, 2), side('4073', BLACK, 0, 0, 3)];
    const limb = side('3020', BLACK, 1, 30);
    const smooth = [side('3068b', BLACK, 2, 10), across('3069b', BLACK, 2, 40)];
    const studded = [side('3022', BLACK, 2, 10), across('3023', BLACK, 2, 40)];
    const hand = across('3023', skin, 2, 60);
    const fingers = [2, 3].map((j) => side('4073', skin, 2, 60, j));
    return loose(7, [
      ...holders.map((holder) => [...holder, ...joints, limb, ...smooth, hand]),
      ...holders.map((holder) => [...holder, ...joints, limb, ...studded, hand]),
      ...holders.map((holder) => [...holder, ...joints, limb, ...studded, ...fingers]),
      ...holders.map((holder) => [...holder, ...joints, limb, hand]),
      [{ part: '3004', color: BLACK, x: xAt(i), y, z: zAt(2.5), rot: 90 }],
    ]);
  };

  const hood = (() => {
    const y = sideStud(H.b3) + 10;
    const holders = [
      [twin(BLACK, 2, 5, H.b3, 180), twin(BLACK, 4, 5, H.b3, 180)],
      [2, 3, 4, 5].map((i) => socket(BLACK, i, 5, H.b3, 180)),
    ];
    const bulge = [2.5, 4.5].map((i) => ({ part: '15068', color: BLACK, x: xAt(i), y, z: BACK, rx: -90, step: 8 }));
    const curls = [2, 3, 4, 5].map((i) => ({ part: '11477', color: BLACK, x: xAt(i), y, z: BACK, rx: -90, step: 8 }));
    const flat = [2.5, 4.5].map((i) => ({ part: '3022', color: BLACK, x: xAt(i), y, z: BACK + 8, rx: -90, step: 8 }));
    return loose(7, [
      ...holders.map((holder) => [...holder, ...bulge]),
      ...holders.map((holder) => [...holder, ...curls]),
      ...holders.map((holder) => [...holder, ...flat]),
      [{ part: '3010', color: BLACK, x: xAt(3.5), y: top(H.b3, 3), z: zAt(5), rot: 0 }],
    ]);
  })();

  const dome = (step, h, i, j, rot) => {
    const along = rot === 0 || rot === 180;
    const curls = [-0.5, 0.5].map((d) => ({ part: '11477', color: hair, x: xAt(along ? i + d : i), y: foot(h), z: zAt(along ? j : j + d), rot }));
    const flat = (level) => ({ part: '3022', color: hair, x: xAt(i), y: top(h + level, 1), z: zAt(j), rot: 0 });
    return loose(step, [[{ part: '15068', color: hair, x: xAt(i), y: foot(h), z: zAt(j), rot }], curls, [flat(0), flat(1)], [flat(0)], []]);
  };

  const crown = (h) =>
    loose(16, [
      [{ part: '3031', color: hair, x: 0, y: top(h, 1), z: zAt(2.5), rot: 0 }],
      [1.5, 3.5].map((j) => ({ part: '3020', color: hair, x: 0, y: top(h, 1), z: zAt(j), rot: 0 })),
      [2.5, 4.5].flatMap((i) => [1.5, 3.5].map((j) => ({ part: '3022', color: hair, x: xAt(i), y: top(h, 1), z: zAt(j), rot: 0 }))),
    ]);

  const deep = (a, color, h, step) => {
    const x = xAt(a + 0.5);
    return loose(step, [
      [{ part: '3021', color, x, y: top(h, 1), z: zAt(3), rot: 90 }],
      [
        { part: '3022', color, x, y: top(h, 1), z: zAt(2.5), rot: 0 },
        { part: '3023', color, x, y: top(h, 1), z: zAt(4), rot: 0 },
      ],
    ]);
  };

  const shoe = (a) => {
    const x = xAt(a + 0.5);
    const tip = (h) => ({ part: '3022', color: shoes, x, y: top(h, 1), z: zAt(0.5), rot: 0 });
    return [
      loose(2, [[tip(H.sole)], [-0.5, 0.5].map((d) => ({ part: '3023', color: shoes, x, y: top(H.sole, 1), z: zAt(0.5 + d), rot: 0 }))]),
      deep(a, shoes, H.sole, 2),
      deep(a, shoes, H.shoe, 2),
      deep(a, shoes, H.shoe + 1, 2),
      loose(2, [
        [{ part: '15068', color: shoes, x, y: foot(H.shoe), z: zAt(0.5), rot: 0 }],
        [-10, 10].map((d) => ({ part: '11477', color: shoes, x: x + d, y: foot(H.shoe), z: zAt(0.5), rot: 0 })),
        [tip(H.shoe), tip(H.shoe + 1)],
        [tip(H.shoe)],
        [],
      ]),
    ];
  };

  const leg = (a) => {
    const x = xAt(a + 0.5);
    return [
      loose(3, [
        [{ part: '3002', color: BLACK, x, y: top(H.leg, 3), z: zAt(3), rot: 90 }],
        [
          { part: '3003', color: BLACK, x, y: top(H.leg, 3), z: zAt(2.5), rot: 0 },
          { part: '3004', color: BLACK, x, y: top(H.leg, 3), z: zAt(4), rot: 0 },
        ],
        LEVELS.map((level) => ({ part: '3021', color: BLACK, x, y: top(H.leg + level, 1), z: zAt(3), rot: 90 })),
      ]),
      deep(a, BLACK, H.thigh, 3),
      deep(a, BLACK, H.thigh + 1, 3),
    ];
  };

  const base = loose(1, [...['41539', '3036'].map((part) => [{ part, color: BLACK, x: 0, y: top(0, 1), z: -10, rot: 0 }]), []]);

  return [
    {
      id: 'hair',
      label: 'Włosy',
      recipes: fromCells,
      cells: [
        ...walls(10, [
          { axis: 'x', i: 0, j: 6, n: 8, h: H.l1, color: hair },
          { axis: 'z', i: 0, j: 4, n: 2, h: H.l1, color: hair },
          { axis: 'z', i: 7, j: 4, n: 2, h: H.l1, color: hair },
        ]),
        ...walls(11, [
          { axis: 'z', i: 0, j: 4, n: 3, h: H.l2, color: hair },
          { axis: 'z', i: 7, j: 4, n: 3, h: H.l2, color: hair },
          { axis: 'x', i: 1, j: 6, n: 6, h: H.l2, color: hair },
        ]),
        ...walls(12, [
          { axis: 'x', i: 0, j: 0, n: 1, h: H.l3, color: hair },
          { axis: 'x', i: 7, j: 0, n: 1, h: H.l3, color: hair },
          { axis: 'z', i: 0, j: 1, n: 5, h: H.l3, color: hair },
          { axis: 'z', i: 7, j: 1, n: 5, h: H.l3, color: hair },
          { axis: 'x', i: 0, j: 6, n: 8, h: H.l3, color: hair },
        ]),
        ...walls(13, [
          { axis: 'z', i: 0, j: 0, n: 7, h: H.l4, color: hair },
          { axis: 'z', i: 7, j: 0, n: 7, h: H.l4, color: hair },
          { axis: 'x', i: 1, j: 6, n: 6, h: H.l4, color: hair },
        ]),
        fringeOne(3, H.l4, 13, skin),
        ...walls(14, [
          { axis: 'x', i: 0, j: 0, n: 1, h: H.l5, color: hair },
          { axis: 'x', i: 3, j: 0, n: 1, h: H.l5, color: hair },
          { axis: 'x', i: 7, j: 0, n: 1, h: H.l5, color: hair },
          { axis: 'z', i: 0, j: 1, n: 5, h: H.l5, color: hair },
          { axis: 'z', i: 7, j: 1, n: 5, h: H.l5, color: hair },
          { axis: 'x', i: 0, j: 6, n: 8, h: H.l5, color: hair },
        ]),
        fringePair(1),
        fringeOne(4, H.l5, 14, hair),
        fringePair(5),
        ...[-1, 1, 3, 5].map((j) => plateSlab({ i: 0, j, n: 8, h: H.roof, color: hair, step: 15 })),
        crown(H.t1),
        crown(H.t1 + 1),
        ...[0.5, 2.5, 4.5, 6.5].map((i) => dome(16, H.t1, i, -0.5, 0)),
        ...[0.5, 2.5, 4.5, 6.5].map((i) => dome(16, H.t1, i, 5.5, 180)),
        ...[1.5, 3.5].map((j) => dome(16, H.t1, 0.5, j, 90)),
        ...[1.5, 3.5].map((j) => dome(16, H.t1, 6.5, j, -90)),
        dome(17, H.t2, 2.5, 1.5, 0),
        dome(17, H.t2, 4.5, 1.5, -90),
        dome(17, H.t2, 4.5, 3.5, 180),
        dome(17, H.t2, 2.5, 3.5, 90),
      ],
    },
    { id: 'eyes', label: 'Oczy', uniform: true, recipes: fromCells, cells: [eye(1), eye(5)] },
    {
      id: 'face',
      label: 'Twarz',
      recipes: fromCells,
      cells: [
        plateSlab({ i: 0, j: 0, n: 8, h: H.floor, color: skin, step: 9 }),
        plateSlab({ i: 0, j: 2, n: 8, h: H.floor, color: skin, step: 9 }),
        plateRun({ axis: 'x', i: 0, j: 4, n: 8, h: H.floor, color: skin, step: 9 }),
        plateSlab({ i: 0, j: 5, n: 8, h: H.floor, color: skin, step: 9 }),
        ...walls(10, [
          { axis: 'x', i: 0, j: 0, n: 8, h: H.l1, color: skin },
          { axis: 'z', i: 0, j: 1, n: 3, h: H.l1, color: skin },
          { axis: 'z', i: 7, j: 1, n: 3, h: H.l1, color: skin },
        ]),
        ...walls(11, [
          { axis: 'z', i: 0, j: 0, n: 4, h: H.l2, color: skin },
          { axis: 'z', i: 7, j: 0, n: 4, h: H.l2, color: skin },
          { axis: 'x', i: 1, j: 0, n: 6, h: H.l2, color: skin },
        ]),
        ...walls(12, [{ axis: 'x', i: 3, j: 0, n: 2, h: H.l3, color: skin }]),
        ...walls(13, [
          { axis: 'x', i: 1, j: 0, n: 2, h: H.l4, color: skin },
          { axis: 'x', i: 4, j: 0, n: 3, h: H.l4, color: skin },
        ]),
      ],
    },
    { id: 'arms', label: 'Ręce', uniform: true, recipes: fromCells, cells: [arm(-1), arm(1)] },
    { id: 'hood', label: 'Kaptur', uniform: true, recipes: fromCells, cells: [hood] },
    {
      id: 'chest',
      label: 'Znaczek na bluzie',
      recipes: fromCells,
      cells: walls(7, [
        { axis: 'x', i: 2, j: 1, n: 1, h: H.b3, color: ACCENT },
        { axis: 'x', i: 3, j: 1, n: 2, h: H.b3, color: WHITE },
      ]),
    },
    {
      id: 'body',
      label: 'Bluza i spodnie',
      recipes: fromCells,
      cells: [
        ...leg(1),
        ...leg(5),
        plateSlab({ i: 1, j: 1, n: 6, h: H.hip, color: BLACK, step: 4 }),
        plateSlab({ i: 1, j: 3, n: 6, h: H.hip, color: BLACK, step: 4 }),
        plateRun({ axis: 'x', i: 1, j: 5, n: 6, h: H.hip, color: BLACK, step: 4 }),
        brickSlab({ i: 1, j: 1, n: 6, h: H.b1, color: BLACK, step: 5 }),
        brickSlab({ i: 1, j: 3, n: 6, h: H.b1, color: BLACK, step: 5 }),
        brickRun({ axis: 'x', i: 1, j: 5, n: 6, h: H.b1, color: BLACK, step: 5 }),
        brickRun({ axis: 'x', i: 1, j: 1, n: 6, h: H.b2, color: BLACK, step: 6 }),
        brickSlab({ i: 1, j: 2, n: 6, h: H.b2, color: BLACK, step: 6 }),
        brickSlab({ i: 1, j: 4, n: 6, h: H.b2, color: BLACK, step: 6 }),
        ...walls(7, [
          { axis: 'x', i: 1, j: 1, n: 1, h: H.b3, color: BLACK },
          { axis: 'x', i: 5, j: 1, n: 2, h: H.b3, color: BLACK },
          { axis: 'x', i: 1, j: 4, n: 6, h: H.b3, color: BLACK },
          { axis: 'x', i: 1, j: 5, n: 1, h: H.b3, color: BLACK },
          { axis: 'x', i: 6, j: 5, n: 1, h: H.b3, color: BLACK },
        ]),
        brickSlab({ i: 2, j: 2, n: 4, h: H.b3, color: BLACK, step: 7 }),
      ],
    },
    { id: 'shoes', label: 'Buty', recipes: fromCells, cells: [...shoe(1), ...shoe(5)] },
    { id: 'base', label: 'Podstawka', uniform: true, recipes: fromCells, cells: [base] },
  ];
}

export default {
  id: 'jurek',
  name: 'Jurek',
  size: '6,7 × 6,4 × 12,8 cm',
  notes: {
    2: 'Buty: zielona podeszwa, dwie warstwy pod nogą i łukowy nosek z przodu.',
    7: 'Żółty i biały klocek z przodu to znaczek na bluzie. Klocki z wypustkami z boku: po jednym na boki (ręce) i dwa do tyłu (kaptur).',
    8: 'Ręka: na boczne wypustki dwie okrągłe płytki, na nie pionowo płytka 2×4, na górę kafelki, na dół żółta dłoń. Kaptur: dwa łukowe skosy na tylne wypustki, cienkim końcem do góry.',
    10: 'Głowa jest pusta w środku. Tył i tylne części boków są z koloru włosów.',
    12: 'Oko: okrągła płytka 2×2 górnymi otworami na dwie boczne wypustki, biały kafelek na lewą górną wypustkę oka.',
    13: 'Najdłuższy kosmyk grzywki wisi między oczami.',
    14: 'Grzywka: łukowe skosy na wypustkach z przodu, cienkim końcem w dół.',
    16: 'Łukowe skosy dookoła, niską stroną na zewnątrz. W środku dwie warstwy płytek.',
    17: 'Wicherek: cztery łukowe skosy, każdy niską stroną w inną stronę.',
  },
  roles: {
    hair: { label: 'Włosy', colors: [70, 6, 308] },
    skin: { label: 'Skóra', colors: [14, 19] },
    shoes: { label: 'Buty', colors: [2, 10, 27] },
  },
  build,
};
