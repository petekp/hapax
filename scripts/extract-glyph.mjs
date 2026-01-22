import opentype from 'opentype.js'
import { writeFileSync } from 'fs'

const FONT_URL = 'https://fonts.gstatic.com/s/imfelldwpica/v16/2sDEZGRQotv9nbn2qSl0TxXVYNwNZgnQ.ttf'

async function extractGlyph() {
  console.log('Downloading font...')
  const response = await fetch(FONT_URL)
  const arrayBuffer = await response.arrayBuffer()

  console.log('Parsing font...')
  const font = opentype.parse(arrayBuffer)

  const glyph = font.charToGlyph('h')

  // First, get the glyph at a reference size to measure it
  const refPath = glyph.getPath(0, 0, 100)
  const refBbox = refPath.getBoundingBox()
  const refWidth = refBbox.x2 - refBbox.x1
  const refHeight = refBbox.y2 - refBbox.y1

  console.log('Reference bbox:', refBbox)
  console.log('Reference size:', refWidth, 'x', refHeight)

  // Calculate font size to fit in viewBox with padding
  const viewBoxSize = 32
  const padding = 2
  const availableSize = viewBoxSize - (padding * 2)
  const scale = Math.min(availableSize / refWidth, availableSize / refHeight)
  const fontSize = 100 * scale

  console.log('Calculated fontSize:', fontSize)

  // Get the path at the calculated size
  const scaledPath = glyph.getPath(0, 0, fontSize)
  const bbox = scaledPath.getBoundingBox()
  const width = bbox.x2 - bbox.x1
  const height = bbox.y2 - bbox.y1

  console.log('Scaled bbox:', bbox)
  console.log('Scaled size:', width, 'x', height)

  // Calculate centering offsets
  // opentype y: 0 = baseline, negative = above baseline, positive = below
  const offsetX = (viewBoxSize - width) / 2 - bbox.x1
  // We want the glyph centered vertically: top at (32-height)/2, bottom at (32+height)/2
  // Since bbox.y1 is negative (top of glyph above baseline), we need to shift down
  const targetTop = (viewBoxSize - height) / 2
  const baselineY = targetTop - bbox.y1  // This makes the top of glyph at targetTop

  console.log('OffsetX:', offsetX, 'BaselineY:', baselineY)

  // Get the final centered path
  const centeredPath = glyph.getPath(offsetX, baselineY, fontSize)
  const centeredPathData = centeredPath.toPathData(2)

  // Verify the result
  const finalBbox = centeredPath.getBoundingBox()
  console.log('Final bbox:', finalBbox)
  console.log('Expected: top at', targetTop, ', bottom at', targetTop + height)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    path {
      fill: #1a1a1a;
    }
    @media (prefers-color-scheme: dark) {
      path { fill: #f5f5f5; }
    }
  </style>
  <path d="${centeredPathData}"/>
</svg>`

  writeFileSync('src/app/icon.svg', svg)
  console.log('Written to src/app/icon.svg')
  console.log('\nPath data:', centeredPathData)
}

extractGlyph().catch(console.error)
