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

## Updating Styles

When changing a word's style, update **both**:
1. `src/data/vetted-styles.json`
2. `src/content/words/[word].mdx` frontmatter

The gallery reads from JSON; word pages read from MDX.
