# Word Content System with MDX

## Overview

Replace the external Dictionary API and `vetted-styles.json` with individual MDX files per word. Each file contains style (frontmatter) and content (body). LLM generates draft definitions, human reviews before publishing.

## File Structure

**Location:** `src/content/words/{word}.mdx`

**Example file** (`ephemeral.mdx`):
```mdx
---
word: ephemeral
phonetic: /ɪˈfem(ə)rəl/
status: published
style:
  family: Cormorant
  weight: 300
  style: italic
  colorIntent:
    hue: 270
    chroma: 0.18
    lightness: 65
---

## adjective

Lasting for a very short time; transitory.

> *The ephemeral beauty of cherry blossoms reminds us to cherish fleeting moments.*

## Etymology

From Greek *ephēmeros* (ἐφήμερος), meaning "lasting only a day," from *epi-* (on) + *hēmera* (day). First used in English in the 16th century.

## Related Words

- evanescent
- transient
- fleeting
```

## Status Field

- `style-only` — Has styling but no content yet (legacy migration state)
- `draft` — LLM-generated content, awaiting review
- `published` — Approved and visible in gallery

## Gallery Index (Build-Time)

At build time, scan all MDX files and generate `src/generated/words-index.json`:

```json
{
  "words": {
    "ephemeral": {
      "family": "Cormorant",
      "weight": 300,
      "style": "italic",
      "colorIntent": { "hue": 270, "chroma": 0.18, "lightness": 65 }
    }
  }
}
```

Only `published` words are included. Gallery reads from this index — same performance as current `vetted-styles.json`.

## Technical Implementation

### Dependencies
- `gray-matter` — parse YAML frontmatter
- `next-mdx-remote` — compile MDX at runtime for word detail pages

### New Files
| File | Purpose |
|------|---------|
| `src/content/words/*.mdx` | Individual word files |
| `src/generated/words-index.json` | Build-time gallery index |
| `src/lib/words.ts` | Load/parse MDX, get word list |
| `scripts/build-words-index.ts` | Generate index from MDX files |
| `scripts/migrate-styles.ts` | Migrate vetted-styles.json → MDX |
| `scripts/generate-definitions.ts` | LLM drafts for words missing content |

### Modified Files
| File | Change |
|------|--------|
| `src/app/api/gallery/route.ts` | Read from generated index |
| `src/app/word/[word]/page.tsx` | Read MDX content instead of external API |
| `package.json` | Add scripts, deps, prebuild hook |

## Content Generation Workflow

**Script:** `npm run generate-definitions`

1. Find MDX files with `status: style-only`
2. For each, call Claude to generate definition, etymology, example
3. Write content to MDX body, set `status: draft`

**Review:** Visit `/review` to see drafts. Edit if needed, change status to `published`.

## Migration Steps

1. Install dependencies (`gray-matter`, `next-mdx-remote`)
2. Create `src/content/words/` directory
3. Run migration script to create MDX files from `vetted-styles.json`
4. Create `src/lib/words.ts` for loading MDX
5. Create build script for words index
6. Update gallery API to read from generated index
7. Update word detail page to read MDX content
8. Add prebuild hook to regenerate index
9. Run generation script to draft definitions
10. Review and publish
