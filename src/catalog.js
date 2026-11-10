// Klocki: part and colour catalogue (LDraw ids and colour codes) with Polish display names.

export const PARTS = {
  3003: { name: 'Klocek 2×2' },
  3004: { name: 'Klocek 1×2' },
  3022: { name: 'Płytka 2×2' },
  3023: { name: 'Płytka 1×2' },
  3700: { name: 'Klocek Technic 1×2 z otworem' },
  2780: { name: 'Pin Technic z tarciem' },
};

export const COLORS = {
  0: { name: 'Czarny', lego: 'Black', hex: '#1b2a34' },
  71: {
    name: 'Jasnoszary',
    lego: 'Light Bluish Gray',
    hex: '#a0a5a9',
    hint: 'Chłodny, lekko niebieskawy. Stary jasnoszary jest cieplejszy i zielonkawy, nie mieszaj ich.',
  },
  72: {
    name: 'Ciemnoszary',
    lego: 'Dark Bluish Gray',
    hex: '#6c6e68',
    hint: 'Chłodny grafit. Stary ciemnoszary wpada w brąz, nie mieszaj ich.',
  },
};

export const keyOf = (part, color) => `${part}:${color}`;

export const splitKey = (key) => {
  const [part, color] = key.split(':');
  return { part, color: Number(color) };
};
