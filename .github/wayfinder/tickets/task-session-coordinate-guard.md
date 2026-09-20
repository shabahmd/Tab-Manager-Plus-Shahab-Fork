# Task: Session Coordinate Guard

wayfinder:task

## Question

Should the session restoration script add mathematical guardrails to prevent windows from opening off-screen when saved coordinates are extreme negative numbers?

Issue #217: Saved window coordinates sometimes become extreme negative numbers (e.g., top: -32000, left: -32000). On restore, the window opens entirely off-screen — visible in taskbar but unmovable.

## Resolution

**Decision**: Yes — add comprehensive bounds validation in `createWindowWithSessionTabs()` in `windows.ts`. The existing guard is insufficient (only checks `left` and `top` independently with hardcoded thresholds).

**Current guard** (windows.ts lines 79-87):
```ts
if (filteredWindow.left < 0 || filteredWindow.left > 800) filteredWindow.left = 0;
if (filteredWindow.top < 0 || filteredWindow.top > 600) filteredWindow.top = 0;
```
**Problems**: Hardcoded 800x600 thresholds don't account for multi-monitor setups, only checks left/top (not width/height), doesn't handle extreme negative values beyond just <0.

**Fix**: Replace the existing guard with comprehensive validation:
```ts
// Session coordinate guard — prevent windows opening off-screen
const MIN_POSITION_X = 0;
const MIN_POSITION_Y = 0;
const MIN_SIZE = 200;
const MAX_SIZE = 5000;

if (!filteredWindow.left || filteredWindow.left < MIN_POSITION_X) filteredWindow.left = MIN_POSITION_X;
if (!filteredWindow.top || filteredWindow.top < MIN_POSITION_Y) filteredWindow.top = MIN_POSITION_Y;
if (!filteredWindow.width || filteredWindow.width < MIN_SIZE) filteredWindow.width = MIN_SIZE;
if (!filteredWindow.width || filteredWindow.width > MAX_SIZE) filteredWindow.width = MAX_SIZE;
if (!filteredWindow.height || filteredWindow.height < MIN_SIZE) filteredWindow.height = MIN_SIZE;
if (!filteredWindow.height || filteredWindow.height > MAX_SIZE) filteredWindow.height = MAX_SIZE;
```

Also add a fallback: if `browser.system.display.getInfo()` is available (Chrome with `system.display` permission), validate that the window position is actually on a monitor:
```ts
if (navigator.userAgent.search("Firefox") === -1) {
    try {
        const displays = await chrome.system.display.getInfo();
        const onScreen = displays.some((display) => {
            return filteredWindow.left >= display.bounds.left &&
                   filteredWindow.top >= display.bounds.top &&
                   filteredWindow.left < display.bounds.left + display.bounds.width &&
                   filteredWindow.top < display.bounds.top + display.bounds.height;
        });
        if (!onScreen) {
            filteredWindow.left = 0;
            filteredWindow.top = 0;
        }
    } catch (e) {
        // system.display not available, use simple clamp
    }
}
```

**Key changes**:
1. Clamp `left` and `top` to >= 0 (not just < 0 check, also handles null/undefined)
2. Validate `width` and `height` against min/max bounds
3. Optional multi-monitor validation via `system.display` (Chrome only)
4. Use `MIN_POSITION_X/Y = 0` instead of relying on the previous 800/600 thresholds which were too restrictive for multi-monitor users
