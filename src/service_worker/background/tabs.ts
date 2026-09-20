"use strict";

import {getLocalStorage} from "@helpers/storage";
import {trackLastTab} from "@background/actions"
import {globalTabsActive} from '@context';
import {debounce} from "@helpers/utils";
import {checkWindow, createWindowWithTabs} from '@background/windows';
import * as browser from 'webextension-polyfill';

export async function setupTabListeners() {
	browser.tabs.onCreated.removeListener(tabAdded);
	browser.tabs.onUpdated.removeListener(tabCountChanged);
	browser.tabs.onRemoved.removeListener(tabCountChanged);
	browser.tabs.onReplaced.removeListener(tabCountChanged);
	browser.tabs.onDetached.removeListener(tabCountChanged);
	browser.tabs.onAttached.removeListener(tabCountChanged);
	browser.tabs.onActivated.removeListener(tabActiveChanged);
	browser.tabs.onMoved.removeListener(tabCountChanged);

	browser.tabs.onCreated.removeListener(checkTabCreate);
	browser.tabs.onUpdated.removeListener(checkTabUpdate);
	browser.tabs.onRemoved.removeListener(checkTabRemove);
	browser.tabs.onDetached.removeListener(checkTabDetached);
	browser.tabs.onAttached.removeListener(checkTabAttached);
	browser.tabs.onMoved.removeListener(checkTabMoved);

	browser.tabs.onCreated.addListener(tabAdded);
	browser.tabs.onUpdated.addListener(tabCountChanged);
	browser.tabs.onRemoved.addListener(tabCountChanged);
	browser.tabs.onReplaced.addListener(tabCountChanged);
	browser.tabs.onDetached.addListener(tabCountChanged);
	browser.tabs.onAttached.addListener(tabCountChanged);
	browser.tabs.onActivated.addListener(tabActiveChanged);
	browser.tabs.onMoved.addListener(tabCountChanged);

	browser.tabs.onCreated.addListener(checkTabCreate); // 1, tab
	browser.tabs.onUpdated.addListener(checkTabUpdate); // 3, tabid, changeinfo, tab
	browser.tabs.onRemoved.addListener(checkTabRemove); // 2, tabid, removeinfo
	browser.tabs.onDetached.addListener(checkTabDetached); // 2, tabid, detachinfo
	browser.tabs.onAttached.addListener(checkTabAttached); // 2, tabid, attachinfo
	browser.tabs.onMoved.addListener(checkTabMoved); // 2, tabid, moveinfo
}

export async function discardTabs(tabs) {
	for (const tab of tabs) {
		if (!tab.discarded) {
			browser.tabs.discard(tab.id).catch(function (e) {
				console.error(e);
				console.log(e.message);
			});
		}
	}
}

export async function closeTabs(tabs) {
	for (const tab of tabs) {
		await browser.tabs.remove(tab.id);
	}
}

export async function moveTabsToWindow(windowId, tabs) {
	// One unmovable tab (chrome:// pages, extension pages, incognito mismatch)
	// must not abort the whole batch - move each tab independently.
	const target = await browser.windows.get(windowId).catch(() => null);
	for (const tab of tabs) {
		try {
			if (!tab || tab.id == null) continue;
			// Tabs cannot be mixed between incognito and normal windows
			if (!!target && !!target.incognito !== !!tab.incognito) continue;
			await browser.tabs.move(tab.id, {windowId: windowId, index: -1});
			if (!!tab.pinned) {
				await browser.tabs.update(tab.id, {pinned: true}).catch(() => {});
			}
		} catch (e) {
			console.error("moveTabsToWindow failed for tab", tab && tab.id, e);
		}
	}
}

export async function moveTabsWithinWindow(tabIds: number[], targetWindowId: number, targetIndex: number) {
	const tabs = await browser.tabs.query({windowId: targetWindowId});
	const pinnedTabs = tabs.filter(t => t.pinned).sort((a, b) => a.index - b.index);
	let insertIndex = targetIndex;
	if (insertIndex <= pinnedTabs.length) {
		insertIndex = pinnedTabs.length;
	}
	for (const tabId of tabIds) {
		try {
			await browser.tabs.move(tabId, {windowId: targetWindowId, index: insertIndex});
			insertIndex++;
		} catch (e) {
			console.error("moveTabsWithinWindow failed for tab", tabId, e);
		}
	}
}

export async function createTabInWindow(windowId: number) {
	const tab = await browser.tabs.create({ windowId: windowId });
	return tab;
}

const tabMetadataCache: Map<number, {url: string, title: string, favIconUrl: string, pendingUrl: string}> = new Map();

export async function cacheTabMetadata(tabId: number, url: string, title: string, favIconUrl: string, pendingUrl?: string) {
	tabMetadataCache.set(tabId, {url, title, favIconUrl, pendingUrl: pendingUrl || ""});
}

