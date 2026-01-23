import { NextResponse } from "next/server"
import { getWordContent, type WordContent } from "@/lib/words"

export interface WordResponse {
  found: boolean
  content: WordContent | null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ word: string }> }
) {
  const { word } = await params
  const decodedWord = decodeURIComponent(word).toLowerCase()

  const content = getWordContent(decodedWord)

  return NextResponse.json({
    found: content !== null,
    content,
  } as WordResponse, {
    headers: {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
