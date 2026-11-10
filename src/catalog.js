// Klocki: part and colour catalogue (LDraw ids and colour codes) with Polish display names.

export const PARTS = {
  3005: { name: 'Klocek 1×1' },
  3004: { name: 'Klocek 1×2' },
  3622: { name: 'Klocek 1×3' },
  3010: { name: 'Klocek 1×4' },
  3009: { name: 'Klocek 1×6' },
  3003: { name: 'Klocek 2×2' },
  3002: { name: 'Klocek 2×3' },
  3001: { name: 'Klocek 2×4' },
  3024: { name: 'Płytka 1×1' },
  3023: { name: 'Płytka 1×2' },
  3623: { name: 'Płytka 1×3' },
  3710: { name: 'Płytka 1×4' },
  3666: { name: 'Płytka 1×6' },
  3022: { name: 'Płytka 2×2' },
  3021: { name: 'Płytka 2×3' },
  3020: { name: 'Płytka 2×4' },
  3795: { name: 'Płytka 2×6' },
  3031: { name: 'Płytka 4×4' },
  3032: { name: 'Płytka 4×6' },
  3035: { name: 'Płytka 4×8' },
  3958: { name: 'Płytka 6×6' },
  3036: { name: 'Płytka 6×8' },
  41539: { name: 'Płytka 8×8' },
  4073: { name: 'Płytka okrągła 1×1' },
  98138: { name: 'Kafelek okrągły 1×1' },
  54200: { name: 'Skos 1×1 (serek)' },
  87087: { name: 'Klocek 1×1 z wypustką z boku' },
  3700: { name: 'Klocek Technic 1×2 z otworem' },
  2780: { name: 'Pin Technic z tarciem' },
};

export const COLORS = {
  0: { name: 'Czarny', lego: 'Black', hex: '#1b2a34' },
  15: { name: 'Biały', lego: 'White', hex: '#f4f4f4' },
  14: { name: 'Żółty', lego: 'Yellow', hex: '#f2cd37' },
  19: { name: 'Beżowy', lego: 'Tan', hex: '#e4cd9e' },
  70: {
    name: 'Brąz czerwonawy',
    lego: 'Reddish Brown',
    hex: '#582a12',
    hint: 'Ciepły, czerwonawy brąz. Stary brąz jest bardziej szary i matowy, nie mieszaj ich.',
  },
  6: {
    name: 'Stary brąz',
    lego: 'Brown',
    hex: '#583927',
    hint: 'Szarawy, czekoladowy brąz ze starszych zestawów. Nowy brąz jest wyraźnie czerwonawy.',
  },
  308: { name: 'Ciemny brąz', lego: 'Dark Brown', hex: '#352100' },
  2: { name: 'Zielony', lego: 'Green', hex: '#237841' },
  10: { name: 'Jasnozielony', lego: 'Bright Green', hex: '#4b9f4a' },
  27: { name: 'Limonkowy', lego: 'Lime', hex: '#bbe90b' },
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
