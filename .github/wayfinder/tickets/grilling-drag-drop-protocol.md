# Grilling: Drag-and-Drop Protocol

wayfinder:grilling

## Question

Should window-to-window tab drag-and-drop use the browser.tabs.move() API directly (bypassing DOM) or continue with the current DOM-based drag-and-drop approach?

Issue #261 reports that security updates in Firefox/Chromium broke the HTML5 Drag and Drop API interaction with background browser context permissions. Tabs get locked into their current windows.

## Resolution

**Decision**: Hybrid — use DOM for visual drag feedback and position calculation, but `browser.tabs.move()` for the actual move. This is the standard WebExtensions approach confirmed by MDN.

**MDN Standard** (`browser.tabs.move(tabIds, moveProperties)`): Moves one or more tabs to a new position in the same window or to a different window. Parameters: `tabIds` (integer/array), `moveProperties` (windowId, index). Index of -1 places at end. Pinned tabs cannot cross unpinned boundaries silently.

**Action items**:
1. **Keep DOM drag-drop for visual feedback**: The current `dragStart`/`dragOver`/`drop` event handlers in `Window.tsx` and `Tab.tsx` provide the visual proximity indicator (top/bottom/left/right). Don't remove this.
2. **Fix permission context in drag handlers**: The issue is that in MV3 (non-persistent service worker), the drag event handlers lose their background script context. Fix by making drag-drop logic self-contained in the popup/UI context, or by using `browser.runtime.sendMessage` to delegate permission-sensitive operations to the background script.
3. **Ensure `browser.tabs.move()` is the final move call**: Already implemented in `TabManager.tsx drop()` — verify it works correctly in both Chrome MV3 and Firefox MV3.
4. **Handle pinned tab ordering**: Per MDN, `browser.tabs.move()` silently fails if pinned tabs would cross unpinned boundaries. Add error handling or pre-check for this constraint.
5. **Replace `this.refs` access in drop calculation**: `Window.tsx drop()` uses `this.refs["tab" + tab.id]` — replace with optional chaining to prevent crash if ref is null.

## Closed
