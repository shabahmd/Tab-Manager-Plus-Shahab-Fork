"use strict";

import * as browser from 'webextension-polyfill';
import * as S from "@strings";
import {ICommand, ITabManagerState} from "@types";
import {findDuplicateTabIds} from "./duplicates";

export interface TabActionHost {
	state: ITabManagerState;
	refs: any;
	setState(state: any): void;
	forceUpdate(): void;
	clearSelection(): void;
	saveSelection(): void;
}

export async function closeSelectedTabs(host: TabActionHost): Promise<void> {
	const hostState = host.state;
	const tabs: browser.Tabs.Tab[] = [...hostState.selection.keys()].map(function(id) {
		return hostState.tabsbyid.get(id);
	});
	if (tabs.length) {
		browser.runtime.sendMessage<ICommand>({command: S.close_tabs, tabs: tabs});
	} else {
		const t = await browser.tabs.query({ currentWindow: true, active: true });
		if (t && t.length > 0) {
			await browser.tabs.remove(t[0].id);
		}
	}
	host.forceUpdate();
}

export function closeTabById(host: TabActionHost, tabId : number): void {
	browser.tabs.remove(tabId);
}

export async function discardSelectedTabs(host: TabActionHost): Promise<void> {
	const hostState = host.state;
	const tabs : browser.Tabs.Tab[] = [...hostState.selection.keys()].map(function(id) {
		return hostState.tabsbyid.get(id);
	});
	if (tabs.length) {
		browser.runtime.sendMessage<ICommand>({command: S.discard_tabs, tabs: tabs});
	}
	host.clearSelection();
}

export function discardTabById(host: TabActionHost, tabId : number): void {
	browser.tabs.discard(tabId);
}

export async function focusFirstSelectedTab(host: TabActionHost): Promise<void> {
	for (const window of host.state.windows) {
		for (const tab of window.tabs || []) {
			if (host.state.selection.has(tab.id)) {
				if (navigator.userAgent.search("Firefox") > -1) {
					await browser.runtime.sendMessage<ICommand>({command: S.focus_on_tab_and_window_delayed, saved_tab: {tabId: tab.id, windowId: window.id}});
				} else {
					await browser.runtime.sendMessage<ICommand>({command: S.focus_on_tab_and_window, saved_tab: {tabId: tab.id, windowId: window.id}});
				}
				if ((window as any).inPopup) (window as any).close();
				return;
			}
		}
	}
}

export async function moveSelectionToNewWindow(host: TabActionHost): Promise<void> {
	const hostState = host.state;
	const count = hostState.selection.size;
	const tabs : browser.Tabs.Tab[] = [...hostState.selection.keys()].map(function(id) {
		return hostState.tabsbyid.get(id);
	});

	const incognito_tabs = tabs.filter(function(tab) {
		return tab.incognito;
	});

	const normal_tabs = tabs.filter(function(tab) {
		return !tab.incognito;
	});

	if (count === 0) {
		await browser.windows.create({});
	} else if (count === 1) {
		if (navigator.userAgent.search("Firefox") > -1) {
			await browser.runtime.sendMessage<ICommand>({command: S.focus_on_tab_and_window_delayed, tab: tabs[0]});
		}else{
			await browser.runtime.sendMessage<ICommand>({command: S.focus_on_tab_and_window, tab: tabs[0]});
		}
	} else {
		if (normal_tabs.length > 0) {
			await browser.runtime.sendMessage<ICommand>({command: S.create_window_with_tabs, tabs: normal_tabs, incognito: false});
		}
		if (incognito_tabs.length > 0) {
			await browser.runtime.sendMessage<ICommand>({command: S.create_window_with_tabs, tabs: incognito_tabs, incognito: true});
		}
	}
	if ((window as any).inPopup) (window as any).close();
}

export async function togglePinForSelection(host: TabActionHost): Promise<void> {
	const hostState = host.state;
	const tabs : browser.Tabs.Tab[] = [...hostState.selection.keys()]
		.map(function(id) {
			return hostState.tabsbyid.get(id);
		})
		.sort(function(a, b) {
			return a.index - b.index;
		});
	if (tabs.length) {
		if (tabs[0].pinned) tabs.reverse();
		for (let i = 0; i < tabs.length; i++) {
			await browser.tabs.update(tabs[i].id, { pinned: !tabs[0].pinned });
		}
	} else {
		const t = await browser.tabs.query({ currentWindow: true, active: true });
		if (t && t.length > 0) {
			await browser.tabs.update(t[0].id, { pinned: !t[0].pinned });
		}
	}
}

