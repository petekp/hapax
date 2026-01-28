export interface ParsedSection {
  type: "heading" | "paragraph" | "blockquote" | "list"
  level?: number
  content: string
  items?: string[]
}

export function parseMarkdown(content: string): ParsedSection[] {
  const lines = content.split("\n")
  const sections: ParsedSection[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("## ")) {
      sections.push({ type: "heading", level: 2, content: line.slice(3) })
      i++
    } else if (line.startsWith("> ")) {
      let quote = line.slice(2)
      i++
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote += "\n" + lines[i].slice(2)
        i++
      }
      sections.push({ type: "blockquote", content: quote })
    } else if (line.startsWith("- ")) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2))
        i++
      }
      sections.push({ type: "list", content: "", items })
    } else if (line.trim()) {
      let para = line
      i++
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].startsWith("#") &&
        !lines[i].startsWith(">") &&
        !lines[i].startsWith("- ")
      ) {
        para += " " + lines[i]
        i++
      }
      sections.push({ type: "paragraph", content: para })
    } else {
      i++
    }
  }

  return sections
}

export function parseRelatedWordItem(
  item: string
): { word: string; description: string } | null {
  const match = item.match(/^\*\*(.+?)\*\*\s*\((.+)\)$/)
  if (match) {
    return { word: match[1], description: match[2] }
  }
  return null
}
