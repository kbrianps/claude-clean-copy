# claude-clean-copy

A Claude Code plugin that cleans the text you copy from the terminal.

In the fullscreen TUI, selecting text with the mouse copies it as it is drawn on screen: with the bar glyph of the left margin and with a line break wherever the row wrapped, in the middle of a sentence. This plugin rewrites the clipboard right after the copy, with the same text cleaned:

- the margin bar (`▎`, `│`) and the reply marker are removed;
- the screen indentation is removed;
- rows wrapped by the terminal width are joined back into one line.

List items, code blocks, drawn tables and text made of short lines are left as they are.

## Install

```
claude plugin marketplace add kbrianps/claude-clean-copy
claude plugin install clean-copy@claude-clean-copy
```

Then start a new session, or run `/reload-plugins`.

## How it works

Claude Code's copy on select writes straight to the clipboard and does not raise the `ui.copy` plugin event, so a plugin cannot rewrite the text before it is copied ([anthropics/claude-code#99758](https://github.com/anthropics/claude-code/issues/99758)). The plugin works around that:

1. every 250 ms it reads the current selection (`$.ui.selection()`);
2. once the clipboard holds exactly that selection, it writes the cleaned text over it.

It only touches the clipboard when it holds the text you just selected in Claude Code, so a copy made in another app is never overwritten.

## Requirements and limits

- Claude Code with the fullscreen TUI (`"tui": "fullscreen"`) and copy on select on (the default).
- A clipboard reader on the machine: `wl-paste` (Wayland), `xclip` (X11) or `pbpaste` (macOS).
- Tested on Ubuntu with GNOME on Wayland and Ghostty. The X11 and macOS readers are untested. Windows is not supported.
- Pasting less than about half a second after releasing the mouse may still get the raw text.
- A selection made by the terminal itself (shift + drag) never reaches Claude Code, so it is not cleaned.
- Joining wrapped rows is a heuristic on the longest line of the selection. It can be wrong; please open an issue with the text as selected and as pasted.
- The plugin API (function hooks) is early access and may change between Claude Code releases. Written against 2.1.289.

## Development

```
claude plugin validate plugins/clean-copy
claude plugin test plugins/clean-copy
```

The cleaning rule is `plugins/clean-copy/hooks/clean.ts`, with its tests beside it.

## License

MIT
