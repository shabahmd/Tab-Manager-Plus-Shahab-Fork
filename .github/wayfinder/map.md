# Wayfinder Map: Tab Manager Pro Modernization

## Destination

Modernize Tab Manager Pro for Manifest V3 across both Chrome and Firefox, while fixing critical stability, UI, and functionality bugs blocking users on modern browsers (tab suspension, dark mode, search, drag-drop, data loss, Firefox tab/window confusion, Firefox sidebar integration).

## Notes

- Domain: Extension development (Chrome + Firefox WebExtensions)
- Skills to consult: "grilling", "domain-modeling", "researcher"
- Chrome MV3 is already done (v5.3.0 changelog: "Fix: Move to manifest v3")
- Firefox still on MV2 (manifest-firefox.json: manifest_version: 2, persistent background, browser_action)
- Source uses React 16.11, TypeScript, esbuild, webextension-polyfill
- Tracker: local-markdown tracker under `.github/wayfinder/`

## Decisions so far

- [Error Boundary Scope](grilling-error-boundary-scope.md): Comprehensive — systematic optional chaining everywhere, data-loading layer guards, React error boundary at root, ref guards with null checks, try/catch on hostname
- [Drag-and-Drop Protocol](grilling-drag-drop-protocol.md): Hybrid — DOM for visual feedback/position, `browser.tabs.move()` for actual move (standard per MDN); fix permission context in drag handlers, handle pinned tab ordering
- [Ghost Tab Listener](task-ghost-tab-listener-fix.md): Fix — add `browser.runtime.sendMessage("refresh_windows")` in `checkTabRemove`, make `onRemoved` re-render immediate in popup (not debounced)
- [Dark Mode Active Tab Contrast](task-dark-mode-contrast-fix.md): Fix — add `.icon.highlighted` and `.tab.highlighted` rules with gold/yellow (#FFD700) background, border, and color on dark mode
- [Search Highlight Markup](task-search-highlight-mark.md): Fix — wrap matches in `<mark class="search-highlight">` via `highlightSearchText()` helper in Tab.tsx, pass `searchQuery` prop through Window→Tab, add CSS for `.search-highlight`
- [Pinned Tab Search Visibility](task-pinned-tab-search-visibility.md): Fix — add `|| tab.pinned` guard in search match loop so pinned tabs stay visible; sort pinned tabs to top in Window.tsx render
- [Session Coordinate Guard](task-session-coordinate-guard.md): Fix — replace hardcoded 800/600 clamp with MIN/MAX bounds for width/height/left/top (all >= 0), add optional multi-monitor validation via `system.display`
- [Firefox New Tab Window](research-firefox-new-tab-window): Delegate `tabs.create()` to background script via `runtime.sendMessage` on Firefox (popup context loses windowId); direct call works on Chrome
- [Discarded Tab Data](research-discarded-tab-strategy): Fix — implement `TabMetadataCache` in service worker to preserve URL/title/favIconUrl before discard; cache on every `onUpdated`, provide `getCachedMetadata(tabId)` API
- [Firefox Sidebar Integration](task-firefox-sidebar-integration): Already wired in manifest + code; verify open() from user actions only, add narrow-width CSS for sidebar panel, make sidebar discoverable

## Not yet specified

- **MV3 service worker persistence**: Chrome's non-persistent service worker may behave differently from Firefox's persistent background script — implications for state recovery on suspend/resume need investigation
- **Cross-context identity permissions**: Firefox contextualIdentities API changes under MV3 may affect container tab handling — scope unclear until Firefox MV3 migration begins

## Out of scope

- React version upgrade (16.11 → 18+): separate effort, not tied to MV3 or bug fixes
- New feature development (duplicate finder overhaul, session management changes)
