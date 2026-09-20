"use strict";

import * as browser from 'webextension-polyfill';

export interface WindowSortOptions {
	orderByTabCount: boolean;
	disableResorting: boolean;
}

// Window ordering extracted from TabManager.update(). Minimized windows
// always sink to the bottom; otherwise the order is stable-by-id when
// re-sorting is disabled, by tab count when requested, and by recent
// activity (windowAge) by default.
export function sortWindows(windows : browser.Windows.Window[], sort_windows : number[], options : WindowSortOptions) : void {
	const orderByTabCount = !!options.orderByTabCount;
	const disableResorting = !!options.disableResorting;

	windows.sort(function(a, b) {
		if (a.state === "minimized" && b.state !== "minimized") return 1;
		if (b.state === "minimized" && a.state !== "minimized") return -1;
		if (!!disableResorting) {
			if (a.id < b.id) return -1;
			if (a.id > b.id) return 1;
			return 0;
		}
		if (!!orderByTabCount) {
			const aTabs = (a.tabs || []).length;
			const bTabs = (b.tabs || []).length;
			if (aTabs !== bTabs) return bTabs - aTabs;
		}
		var aSort = sort_windows.indexOf(a.id);
		var bSort = sort_windows.indexOf(b.id);
		if (aSort < bSort) return -1;
		if (aSort > bSort) return 1;
		return 0;
	});
}
