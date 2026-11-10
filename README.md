# Klocki

A local tool for building LEGO models out of an unsorted brick collection.

1. **Szukaj**: the app shows one real part at a time, big, in its exact colour, with the quantity needed. Swipe right with two fingers (or `→`) if you have it, left (or `←`) if you don't, or type how many you found. When a part runs out, the planner immediately swaps in the next recipe (for example two 1×2 bricks instead of one 2×2).
2. **Kupka**: everything confirmed so far.
3. **Instrukcja**: step-by-step 3D building instructions generated only from the parts on the pile.

Models live in `models/` as cells with ordered fallback recipes. The first model is TARS from Interstellar.

## Run

```bash
node server.mjs 8742
```

Then open `http://localhost:8742`. The pile is saved to `data/stan.json`.

## Adding parts

Add the LDraw id to `src/catalog.js`, put the official library archive at `Niepotrzebne/ldraw-src/complete.zip` (from https://library.ldraw.org/library/updates/complete.zip) and run:

```bash
node tools/pack-parts.mjs
```

## Credits

- Part geometry and colour definitions in `ldraw/` come from the [LDraw Parts Library](https://www.ldraw.org), licensed under CC BY 2.0 and CC BY 4.0 by their respective authors (author lines are kept inside `ldraw/parts.pack`).
- Rendering uses [three.js](https://threejs.org) (MIT), vendored in `lib/`.
- LEGO is a trademark of the LEGO Group, which does not sponsor or endorse this project.
