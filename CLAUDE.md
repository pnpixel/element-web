# Goal
Add suggested reactions UI for bot messages in Element Web.

# Behavior
- If event.content contains `com.myorg.suggested_reactions`, render these reactions as clickable chips/buttons under the message.
- On click, send a standard Matrix `m.reaction` for the target event.
- Do not break the normal reaction picker.
- If the custom field is absent, do nothing.

# Constraints
- Minimal diff.
- Reuse the existing reaction sending path if possible.
- Keep styling close to current Element UI.
- First inspect and propose the exact files to change, then edit.
- After edits, run relevant checks and summarize changed files.

# Language
- Reply in Russian.