# Word Styling Guide

Guidelines for evaluating and refining word color/font choices.

## Color System

OkLCH color space:
- **Hue:** 0-360° (color wheel position)
- **Chroma:** 0-0.4 (saturation)
- **Lightness:** 30-90 (brightness, inverts for dark mode)

## Evaluation Criteria

1. **Semantic fit** — Color should match word meaning
   - Bad: "moribund" (dying) with pink/vibrant hue
   - Good: "moribund" with muted violet, low chroma

2. **Hue distribution** — Avoid over-concentration
   - Audit periodically for balance across spectrum
   - Purple (280-300°) tends to accumulate

3. **Group harmony** — Related words share cohesive palettes:
   | Group | Hue Range | Examples |
   |-------|-----------|----------|
   | Rhetorical figures | 40-48° (amber) | zeugma, tmesis, chiasmus |
   | Longing words | 280-290° (blue-violet) | saudade, hiraeth, fernweh |
   | Archaic terms | 38-45° (sepia) | sennight, erstwhile, mayhap |
   | Radiance words | 48-55° (gold) | phosphorescent, noctilucent |
   | Music terms | 325-340° (rose) | hemiola, caesura |

## How Intent Is Displayed

- **Lightness:** 50 and up renders as authored. 30–50 is compressed into 40–50 so the darkest words stay legible on the near-black page while still reading darker than mid-tones (`displayLightness` in `src/lib/color.ts`).
- **Gamut:** Screens can't show every OkLCH color. Chroma is lowered (CSS Color 4 gamut mapping) until the color fits the screen, keeping lightness and hue. High chroma at extreme lightness—bright yellows, deep oranges—comes out paler than authored, so prefer chroma the display can reach.
- **Curator's note:** An optional `note` in MDX frontmatter explains the typeface and color choice. It appears in the word page's colophon.

## Updating Styles

1. Edit `src/data/vetted-styles.json` (source of truth)
2. Run `pnpm sync-styles` to propagate changes to MDX frontmatter
3. Run `pnpm lint-styles` to verify sync and check color distribution

The gallery reads from JSON; word pages read from MDX frontmatter.
