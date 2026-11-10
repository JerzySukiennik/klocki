// Klocki: TARS from Interstellar as four 2x2 columns on one shared pivot, with fallback recipes for every cell.

const LAYERS = 14;
const PIVOT = 7;
const SCREEN = 11;
const BODY = 71;
const SCREEN_COLOR = 0;

const slabX = (s) => -60 + 40 * s;
const stepOf = (layer) => (layer < PIVOT ? layer + 1 : layer + 2);
const brick = (part, color, s, dx, layer, z, rot = 0) => ({ part, color, x: slabX(s) + dx, y: -(layer * 24 + 24), z, rot, col: s });
const plate = (part, color, s, dx, layer, level, z, rot = 0) => ({
  part,
  color,
  x: slabX(s) + dx,
  y: -(layer * 24 + level * 8 + 8),
  z,
  rot,
  col: s,
});
const levels = [0, 1, 2];

const bodyCells = [];
for (let layer = 0; layer < LAYERS; layer += 1) {
  if (layer === PIVOT) continue;
  for (let s = 0; s < 4; s += 1) {
    if (layer === SCREEN && (s === 1 || s === 2)) continue;
    bodyCells.push({ s, layer });
  }
}

const pivotCells = [];
for (let s = 0; s < 4; s += 1) for (let i = 0; i < 2; i += 1) pivotCells.push({ s, i });

const screenCells = [{ s: 1 }, { s: 2 }];

const pivotOption = (color) => ({
  build: ({ s, i }) => [brick('3700', color, s, -10 + 20 * i, PIVOT, 0, 90)],
});

const halfOptions = (color, z) => [
  { build: ({ s }) => [brick('3004', color, s, 0, SCREEN, z)] },
  { build: ({ s }) => levels.map((level) => plate('3023', color, s, 0, SCREEN, level, z)) },
];

export default {
  id: 'tars',
  name: 'TARS',
  size: '6,4 × 1,6 × 13,6 cm',
  notes: {
    1: 'Cztery osobne kolumny, każda 2×2. Buduj je obok siebie.',
    8: 'Klocki Technic ustaw otworami w bok, tak żeby otwory wszystkich kolumn były w jednej linii.',
    9: 'Rozsuń kolumny, włóż piny w otwory i zsuń z powrotem. To oś, na której TARS chodzi.',
    13: 'Czarne klocki to ekrany. Wchodzą z przodu dwóch środkowych kolumn.',
  },
  spread: { 9: 26 },
  groups: [
    {
      id: 'pivot',
      label: 'Oś obrotu (klocki Technic)',
      uniform: true,
      cells: pivotCells,
      step: () => PIVOT + 1,
      options: [pivotOption(72), pivotOption(0), pivotOption(71)],
    },
    {
      id: 'pins',
      label: 'Piny łączące kolumny',
      uniform: true,
      cells: [{ j: 0 }, { j: 1 }, { j: 2 }],
      step: () => PIVOT + 2,
      options: [
        {
          build: ({ j }) => [{ part: '2780', color: 0, x: -40 + 40 * j, y: -(PIVOT * 24 + 14), z: 0, rot: 0, col: j + 0.5 }],
        },
      ],
    },
    {
      id: 'screens',
      label: 'Ekrany',
      uniform: true,
      cells: screenCells,
      step: () => stepOf(SCREEN),
      options: halfOptions(SCREEN_COLOR, -10),
    },
    {
      id: 'body',
      label: 'Korpus',
      cells: bodyCells,
      step: ({ layer }) => stepOf(layer),
      options: [
        { build: ({ s, layer }) => [brick('3003', BODY, s, 0, layer, 0)] },
        {
          build: ({ s, layer }) =>
            layer % 2
              ? [brick('3004', BODY, s, -10, layer, 0, 90), brick('3004', BODY, s, 10, layer, 0, 90)]
              : [brick('3004', BODY, s, 0, layer, -10), brick('3004', BODY, s, 0, layer, 10)],
        },
        { build: ({ s, layer }) => levels.map((level) => plate('3022', BODY, s, 0, layer, level, 0)) },
        {
          build: ({ s, layer }) =>
            levels.flatMap((level) =>
              (layer * 3 + level) % 2
                ? [plate('3023', BODY, s, -10, layer, level, 0, 90), plate('3023', BODY, s, 10, layer, level, 0, 90)]
                : [plate('3023', BODY, s, 0, layer, level, -10), plate('3023', BODY, s, 0, layer, level, 10)],
            ),
        },
      ],
    },
    {
      id: 'screen-backs',
      label: 'Tył ekranów',
      cells: screenCells,
      step: () => stepOf(SCREEN),
      options: halfOptions(BODY, 10),
    },
  ],
};
