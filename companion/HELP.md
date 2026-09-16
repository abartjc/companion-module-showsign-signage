# ShowSign

Fire ShowSign announcement cues to screen groups from Companion — take-your-seats prompts,
"starting now" flashes, or a looping brand clip on every sign in a room.

## Setup

1. In the ShowSign portal, open your **Event → Announcements** and create at least one
   **screen group** (the signs a cue targets) and one **cue** (text or media).
2. Under **Automation keys**, generate a key for this event and copy it.
3. In Companion, add the **ShowSign** connection and set:
   - **ShowSign API base URL** — usually `https://portal.showsign.io/api`
   - **Automation key** — the key you copied

The connection turns **OK** and shows your event name once the key is valid.

## Actions

- **Fire cue on group** — pick a group and a cue; optionally auto-clear after N seconds.
- **Clear group** — remove the current announcement from a group's signs.

The group and cue dropdowns populate automatically from your event and refresh every few
seconds, so cues you add in the portal appear here without reconfiguring.

## Feedback

- **Group is showing cue** — lights a button (ShowSign yellow by default) while the chosen
  group is currently showing the chosen cue, so your surface reflects what's live on the walls.

## Variables

- `$(showsign:event_name)` — the connected event.
- `$(showsign:group_<id>_cue)` — the live cue label for each group (blank when clear).

## A typical "take your seats" flow

Three buttons on your surface, all targeting the *General Announcements* group:

1. **5 minutes** → Fire cue "Program begins in 5 minutes"
2. **About to begin** → Fire cue "Please take your seats"
3. **Starting now** → Fire cue "Starting now" (or a media cue), auto-clear after 60s

Each lights up via the feedback while it's the live cue.
