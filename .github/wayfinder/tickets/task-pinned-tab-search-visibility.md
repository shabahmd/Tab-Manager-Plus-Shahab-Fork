# Task: Pinned Tab Search Visibility

wayfinder:task

## Question

Should the search/filter loop check `pinned: true` and enforce a layout rule that keeps pinned tabs visible at the top of their window groupings, even during search filtering?

Issue #112: When using search, matching pinned tabs are unpinned or hidden instead of remaining static at the top of their window groupings.

## Resolution

**Decision**: Yes — pinned tabs must remain visible (not hidden) during search filtering, and should appear at the top of their window groupings before non-pinned matching tabs.

**Root Cause**: In `TabManager.tsx` `search()`, the loop checks only text match against `tab.title` and `tab.url`. It adds matching IDs to `selection` and non-matching to `hiddenTabs`. Pinned tabs have NO special treatment — they get hidden like any non-matching tab.

**Fix**:

1. **`src/popup/views/TabManager.tsx` — `search()`**: In the match check loop, add a pinned-tab guard:
```ts
if (match || tab.pinned) {
    hiddenCount -= this.state.hiddenTabs.has(id) ? 1 : 0;
    this.state.selection.add(id);
    this.state.hiddenTabs.delete(id);
} else {
    hiddenCount += 1 - (this.state.hiddenTabs.has(id) ? 1 : 0;
    this.state.hiddenTabs.add(id);
    this.state.selection.delete(id);
}
```
This keeps pinned tabs visible regardless of search match.

2. **`src/popup/views/TabManager.tsx` — `update()`**: In the window render order (or in `Window.tsx` tab render order), sort tabs so pinned tabs always appear first within each window. Currently tabs render in `window.tabs` order (browser order). Pinned tabs should be sorted to the top:
```ts
// In Window.tsx render(), sort tabs with pinned first
let sortedTabs = [...this.props.tabs].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
});
```

3. **`src/popup/views/Tab.tsx`**: No changes needed — already renders pinned tabs with `tab-pinned` class and "Pinned" label when layout is vertical.

**Note**: The search loop in `search()` also needs the `tab.pinned` check in the `searchType === "normal"` branch specifically, since OR/AND searches already have their own logic for selecting tabs.
