# ShowSign — Bitfocus Companion module

Fire [ShowSign](https://portal.showsign.io) announcement cues to screen groups from
Bitfocus Companion — take-your-seats prompts, "starting now" flashes, or a looping brand
clip on every sign in a room, triggered from your Stream Deck or any Companion surface.

## What it does

- **Fire cue on group** — pick a screen group and a cue (text or media); optionally
  auto-clear after N seconds.
- **Clear group** — remove the current announcement from a group's signs.
- **Feedback: Group is showing cue** — lights a button (ShowSign yellow by default) while
  the chosen group is currently showing the chosen cue.
- **Variables** — `$(showsign:event_name)` and a live cue label per group.

Group and cue dropdowns populate automatically from your event and refresh every few
seconds, so cues you add in the portal appear on your surface without reconfiguring.

## Configuration

1. In the ShowSign portal, open **Event → Announcements** and create at least one **screen
   group** and one **cue**.
2. Under **Automation keys**, generate a key for that event and copy it.
3. In Companion, add the **ShowSign** connection and set:
   - **ShowSign API base URL** — usually `https://portal.showsign.io/api`
   - **Automation key** — the key you copied

The connection turns **OK** and shows your event name once the key is valid. See
[`companion/HELP.md`](companion/HELP.md) for the operator-facing help.

## Development

```bash
npm install
npx companion-module-build   # produces a .tgz you can import into Companion
```

Point Companion's **Developer modules path** at the folder that contains this module, or
import the built package.

## License

[MIT](LICENSE) © Jacob Abart
