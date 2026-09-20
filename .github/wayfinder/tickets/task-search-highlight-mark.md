# Task: Search Highlight Markup

wayfinder:task

## Question

Should the search function wrap matching text in `<mark>` tags (or styled `<span>` elements) with high-contrast colors to fix invisible search highlighting?

Issue #194: Browser font rendering updates broke the styling that made matched text distinct from unmatched text.

## Resolution

**Decision**: Yes — wrap matching text in `<mark>` tags with explicit high-contrast styling. This requires both code changes (Tab.tsx + TabManager.tsx) and CSS additions.

**Root Cause**: Search currently uses Sets (`selection`, `hiddenTabs`) to show/hide entire tabs — there is NO text-level highlighting of matching characters. Whatever visual treatment previously made matches visible (possibly CSS hover states or TabManager's `topText`/`bottomText` indicators) was broken by font rendering changes.

**Fix**:

1. **`src/popup/views/TabManager.tsx` — `search()`**: Store the current search query in state (`this.setState({ searchQuery: searchQuery })`). Pass it down through `Window` and `Tab` components as a prop (`searchQuery`).

2. **`src/popup/views/Tab.tsx` — `render()`**: When `this.props.searchActive` is true and `this.props.searchQuery` is set, wrap matching characters in the tab title with `<mark>` tags:
```tsx
<div className="tabtitle">
    {this.highlightSearchText(this.props.tab.title || "", this.props.searchQuery)}
</div>
```
Add a helper method:
```tsx
highlightSearchText(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part)
            ? <mark key={i} className="search-highlight">{part}</mark>
            : <span key={i}>{part}</span>
    );
}
```

3. **`src/popup/views/Tab.tsx` — constructor/props**: Add `searchQuery: string` to `ITab` interface and `ITabState` if needed. Accept as prop from `TabManager.tsx` through `Window.tsx`.

4. **`css/popup.css` or `css/dark.css`**: Add search highlight styles:
```css
.search-highlight {
    background-color: #FFD700;
    color: #000;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: bold;
}
```

5. **Update `ITab` type** (`src/types/ITab.ts`): Add `searchQuery?: string` field.

6. **Prop drilling**: Thread `searchQuery` from `TabManager.tsx` → `Window.tsx` → `Tab.tsx` via props (both already pass through all tab props in their render methods).
