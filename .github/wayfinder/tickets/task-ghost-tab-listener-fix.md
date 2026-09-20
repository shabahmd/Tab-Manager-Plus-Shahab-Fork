# Task: Ghost Tab onRemoved Listener Fix

wayfinder:task

## Question

Is the `browser.tabs.onRemoved` event listener properly bound in the background/service worker, and does it force a clean state re-render to the active React views when tabs close via native shortcuts (Ctrl+W)?

## Resolution

**Decision**: The listener IS bound but does NOT force a clean React re-render. Fix requires two changes: (1) service worker must actively notify the popup on tab removal, (2) popup must respond immediately (not debounced) to onRemoved events.

**Root Cause**: `setupTabListeners()` in `tabs.ts` binds `browser.tabs.onRemoved` to `tabCountChanged` and `checkTabRemove`. But `checkTabRemove` only calls `checkWindow()` (hash update) — it does NOT trigger a popup re-render. In MV3, the non-persistent service worker can suspend before the popup receives an update signal, leaving ghost tabs.

**Fix**:

1. **`src/service_worker/background/tabs.ts` — `checkTabRemove`**: Add a `browser.runtime.sendMessage` call to force the popup to refresh immediately:
```ts
async function checkTabRemove(tabid, removeinfo) {
    if (removeinfo.isWindowClosing) return;
    await checkWindow(removeinfo.windowId);
    // Force popup re-render — critical for MV3 service worker
    browser.runtime.sendMessage({ command: "refresh_windows", window_ids: [removeinfo.windowId] }).catch(() => {});
}
```

2. **`src/service_worker/background/actions.ts` — `handleMessages`**: Add handler for `refresh_windows` command if not present (the popup already handles it in `TabManager.tsx componentDidMount`).

3. **`src/popup/views/TabManager.tsx` — `componentDidMount`**: Change `runUpdate` (the debounced onRemoved listener) to fire immediately:
```ts
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    this.update();  // immediate, not debounced
});
```
Keep debounced `runUpdate` for other events (onCreated, onUpdated, onMoved).

4. **`src/service_worker/service_worker.ts`**: Ensure `_t.updateTabCountDebounce()` is called immediately after `setup()` runs (already done), and add a `setTimeout` to force an initial update 500ms after startup to catch any missed events.
