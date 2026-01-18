import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

import type { FontVariant } from "../src/lib/schemas";
import { resolveWordWithLLM } from "../src/lib/llm-resolver";

const VETTED_PATH = join(process.cwd(), "src", "data", "vetted-styles.json");

interface VettedStyles {
  version: number;
  words: Record<string, FontVariant>;
  phrases: Record<string, FontVariant>;
}

function loadVettedStyles(): VettedStyles {
  try {
    const content = readFileSync(VETTED_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return { version: 2, words: {}, phrases: {} };
  }
}

function saveVettedStyles(data: VettedStyles): void {
  writeFileSync(VETTED_PATH, JSON.stringify(data, null, 2) + "\n");
}

function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

async function loadNewWords(): Promise<string[]> {
  const wordsPath = join(process.cwd(), "src", "lib", "new-words.md");
  const content = readFileSync(wordsPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function getExistingWords(vettedStyles: VettedStyles): Set<string> {
  const existing = new Set<string>();
  for (const word of Object.keys(vettedStyles.words)) {
    existing.add(word.toLowerCase());
  }
  return existing;
}

const LIMIT = parseInt(process.argv[2] || "10");

async function main() {
  console.log(`🎨 Generating styles for ${LIMIT} new words...\n`);

  const vettedStyles = loadVettedStyles();
  const newWords = await loadNewWords();
  const existingWords = getExistingWords(vettedStyles);

  console.log(`📚 Existing words in vetted-styles.json: ${existingWords.size}`);

  const wordsToProcess = newWords
    .filter(word => !existingWords.has(normalizeWord(word)))
    .slice(0, LIMIT);

  if (wordsToProcess.length === 0) {
    console.log("\nNo new words to process. All words already exist.");
    return;
  }

  console.log(`\nFound ${wordsToProcess.length} words to process:\n`);

  let processed = 0;
  let failed = 0;

  for (const word of wordsToProcess) {
    const normalized = normalizeWord(word);

    try {
      console.log(`🤖 [${processed + failed + 1}/${wordsToProcess.length}] Generating style for: ${word}`);
      const variant = await resolveWordWithLLM(word);
      vettedStyles.words[normalized] = variant;
      saveVettedStyles(vettedStyles);
      processed++;
      console.log(`   ✅ ${variant.family} ${variant.weight} (hue: ${variant.colorIntent.hue})\n`);
    } catch (error) {
      console.error(`   ❌ Failed to style: ${word}`, error);
      failed++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Processed: ${processed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total words now: ${Object.keys(vettedStyles.words).length}`);
}

main().catch(console.error);
