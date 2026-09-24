/**
 * Fetch the designer credit for every font family in vetted-styles.json from
 * Google Fonts' METADATA.pb files and write them to src/data/font-designers.json.
 * Word pages use these for the colophon.
 *
 * Usage: pnpm font-designers
 */

import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const ROOT = join(__dirname, "..")
const STYLES_PATH = join(ROOT, "src/data/vetted-styles.json")
const OUTPUT_PATH = join(ROOT, "src/data/font-designers.json")
const LICENSE_DIRS = ["ofl", "apache", "ufl"]

async function fetchDesigner(family: string): Promise<string | null> {
  const dir = family.toLowerCase().replace(/[^a-z0-9]/g, "")
  for (const license of LICENSE_DIRS) {
    const url = `https://raw.githubusercontent.com/google/fonts/main/${license}/${dir}/METADATA.pb`
    const res = await fetch(url)
    if (!res.ok) continue
    const match = (await res.text()).match(/^designer:\s*"(.+)"$/m)
    // Unescape protobuf text-format escapes like \' and \"
    if (match) return match[1].replace(/\\(["'\\])/g, "$1")
  }
  return null
}

async function main() {
  const styles = JSON.parse(readFileSync(STYLES_PATH, "utf-8")) as {
    words: Record<string, { family: string }>
  }
  const families = [...new Set(Object.values(styles.words).map((v) => v.family))].sort()

  const designers: Record<string, string> = {}
  const missing: string[] = []
  for (const family of families) {
    const designer = await fetchDesigner(family)
    if (designer) designers[family] = designer
    else missing.push(family)
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(designers, null, 2) + "\n")
  console.log(`Wrote ${Object.keys(designers).length}/${families.length} families to src/data/font-designers.json`)
  if (missing.length) console.log(`No metadata found for: ${missing.join(", ")}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
