// Bars the terminal draws on the margin (blockquote, pane border) and the reply marker.
const GUTTER = /^(\s*)[▎▏▍▌▐┃│]\s?/
const MARKER = /^(\s*)[⏺●]\s/
const BLOCK_START = /^\s*([-*+•]\s|\d+[.)]\s|#{1,6}\s|>|```|~~~|\||[│┃┌├└╭╰─━])/
const HEADING = /^\s*#{1,6}\s/
const FENCE = /^\s*(```|~~~)/
const MIN_WRAP = 60
const MAX_WRAP = 240

function stripGutter(line: string): string {
  const bars = line.match(/[│┃]/g)?.length ?? 0
  // A drawn table row has more than one bar: left as it is.
  if (bars > 1) return line
  return line.replace(GUTTER, '$1').replace(MARKER, '$1')
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length
}

function hasGutter(line: string): boolean {
  return stripGutter(line) !== line
}

// A selection that starts in the middle of a row has no margin on its first line, and so says
// nothing about the indentation of the others: it is measured on the lines that follow.
function dedent(lines: string[], startsMidRow: boolean): string[] {
  const measured = (startsMidRow ? lines.slice(1) : lines).filter(line => line.trim() !== '')
  if (measured.length === 0) return lines
  const indent = Math.min(...measured.map(indentOf))
  return lines.map(line => line.slice(Math.min(indent, indentOf(line))))
}

// The line was wrapped by the width when the next line's first word did not fit on it.
function wrapsInto(line: string, next: string, width: number): boolean {
  if (line.trim() === '' || next.trim() === '') return false
  if (HEADING.test(line) || FENCE.test(line) || BLOCK_START.test(next)) return false
  const word = next.trimStart().split(/\s/, 1)[0] ?? ''
  return line.length + 1 + word.length > width
}

export function clean(text: string): string {
  const rows = text.split(/\r?\n/)
  const startsMidRow = rows.length > 1 && !hasGutter(rows[0] ?? '') && rows.slice(1).some(hasGutter)
  const lines = dedent(rows.map(line => stripGutter(line).trimEnd()), startsMidRow)
  const width = Math.max(0, ...lines.map(line => line.length))
  // Joins only text that looks like screen rows: the longest line gives the wrap width.
  if (width < MIN_WRAP || width > MAX_WRAP) return lines.join('\n')

  const out: string[] = []
  let inFence = false
  let isJoined = false
  lines.forEach((line, i) => {
    if (isJoined) out[out.length - 1] += ' ' + line.trimStart()
    else out.push(line)
    if (FENCE.test(line)) inFence = !inFence
    const next = lines[i + 1]
    isJoined = !inFence && next !== undefined && wrapsInto(line, next, width)
  })
  return out.join('\n')
}