export async function getCachedTabMetadata(tabId: number) {
	return tabMetadataCache.get(tabId);
}

export async function clearCachedTabMetadata(tabId: number) {
	tabMetadataCache.delete(tabId);
}

export function focusOnTabAndWindowDelayed(tabId: number, windowId: number) {
	setTimeout(focusOnTabAndWindow.bind(this, tabId, windowId), 125);
}

export async function focusOnTabAndWindow(tabId : number, windowId : number) {
	await browser.windows.update(windowId, {focused: true});
	await browser.tabs.update(tabId, {active: true});
	await tabActiveChanged({tabId: tabId, windowId: windowId});
}

export async function updateTabCount() {
	try {
		let run = true;

	const badge = await getLocalStorage("badge", true);
	if (!badge) run = false;

	if (run) {
		let result = await browser.tabs.query({});
		let count = 0;
		if (!!result && !!result.length) {
			count = result.length;
		}
		await browser.action.setBadgeText({text: count + ""});
		await browser.action.setBadgeBackgroundColor({color: "purple"});
		const _to_remove : number[] = [];

		if (!!globalTabsActive) {
			for (let i = 0; i < globalTabsActive.length; i++) {
				const t = globalTabsActive[i];
				let found = false;
				if (!!result && !!result.length) {
					for (let j = 0; j < result.length; j++) {
						if (result[j].id === t.tabId) found = true;
					}
				}
				if (!found) _to_remove.push(i);
			}
		}

		while (_to_remove.length > 0) {
			let index = _to_remove.pop();
			if (!!globalTabsActive && globalTabsActive.length > 0) {
				if (!!globalTabsActive[index]) globalTabsActive.splice(index, 1);
			}
		}

	} else {
		await browser.action.setBadgeText({text: ""});
	}
	} catch (e) {
		console.error("updateTabCount failed (non-fatal):", e);
	}
}

function tabCountChanged() {
	updateTabCountDebounce();
}

export const updateTabCountDebounce = debounce(updateTabCount, 250);

async function tabAdded(tab) {
	const tabLimit = await getLocalStorage("tabLimit", 0);
	if (tabLimit > 0) {
		if (tab.id !== browser.tabs.TAB_ID_NONE) {
			const tabCount = await browser.tabs.query({currentWindow: true});
			if (tabCount.length > tabLimit) {
				await createWindowWithTabs([tab], tab.incognito);
			}
		}
	}
	updateTabCountDebounce();
	autoSaveDebounce();
}

function tabActiveChanged(tab : browser.Tabs.OnActivatedActiveInfoType) {
	trackLastTab(tab);
	updateTabCountDebounce();
}

async function checkTabCreate(tab) {
	await checkWindow(tab.windowId);
}

async function checkTabUpdate(tabid, changeinfo, tab) {
	await checkWindow(tab.windowId);
	if (tab.url || tab.title || tab.favIconUrl) {
		await cacheTabMetadata(tab.id, tab.url || "", tab.title || "", tab.favIconUrl || "", tab.pendingUrl);
	}
	autoSaveDebounce();
}

async function checkTabRemove(tabid, removeinfo) {
	if (removeinfo.isWindowClosing) return;
	await checkWindow(removeinfo.windowId);
	await clearCachedTabMetadata(tabid);
	autoSaveDebounce();
	browser.runtime.sendMessage<ICommand>({ command: S.refresh_windows, window_ids: [removeinfo.windowId] }).catch(() => {});
}

async function checkTabDetached(tabid, detachinfo) {
	await checkWindow(detachinfo.oldWindowId);
}

async function checkTabAttached(tabid, attachinfo) {
	await checkWindow(attachinfo.newWindowId);
}

export async function autoSaveSession() {
	try {
		const windows = await browser.windows.getAll({populate: true});
		const sessions: any[] = [];
		for (const win of windows) {
			const tabs = win.tabs || [];
			const sessionTabs = tabs.map(tab => ({
				id: tab.id,
				url: tab.url || "",
				title: tab.title || "",
				favIconUrl: tab.favIconUrl || "",
				pinned: tab.pinned || false,
				index: tab.index || 0,
				active: tab.active || false,
				discarded: tab.discarded || false,
			}));
			sessions.push({
				windowId: win.id,
				name: win.title || "",
				incognito: win.incognito || false,
				tabs: sessionTabs,
			});
		}
		await setLocalStorage("autoSave", sessions);
	} catch (e) {
		debugError("autoSaveSession failed", e);
	}
}

export const autoSaveDebounce = debounce(autoSaveSession, 5000);

async function checkTabMoved(tabid, moveinfo) {
	await checkWindow(moveinfo.windowId);
}