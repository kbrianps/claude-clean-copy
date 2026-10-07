import { expect, test } from 'claude-code/testing'

import { clean } from './clean'

test('strips the gutter bar and joins a sentence wrapped by the width', async () => {
  const screen = [
    '  ▎ The start hook injects the briefing with the agenda of the day and, on each',
    '  ▎ message, another hook says the time. Both are facts from the CLI.',
    '  ▎',
    '  ▎ Second paragraph, short.',
  ].join('\n')

  expect(clean(screen)).toBe(
    'The start hook injects the briefing with the agenda of the day and, on each message, another hook says the time. Both are facts from the CLI.\n\nSecond paragraph, short.',
  )
})

test('does not join list items, code or short lines', async () => {
  const list = [
    '- first item that takes the whole row up to the edge of the screen, really long one',
    '- second item',
    '```',
    'const a = 1 // a comment that also takes the whole row up to the edge of the screen',
    'const b = 2',
    '```',
  ].join('\n')
  expect(clean(list)).toBe(list)
  expect(clean('one line\nanother line')).toBe('one line\nanother line')
})

test('strips a pane border and leaves a drawn table as it is', async () => {
  const pane =
    '│ Text of a pane with a sentence long enough to be wrapped at the width of the\n│ screen and go on here.'
  expect(clean(pane)).toBe(
    'Text of a pane with a sentence long enough to be wrapped at the width of the screen and go on here.',
  )
  const table = '│ a │ b │\n│ 1 │ 2 │'
  expect(clean(table)).toBe(table)
})

test('a selection that starts mid-row leaves no indentation on the rows after it', async () => {
  const screen = ['holidays = rest', '  ▎ rest == coding', '  ▎', '  ▎ Third row.'].join('\n')
  expect(clean(screen)).toBe('holidays = rest\nrest == coding\n\nThird row.')
})

test('a first line with no margin keeps the indentation of plain text after it', async () => {
  const text = 'Title\n  - item one\n  - item two'
  expect(clean(text)).toBe(text)
})