export function highlightDuplicateTabs(host: TabActionHost): void {
	host.state.selection.clear();
	host.state.hiddenTabs.clear();

	let searchLen = 0;
	const dupTabs = !host.state.dupTabs;

	(host.refs.searchbox as HTMLInputElement).value = "";

	if (!dupTabs) {
		host.setState({
			hiddenCount: 0,
			dupTabs: dupTabs,
			searchLen: searchLen
		});
		host.forceUpdate();
		return;
	}
	let hiddenCount = host.state.hiddenCount || 0;
	const idList : number[] = [...host.state.tabsbyid.keys()];
	const dup = findDuplicateTabIds(host.state.tabsbyid);
	for (const dupItem of dup) {
		searchLen++;
		hiddenCount -= host.state.hiddenTabs.has(dupItem) ? 1 : 0;
		host.state.selection.add(dupItem);
		host.state.hiddenTabs.delete(dupItem);
		host.setState({
			lastSelect: dupItem
		});
	}
	for (const tab_id of idList) {
		// var tab = host.state.tabsbyid.get(tab_id);
		if (dup.indexOf(tab_id) === -1) {
			hiddenCount += 1 - (host.state.hiddenTabs.has(tab_id) ? 1 : 0);
			host.state.hiddenTabs.add(tab_id);
			host.state.selection.delete(tab_id);
			host.setState({
				lastSelect: tab_id
			});
		}
	}
	if (dup.length === 0) {
		host.setState({
			topText: "No duplicates found",
			bottomText: " "
		});
	} else {
		host.setState({
			topText: "Highlighted " + dup.length + " duplicate tabs",
			bottomText: "Press enter to move them to a new window"
		});
	}
	host.setState({
		hiddenCount: hiddenCount
	});
	host.setState({
		searchLen: searchLen,
		dupTabs: dupTabs
	});

	host.saveSelection();
	host.forceUpdate();
}

// One-click duplicate cleanup (#260): the background keeps one tab per
// URL and closes the rest.
export function closeDuplicateTabsAction(host: TabActionHost): void {
	browser.runtime.sendMessage<ICommand>({command: S.close_duplicate_tabs});
	host.forceUpdate();
}

// Merge all windows into the most recently active one (#262).
export function mergeAllWindows(host: TabActionHost): void {
	browser.runtime.sendMessage<ICommand>({command: S.merge_windows, target_window: host.state.lastOpenWindow});
	host.forceUpdate();
}

// Auto-close timer for the current selection (#256). 0 clears timers.
export function setCloseTimerForSelection(host: TabActionHost): void {
	const ids = [...host.state.selection.keys()];
	if (ids.length === 0) {
		host.setState({
			topText: "Select tabs first",
			bottomText: "Select one or more tabs to set an auto-close timer"
		});
		return;
	}
	const answer = window.prompt("Close the selected tabs after how many minutes?\nEnter 0 to cancel their timers.", "30");
	if (answer === null) return;
	const minutes = parseFloat(answer);
	if (isNaN(minutes) || minutes < 0) {
		host.setState({
			topText: "Invalid timer value",
			bottomText: "Enter the minutes as a number, e.g. 30"
		});
		return;
	}
	if (minutes === 0) {
		browser.runtime.sendMessage<ICommand>({command: S.clear_tab_close_timer, tab_ids: ids});
		host.setState({
			topText: "Auto-close timers cleared",
			bottomText: " "
		});
	} else {
		browser.runtime.sendMessage<ICommand>({command: S.set_tab_close_timer, tab_ids: ids, minutes: minutes});
		host.setState({
			topText: "Timer set",
			bottomText: "Will close " + ids.length + (ids.length === 1 ? " tab" : " tabs") + " in " + minutes + (minutes === 1 ? " minute" : " minutes")
		});
	}
	host.forceUpdate();
}
