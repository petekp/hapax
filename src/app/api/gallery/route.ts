import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import type { FontVariant } from "@/lib/schemas";

const GALLERY_PREFIX = "gallery:word:";
const GALLERY_INDEX_KEY = "gallery:index";

export interface GalleryWordEntry {
  word: string;
  normalized: string;
  variant: FontVariant;
  createdAt: number;
}

export interface GalleryResponse {
  words: GalleryWordEntry[];
  total: number;
  hasMore: boolean;
  cursor: string | null;
}

function hasVercelKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKV() {
  if (!hasVercelKV()) {
    return null;
  }
  const { kv } = await import("@vercel/kv");
  return kv;
}

function loadWordsIndex(): GalleryWordEntry[] {
  try {
    const indexPath = join(process.cwd(), "src", "generated", "words-index.json");
    const content = readFileSync(indexPath, "utf-8");
    const data = JSON.parse(content);

    const entries: GalleryWordEntry[] = [];
    for (const [word, variant] of Object.entries(data.words)) {
      entries.push({
        word,
        normalized: word.toLowerCase(),
        variant: variant as FontVariant,
        createdAt: Date.now(),
      });
    }
    return entries.sort((a, b) => a.normalized.localeCompare(b.normalized));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || "0";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
  const search = searchParams.get("search")?.toLowerCase();

  const kv = await getKV();

  // Try KV first
  if (kv) {
    try {
      const wordKeys = await kv.zrange(GALLERY_INDEX_KEY, 0, -1);

      if (wordKeys && wordKeys.length > 0) {
        const startIndex = parseInt(cursor);
        let filteredKeys = wordKeys as string[];

        if (search) {
          filteredKeys = filteredKeys.filter((key) =>
            key.toLowerCase().includes(search)
          );
        }

        filteredKeys.sort((a, b) => a.localeCompare(b));

        const paginatedKeys = filteredKeys.slice(startIndex, startIndex + limit);
        const hasMore = startIndex + limit < filteredKeys.length;
        const nextCursor = hasMore ? String(startIndex + limit) : null;

        const entries: GalleryWordEntry[] = [];
        for (const normalized of paginatedKeys) {
          const entry = await kv.get<GalleryWordEntry>(
            `${GALLERY_PREFIX}${normalized}`
          );
          if (entry) {
            entries.push(entry);
          }
        }

        return NextResponse.json({
          words: entries,
          total: filteredKeys.length,
          hasMore,
          cursor: nextCursor,
        } as GalleryResponse, {
          headers: {
            "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
          },
        });
      }
    } catch (error) {
      console.error("KV fetch error, falling back to vetted styles:", error);
    }
  }

  // Fallback to words index
  const vettedEntries = loadWordsIndex();
  const startIndex = parseInt(cursor);

  let filteredEntries = vettedEntries;
  if (search) {
    filteredEntries = filteredEntries.filter((entry) =>
      entry.normalized.includes(search)
    );
  }

  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < filteredEntries.length;
  const nextCursor = hasMore ? String(startIndex + limit) : null;

  return NextResponse.json({
    words: paginatedEntries,
    total: filteredEntries.length,
    hasMore,
    cursor: nextCursor,
  } as GalleryResponse, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
    },
  });
}
