import { kv } from "@vercel/kv";
import { readFileSync } from "fs";
import { join } from "path";
import type { FontVariant } from "../src/lib/schemas";
import { resolveWordWithLLM } from "../src/lib/llm-resolver";

const GALLERY_PREFIX = "gallery:word:";
const GALLERY_INDEX_KEY = "gallery:index";
const GALLERY_META_KEY = "gallery:meta";

interface GalleryWordEntry {
  word: string;
  normalized: string;
  variant: FontVariant;
  createdAt: number;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

async function getExistingGalleryWord(
  normalized: string
): Promise<GalleryWordEntry | null> {
  try {
    return await kv.get<GalleryWordEntry>(`${GALLERY_PREFIX}${normalized}`);
  } catch {
    return null;
  }
}

async function saveGalleryWord(entry: GalleryWordEntry): Promise<void> {
  const key = `${GALLERY_PREFIX}${entry.normalized}`;
  await kv.set(key, entry);
  await kv.zadd(GALLERY_INDEX_KEY, {
    score: 0,
    member: entry.normalized,
  });
}

async function loadVettedStyles(): Promise<Map<string, FontVariant>> {
  const vettedPath = join(
    process.cwd(),
    "src",
    "data",
    "vetted-styles.json"
  );
  const content = readFileSync(vettedPath, "utf-8");
  const data = JSON.parse(content);

  const map = new Map<string, FontVariant>();
  for (const [word, variant] of Object.entries(data.words)) {
    map.set(normalizeWord(word), variant as FontVariant);
  }
  return map;
}

async function loadNewWords(): Promise<string[]> {
  const wordsPath = join(process.cwd(), "src", "lib", "new-words.md");
  const content = readFileSync(wordsPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function updateMeta(count: number): Promise<void> {
  await kv.set(GALLERY_META_KEY, {
    count,
    lastUpdated: Date.now(),
  });
}

async function main() {
  console.log("🎨 Seeding gallery with styled words...\n");

  const vettedStyles = await loadVettedStyles();
  console.log(`📚 Loaded ${vettedStyles.size} vetted styles`);

  const newWords = await loadNewWords();
  console.log(`📝 Found ${newWords.length} words in new-words.md\n`);

  const allWords = new Set<string>();

  // Add vetted words first
  for (const [normalized, variant] of vettedStyles) {
    allWords.add(normalized);
    const existing = await getExistingGalleryWord(normalized);
    if (!existing) {
      console.log(`✅ Adding vetted word: ${normalized}`);
      await saveGalleryWord({
        word: normalized,
        normalized,
        variant,
        createdAt: Date.now(),
      });
    } else {
      console.log(`⏭️  Skipping vetted word (exists): ${normalized}`);
    }
  }

  // Process new words
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const word of newWords) {
    const normalized = normalizeWord(word);
    allWords.add(normalized);

    const existing = await getExistingGalleryWord(normalized);
    if (existing) {
      console.log(`⏭️  Skipping (exists): ${word}`);
      skipped++;
      continue;
    }

    // Check if we have a vetted style
    const vettedVariant = vettedStyles.get(normalized);
    if (vettedVariant) {
      console.log(`✅ Using vetted style for: ${word}`);
      await saveGalleryWord({
        word,
        normalized,
        variant: vettedVariant,
        createdAt: Date.now(),
      });
      processed++;
      continue;
    }

    // Generate with LLM
    try {
      console.log(`🤖 Generating style for: ${word}`);
      const variant = await resolveWordWithLLM(word);
      await saveGalleryWord({
        word,
        normalized,
        variant,
        createdAt: Date.now(),
      });
      processed++;
      console.log(
        `   → ${variant.family} ${variant.weight} (hue: ${variant.colorIntent.hue})`
      );
    } catch (error) {
      console.error(`❌ Failed to style: ${word}`, error);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  await updateMeta(allWords.size);

  console.log("\n📊 Summary:");
  console.log(`   Total words: ${allWords.size}`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(console.error);
