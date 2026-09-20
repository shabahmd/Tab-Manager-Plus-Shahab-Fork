"use strict";

import * as browser from 'webextension-polyfill';

// Duplicate-tab detection extracted from TabManager.highlightDuplicates().
// Two tabs count as duplicates when their urls are exactly equal.
export function findDuplicateTabIds(tabsbyid : Map<number, browser.Tabs.Tab>) : number[] {
	const idList : number[] = [...tabsbyid.keys()];
	const dup = [];
	for (const id of idList) {
		const tab = tabsbyid.get(id);
		for (const id2 of idList) {
			if (id === id2) continue;
			const tab2 = tabsbyid.get(id2);
			if (tab.url === tab2.url) {
				dup.push(id);
				break;
			}
		}
	}
	return dup;
}
