# Definition Generation Prompt

Use this prompt to generate definitions for Hapax words. The output format is designed to work with `pnpm merge-definitions`.

---

## Prompt

```
You are a lexicographer writing for Hapax, a curated collection of rare and beautiful words. Your definitions should rival the Oxford English Dictionary in scholarly precision and the American Heritage Dictionary in elegance of prose.

For each word in the list below, produce an MDX file with YAML frontmatter and Markdown content.

## Output Format

For each word, output a code block labeled with the filename, like this:

```ephemeral.mdx
---
word: ephemeral
phonetic: /ɪˈfɛm(ə)rəl/
status: draft
---

## adjective

Lasting for a markedly brief time...
```

## Frontmatter Fields

- `word`: The word exactly as provided
- `phonetic`: IPA pronunciation in slashes
- `status`: Always set to `draft`

## Content Structure

### Part of Speech Heading
Use `## noun`, `## verb`, `## adjective`, etc. If a word has multiple parts of speech, include separate sections for each.

### Definition
Each definition should:
- Be precise yet evocative—capture not just denotation but connotation
- Distinguish this word from near-synonyms (what makes it irreplaceable?)
- Note register in parentheses where relevant: (archaic), (literary), (technical), (rare)

### Example Sentence
After each definition, include a blockquote with an italicized example:

> *The petrichor rose from the garden as the first drops struck the sun-warmed flagstones.*

Example sentences should:
- Demonstrate natural usage, not a contrived showcase
- Be memorable and well-crafted in their own right
- Show the word doing something a synonym couldn't

### Etymology Section
Under `## Etymology`, trace the word's origin:
- Source language(s) and literal meaning of roots
- Semantic evolution if meaning shifted over time
- First attested use in English if notable or interesting
- Keep it engaging, not dry

### Related Words Section
Under `## Related Words`, list 2-4 words as a bullet list:
- Words that share semantic or etymological kinship
- Briefly note the relationship in parentheses if not obvious

---

## Guidelines

- Write with authority but without pedantry
- These definitions accompany typographic art—reward close reading
- For loanwords, honor the source culture's understanding
- Avoid starting definitions with "Refers to" or "A type of"
- Prefer active, concrete language over abstract description
- If a word has a fascinating history or nuance, let that shine

---

## Words to Define

[INSERT WORD LIST HERE]
```

---

## Example Output

The model should produce output like this:

````
```acedia.mdx
---
word: acedia
phonetic: /əˈsiː.di.ə/
status: draft
---

## noun

A leaden spiritual weariness: not mere laziness, but a sour, restless aversion to one's duties, one's place, even one's own life—felt as fatigue that will not rest and boredom that will not lift (religious; historical). **Acedia** differs from *ennui* in its moral and devotional sting: it is indifference as temptation.

> *At noon the monastery seemed to hold its breath, and acedia crept in like heat through stone.*

## Etymology

From Greek **akēdía** "lack of care," from **a-** "not" + **kēdos** "care, concern." Early Christian ascetics wrote of it as the "noonday demon," the hour when prayer curdles into irritation and the mind hunts for escape. Later moral theology folded it into the genealogy of *sloth*, but the older word preserves the texture of the experience: listlessness that feels like betrayal.

## Related Words

- **sloth** (later moral category that overlaps but does not exhaust the idea)
- **melancholia** (older medical-moral neighbor with a darker gravity)
- **lassitude** (physical languor without the spiritual register)
- **ennui** (modern cousin, more secular in flavor)
```

```borborygmus.mdx
---
word: borborygmus
phonetic: /ˌbɔːr.bəˈrɪɡ.məs/
status: draft
---

## noun

A rumbling or gurgling in the intestines, especially as audible stomach "growling" produced by moving gas and fluid (technical). Where *stomach growl* is domestic and comic, **borborygmus** names the same sound with clinical clarity—and, oddly, with a kind of music.

> *In the hush of the lecture hall, a borborygmus rose from the back row like an ill-timed bassoon.*

## Etymology

From Greek **borborygmos**, an imitative word shaped to the sound it denotes—rolling consonants and liquid vowels that mimic the body's own acoustics. English keeps the learned spelling, but the ear recognizes the origin immediately.

## Related Words

- **borborygmi** (plural form often used in medical contexts)
- **peristalsis** (the muscular motion that underlies the sound)
- **flatulence** (a frequent accomplice, though not identical)
- **gurgle** (the everyday echo)
```
````

---

## Workflow

1. Copy the prompt above
2. Replace `[INSERT WORD LIST HERE]` with your comma-separated words
3. Run the model and save output to a file (e.g., `temp-definitions.md`)
4. Run: `pnpm merge-definitions temp-definitions.md`
5. Review merged files, edit as needed
6. Change `status: draft` to `status: published` when ready
7. Run `pnpm build-words-index` to update the gallery

---

## Remaining Words (as of 2026-01-18)

```
cachinnate, cachinnation, cacodoxy, caesura, cairn, caldera, calescence, calumny, camphor, cantrip, carbuncle, casuistry, catachresis, catafalque, celadon, chandler, chanticleer, chiaroscuro, chiasmus, chthonian, coalesce, colorature, columnar, compos mentis, concinnity, contretemps, cordwainer, coronach, coruscate, crepuscular, cromlech, crux, cryptomnesia, cynosure, de rigueur, delectable, deracinate, desiccate, desuetude, diaphanous, dreadnaught, duende, dwale, effluvium, effulgent, eigengrau, eldritch, elide, empyrean, enchiridion, ennui, entelechy, ersatz, erstwhile, escutcheon, eunoia, excogitate, exquisite, fascicle, fernweh, firmament, fjord, floccus, flummox, forsooth, fortnight, fusillade, fylfot, gallimaufry, glissade, glossolalia, grimoire, grisaille, hapax legomenon, hemiola, hiraeth, hygge, imbibe, incarnadine, indigo, insouciant, interpose, kvell, labile, lagniappe, languor, limerence, liminal, lineament, lithe, litotes, malapert, malinger, mamihlapinatapai, mayhap, melismatic, metanoia, miasma, mien, misericord, moiety, mollify, monadnock, mono no aware, moraine, mordicant, moribund, mot juste, mountebank, nescience, nictate, nihilartikel, noctilucent, noetic, nostrum, noumenon, nullifidian, nychthemeron, oneiric, ophidian, oronym, orrery, oubliette, oughtness, panoply, paraselene, pareidolia, pauciloquent, peregrine, peripeteia, persiflage, petrichor, pettifog, phantom, phosphorescent, portcullis, preceptor, primeval, prognosticate, propinquity, proprioception, prosopopoeia, psithurism, psychopomp, qualia, quidnunc, quincunx, quisling, ragamuffin, ratiocination, revanchist, rivulet, saccade, sacerdotal, samizdat, saudade, scintilla, sennight, sequester, sidereal, sinecure, soi-disant, sprezzatura, squeak, sui generis, suplex, surreptitious, surreptitiously, susurrous, sylvan, synecdoche, syzygy, taciturn, tatterdemalion, tchotchke, tenebrous, teratologic, terraqueous, threnody, tmesis, toska, tousle, truculent, truncheon, tsundere, upbraid, vade mecum, vellum, vermillion, vesper, vespertine, vouchsafe, wabi-sabi, welkin, wellaway, weltanschauung, weltschmerz, wrest, ygdrasil, zeugma, zugzwang
```
