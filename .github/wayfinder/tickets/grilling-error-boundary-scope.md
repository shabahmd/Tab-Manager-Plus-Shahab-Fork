# Grilling: Error Boundary Scope

wayfinder:grilling

## Question

How comprehensive should defensive undefined-safety checks be across the codebase — targeted fixes for known crashes, or systematic optional-chaining everywhere?

Issue #209 reports the app crashes blank when `hostname` is undefined or `this.refs.root` is undefined. The user's fix suggests wrapping in safe checks (optional chaining like `tab?.url` or fallback values).

## Resolution

**Decision**: Comprehensive/systematic — apply optional chaining everywhere tab/window properties are accessed, add fallback guards at the data-loading layer, and add React error boundaries at the root level.

**Action items**:
1. **Systematic optional chaining**: Replace all `tab.url`, `tab.title`, `tab.pendingUrl`, `tab.favIconUrl`, `tab.discarded`, `tab.mutedInfo`, `window.title`, `url.hostname` accesses with safe navigation (`tab?.url`, `tab?.mutedInfo?.muted`, `url?.hostname`, etc.)
2. **Data-loading layer guards**: Centralize safe access in `src/helpers/storage.ts` and `src/service_worker/background/` — create utility functions like `getTabUrl(tab)`, `getTabTitle(tab)`, `getTabFavicon(tab)` that return `""` or sensible defaults for undefined properties
3. **React root error boundary**: Add a static error boundary wrapper in `popup.tsx`/`index.ts` that catches render errors and displays a fallback UI instead of a blank page (React 16.11 supports `componentDidCatch` in class components)
4. **Ref guards**: Replace `this.refs["window" + windowId]` and `this.refs["tab" + tabid]` with optional chaining (`(this.refs[...] as Window)?.state`) and null checks before method calls
5. **Hostname extraction**: Wrap `new URL()` and `.hostname` access in `Window.tsx update()` in try/catch with fallback to `_tab.title || "unknown"`

## Closed
