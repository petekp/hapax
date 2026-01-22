# Plan: Humanize Word Content with Batch Processing

## Overview

Apply the humanizer skill across all 207 word MDX files in `src/content/words/`, using parallel subagents to process batches of 5-10 words at a time.

## Current State Assessment

The word content is generally well-written with a consistent lyrical voice. However, some patterns warrant review:

**Potential issues to check for:**
- Em dash overuse (visible in several entries)
- Promotional language ("dramatic interplay," "unmistakable aroma")
- Superficial -ing phrases ("modeling form," "sculpting with value")
- Rule of three constructions in some definitions
- Copula avoidance ("darkness is not absence but design" vs simpler constructions)

**Strengths to preserve:**
- Distinctive poetic voice
- Specific etymological detail
- Evocative example quotes
- Consistent structure (definition → quote → etymology → related words)

## Implementation Strategy

### Batch Organization

Split 207 files into ~21-25 batches of 8-10 words each. Process using parallel subagents.

### Agent Configuration

Each batch agent will:
1. Read assigned word files
2. Apply humanizer patterns to identify AI-isms
3. Rewrite problematic sections while preserving voice
4. Edit files in place
5. Report changes made

### Batch Assignment (alphabetical groupings)

| Batch | Words | Count |
|-------|-------|-------|
| 1 | abraxas → agrodolce | 8 |
| 2 | alabaster → ataraxia | 8 |
| 3 | athwart → bonhomie | 8 |
| 4 | borborygmus → calumny | 8 |
| 5 | camphor → celadon | 8 |
| ... | ... | ... |
| 21-25 | remaining words | 7-10 each |

### Agent Prompt Template

```
You are humanizing word definition files for the Hapax gallery.

For each word file, apply the humanizer skill patterns:
1. Check for em dash overuse (replace with commas/periods)
2. Check for promotional language (vibrant, breathtaking, stunning, etc.)
3. Check for superficial -ing analyses
4. Check for copula avoidance (serves as, stands as → is)
5. Check for rule of three constructions
6. Check for AI vocabulary words (crucial, pivotal, showcase, underscore, etc.)

PRESERVE:
- The lyrical, poetic voice
- Etymological specificity
- The structure (definition → quote → etymology → related)
- Bold word styling

Files to process: [list of 8-10 file paths]

Edit each file using the Edit tool. Report what you changed.
```

## Execution Plan

### Phase 1: Test batch (1 agent, 3-5 words)
- Run single agent on small batch to validate approach
- Review output quality
- Adjust prompt if needed

### Phase 2: Parallel processing (3-4 agents at a time)
- Launch agents in waves of 3-4 parallel batches
- Each wave processes 24-40 words
- Monitor for consistency across agents

### Phase 3: Verification
- Grep for common AI patterns across all files
- Spot-check random sample of edited files
- Run `pnpm lint` to ensure no syntax errors introduced

## Critical Files

- `src/content/words/*.mdx` - All 207 word definition files
- `src/data/vetted-styles.json` - Styling data (no content changes needed)

## Verification

After completion:
1. `pnpm lint` - Check for MDX/syntax errors
2. `pnpm build` - Verify build succeeds
3. Grep check: `grep -r "serves as\|stands as\|crucial\|pivotal" src/content/words/` - Should return minimal results
4. Manual review of 5-10 random files for voice consistency

## Decisions

- **Quotes:** Humanize blockquotes along with the rest of the content
- **Parallelism:** Use 3-4 agents at a time
- **Git:** Work directly on main branch (no separate branch needed)
