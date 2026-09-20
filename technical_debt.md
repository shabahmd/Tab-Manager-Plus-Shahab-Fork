# Technical Debt - Tab Manager Pro

## Session Model Promotion (High Priority)
- **Current**: Sessions stored as raw window dumps without structured metadata
- **Goal**: Promote sessions to first-class, tagged, named entities
- **Target Structure**: `{ name, tags[], timestamp, windows[] }`
- **Impact**: Enables session search, filtering, and better UX
- **Related**: Reuse existing search UX against saved sessions

## Autosave Implementation (High Priority)
- **Current**: No automatic session persistence on close
- **Goal**: Add autosave as primary differentiator (sienori's biggest feature)
- **Implementation**:
  - Hook `windows.onRemoved` for save-on-close
  - Add `chrome.alarms`-based interval save (every 5 min recommended)
- **Permissions**: TMP has MV3 migration permissions (5.3.0) - verify `alarms` permission is included
- **Risk**: Low - leverages existing permissions infrastructure

## Search UX Extension (Medium Priority)
- Extend search scope from live tabs to include saved sessions
- Add session-specific filters (name, tags, date)
- Reuse existing search infrastructure where possible

## Migration Notes
- MV3 migration (5.3.0) already moved to webextension-polyfill
- Check if `chrome.alarms` needs explicit manifest permission
- Session model change may require data migration for existing users