# Research: Discarded Tab Data Strategy

wayfinder:research

## Question

When browser tabs enter discarded (suspended) state, should the extension use cached tab metadata or fall back to browser API requests — and what are the failure modes of each?

The issue reports that modern browsers aggressively discard background tabs, causing Tab Manager Plus to read them as "empty memory blocks," resulting in inaccurate tab counts and sorting failures.

## Context

- Tab.tsx already checks `tab.discarded` in the CSS class list (line: `(this.props.tab.discarded ? "discarded " : "")`)
- Window.tsx `update()` queries `browser.tabs.query({ windowId: ... })` — discarded tabs may have missing url, title, favIconUrl
- `tab.url` and `tab.title` are accessed without optional chaining in multiple places (Window.tsx: `url.hostname`, `_tab.title`, `tab.url`)
- Issue #207 recommends: "If tab.discarded is true, fall back to parsing cached tab.title and tab.url"
- The codebase currently has NO persistent cache of tab metadata outside browser API queries
