# Research: Firefox New Tab Opens New Window

wayfinder:research

## Question

Why does opening new tabs in Firefox create new windows instead of tabs within the existing window, and what is the correct fix?

## Resolution

**Decision**: The `browser.tabs.create({ windowId })` call from Firefox popup context can lose the window reference when the popup closes immediately. Fix: delegate tab creation to the background/service worker via `browser.runtime.sendMessage`, which maintains a stable window context.

**Context7 findings**:
- `tabs.create()` `windowId` defaults to "current window" — passing a wrong/stale `windowId` causes Firefox to misplace the tab
- `tabs.getCurrent()` returns **undefined** from popup context — cannot self-identify from popup
- Firefox popup window type is `'popup'` (distinct from `'normal'` browser window)

**Root Cause**: `Window.tsx` `addTab()` calls `browser.tabs.create({ windowId: this.props.window.id })` directly from the popup. In Firefox, when the popup closes immediately after the API call, the tab creation context is lost, and Firefox defaults to creating a new window.

**Fix**:

1. **`src/service_worker/background/actions.ts`** — Add a `create_tab` command handler:
```ts
case S.create_tab:
    await browser.tabs.create({
        windowId: request.window_id,
        url: request.url || "about:blank",
        active: request.active !== false
    });
    break;
```

2. **`src/popup/views/Window.tsx`** — `addTab()`: Replace direct `browser.tabs.create()` with a message to the background script:
```ts
async addTab(e) {
    this.stopProp(e);
    if (navigator.userAgent.search("Firefox") > -1) {
        browser.runtime.sendMessage<ICommand>({
            command: S.create_tab,
            window_id: this.props.window.id
        });
    } else {
        browser.tabs.create({ windowId: this.props.window.id });
    }
}
```

3. **Why this works**: The background/service worker maintains a persistent context (Chrome MV3 service worker stays alive long enough; Firefox MV2 persistent background always persists). The background script can reliably call `browser.tabs.create()` with the correct `windowId` because it doesn't suffer from popup lifecycle issues.

4. **Alternative for Chrome parity**: Could always use the message-passing approach (even on Chrome) for consistency, but Chrome's popup context is more reliable so direct `tabs.create()` works fine.
