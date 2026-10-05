import type { EngineInterface, Register, Timer } from 'claude-code'

import { clean } from './clean'

const TICK_MS = 250
// For how many ticks, once the selection stops changing, Claude Code's own copy is still awaited.
const WAIT_TICKS = 40
// Clipboard readers, tried in order: Wayland, X11, macOS.
const READERS = [
  ['wl-paste', '--no-newline'],
  ['xclip', '-selection', 'clipboard', '-o'],
  ['pbpaste'],
] as const

let reader: readonly string[] | undefined

async function readClipboard($: EngineInterface): Promise<string | undefined> {
  for (const argv of reader ? [reader] : READERS) {
    const ran = await $.process.run(argv, { timeoutMs: 2000 }).catch(() => undefined)
    if (ran?.exitCode !== 0) continue
    reader = argv
    return ran.stdout
  }
  return undefined
}

export const register: Register = on => {
  let timer: Timer | undefined

  // Claude Code's copy on select writes straight to the clipboard, without raising `ui.copy`:
  // the watcher waits for that copy to land and writes the same text over it, cleaned.
  on('session.start', ($, e, next) => {
    let seen: string | undefined
    let ticks = 0
    let isDone = false
    let isBusy = false

    const tick = async () => {
      const raw = (await $.ui.selection())?.text
      if (raw !== seen) {
        seen = raw
        ticks = 0
        isDone = false
        return
      }
      if (raw === undefined || isDone || ticks++ > WAIT_TICKS) return
      const text = clean(raw)
      if (text === raw) {
        isDone = true
        return
      }
      if ((await readClipboard($))?.trim() !== raw.trim()) return
      isDone = (await $.ui.copy({ text })).isCopied
    }

    timer?.cancel()
    timer = $.clock.every(TICK_MS, () => {
      if (isBusy) return
      isBusy = true
      void tick().finally(() => {
        isBusy = false
      })
    })

    return next(e)
  })
}
