# Task: Firefox Sidebar Integration

wayfinder:task

## Question

How do we ensure Tab Manager Plus opens correctly in Firefox's sidebar panel, and what needs to be verified/fixed?

## Context

Firefox `sidebar_action` infrastructure already exists in the codebase:
- `manifest-firefox.json`: `sidebar_action` with `default_panel: "popup.html?panel=true"`
- `src/service_worker/ui/open.ts`: `openSidebar()` calls `browser.sidebarAction.open()`
- `src/service_worker/ui/context_menus.ts`: "🗂 Open sidebar" context menu item
- `src/service_worker/ui/open.ts` `setupPopup()`: sets panel via `sidebarAction.setPanel({panel: "popup.html?panel=true"})`
- `src/popup/popup.tsx`: handles `?panel=true` URL param (`window.inPanel=true`), sets full width/height CSS for panel mode

## Resolution

**Decision**: Sidebar is already wired up but needs verification and small improvements for reliable Firefox sidebar opening.

**Verification checklist**:

1. **`sidebarAction.setPanel()` call is working**: In `src/service_worker/ui/open.ts` line 62-64, `setupPopup()` sets the panel on every service worker startup. This is correct — the panel URL must be set before opening.

2. **`sidebarAction.open()` triggered from user action only**: Per MDN, `sidebarAction.open()` can only be called from a user action handler. Currently it's called from:
   - Context menu click (`context_menus.ts:127`) ✅ user action
   - Potentially from `browser.action.onClicked` listener ❌ would fail — must not call `sidebarAction.open()` from action button click

3. **Fix `setupPopup()` — don't mix action and sidebar**: When `openInOwnTab` is true, the action button opens a tab. When false, it opens a popup. Neither should try to open the sidebar. Make sure `sidebarAction.open()` is never called from `browser.action.onClicked`.

4. **Add sidebar toggle from popup**: In the popup UI (`TabManager.tsx`), add a sidebar toggle button or integrate with the options page to let users know they can use the sidebar. Alternatively, detect sidebar context and adjust layout further.

5. **Verify panel CSS for sidebar width**: The sidebar in Firefox is typically narrower than the popup (~300-400px). Verify that the popup CSS (`css/popup.css`) handles narrow widths gracefully. The `inPanel` flag in `popup.tsx` removes max-width/max-height constraints but doesn't adjust the layout for narrow widths. Consider adding sidebar-specific CSS in `css/dark.css` or a new `css/sidebar.css`:
```css
@media (max-width: 500px) {
    .window-container.blocks .icon.tab {
        width: 100%;
        min-width: unset;
    }
    .window-container.blocks .window-actions {
        font-size: 12px;
    }
    .window-container.vertical {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
    }
}
```

6. **Firefox MV3 sidebar**: After Firefox MV3 migration (research ticket: research-firefox-mv3-migration), `sidebar_action` is preserved. Verify that `sidebarAction.setPanel()` still works in Firefox MV3 (it does per MDN).

7. **Make sidebar discoverable**: Add a setting or UI hint that tells Firefox users they can open the extension in the sidebar. This could be:
   - An option page toggle: "Open in sidebar (Firefox)"
   - A tooltip on the extension icon: "Click sidebar icon in toolbar to open in sidebar"
   - The existing context menu item "🗂 Open sidebar" already serves this purpose
