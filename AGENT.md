# Agent Guidelines - Tab Manager Pro

This project follows standard agent development practices. Key guidelines:

## Session Management
- Sessions are now first-class, tagged, named entities (since v6.0.0)
- Session structure: `{ name, tags[], timestamp, windows[] }` model
- Replace raw window dumps with structured Session objects
- Session list/search view reuses existing TMP search UX against saved sessions

## Autosave Implementation
- Hook `windows.onRemoved` for save-on-close functionality
- Implement alarm-based interval save using `chrome.alarms`
- TMP manifest already has permissions infrastructure from MV3 migration (5.3.0)
- Verify if `chrome.alarms` permission needs to be added to manifest

## Technical Debt
- Promote sessions to first-class entity with name, tags, timestamp, windows
- Add session list/search view using existing search UX
- Implement autosave via window removal + alarms