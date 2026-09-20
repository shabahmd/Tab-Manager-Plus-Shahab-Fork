"use strict";

import {debounce} from "@helpers/utils";
import * as browser from 'webextension-polyfill';

interface DuplicateGroup {
	url: string;
	tabIds: number[];
	count: number;
}

export async function findDuplicates(windowId?: number): Promise<DuplicateGroup[]> {
	const query: browser.Tabs.QueryInfo = windowId !== undefined ? {windowId} : {};
	const tabs = await browser.tabs.query(query);
	const urlMap = new Map<string, number[]>();

	for (const tab of tabs) {
		if (!tab.url || tab.url.startsWith("about:") || tab.url.startsWith("chrome-extension:") || tab.url.startsWith("view-source:")) continue;
		const existing = urlMap.get(tab.url) || [];
		existing.push(tab.id!);
		urlMap.set(tab.url, existing);
	}

	const duplicates: DuplicateGroup[] = [];
	for (const [url, ids] of urlMap) {
		if (ids.length > 1) {
			duplicates.push({url, tabIds: ids, count: ids.length});
		}
	}

	return duplicates.sort((a, b) => b.count - a.count);
}

export async function markDuplicates(dedupState: Map<number, boolean>) {
	const duplicates = await findDuplicates();
	const now = Date.now();
	for (const group of duplicates) {
		for (const tabId of group.tabIds) {
			dedupState.set(tabId, true);
		}
	}
	return dedupState;
}

// One-click duplicate cleanup (#260): keep the first tab of each duplicate
// URL group, close the rest. Each close is independent so one unclosable
// tab never aborts the batch.
export async function closeDuplicateTabs(): Promise<number> {
	const groups = await findDuplicates();
	let closed = 0;
	for (const group of groups) {
		const keep = group.tabIds[0];
		for (const tabId of group.tabIds) {
			if (tabId === keep) continue;
			try {
				await browser.tabs.remove(tabId);
				closed++;
			} catch (e) {
				console.error("closeDuplicateTabs failed for tab", tabId, e);
			}
		}
	}
	return closed;
}
