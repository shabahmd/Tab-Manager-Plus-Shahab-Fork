# Tab Manager Plus Specification

## Session Model (v6.0.0+)
Sessions are promoted to first-class citizens with the following structure:
```json
{
  "name": string,
  "tags": string[],
  "timestamp": number,
  "windows": WindowSnapshot[]
}
```

## Search Integration
- Reuse existing TMP search UI against saved sessions
- Search scope extended from live tabs to include session history
- Filter by name, tags, and date ranges

## Autosave Feature
- Trigger: `windows.onRemoved` event for immediate save-on-close
- Periodic save: `chrome.alarms` interval (e.g., every 5 minutes)
- Permission check: TMP already has MV3 migration permissions (5.3.0)
- May need to add `alarms` permission to manifest if not already present