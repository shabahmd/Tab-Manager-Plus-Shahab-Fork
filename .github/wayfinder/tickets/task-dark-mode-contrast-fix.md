# Task: Dark Mode Active Tab Contrast

wayfinder:task

## Question

How should the CSS for the active/highlighted tab wrapper in dark mode be updated so active tabs are clearly distinguishable from inactive tabs?

Issue #211: Users on dark browser themes can't read the distinction between active and inactive tabs in the manager.

## Resolution

**Decision**: Update `css/dark.css` to give `.icon.highlighted` and `.tab.highlighted` high-contrast styling in dark mode, making active tabs clearly distinct from inactive tabs.

**Current state**: `.icon.highlighted` has `background-color: #333` on dark mode — barely distinguishable from `.window` background (`#203238`) and `.icon` default (`#07222b`). No `.tab.highlighted` rule exists.

**Fix for `css/dark.css`**: Add the following rules:

```css
/* Active tab — high contrast for dark mode */
body.dark .icon.highlighted {
    background-color: #FFD700;
    border-color: #FFD700;
    color: #000;
}
body.dark .icon.highlighted .iconoverlay {
    border-color: #FFD700;
}
body.dark .tab.highlighted {
    background-color: #FFD700;
    color: #000;
    border: 2px solid #FFD700;
}
body.dark .icon.incognito.highlighted {
    background-color: #FFD700;
    border-color: #FFD700;
    color: #000;
}
body.dark .tab.selected.highlighted {
    background-color: yellow;
    color: black;
}
```

**Rationale**: Gold/yellow (#FFD700) on the dark blue-gray background (#203238) provides strong contrast (>10:1 ratio). The border provides additional visual distinction beyond background color alone. The same styling applies to incognito highlighted tabs since the active state should always be prominent.
