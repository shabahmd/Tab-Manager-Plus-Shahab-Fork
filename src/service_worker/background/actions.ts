"use strict";

import {globalTabsActive} from '@context'
import * as S from "@strings";
import {focusOnWindow, focusOnWindowDelayed, createWindowWithTabs, createWindowWithSessionTabs, hashcode, mergeWindows} from '@background/windows';
import {getLocalStorageMap, setLocalStorageMap} from "@helpers/storage";
import {setupPopup} from "@ui/open";
import {updateTabCount, discardTabs, moveTabsToWindow, moveTabsWithinWindow, createTabInWindow, closeTabs, focusOnTabAndWindow, focusOnTabAndWindowDelayed} from "@background/tabs";
import {findDuplicates, closeDuplicateTabs} from "@background/duplicates";
import {setTabCloseTimers, clearTabCloseTimers, checkTabCloseTimers, TAB_CLOSE_TIMER_ALARM} from "@background/timers";
import {hibernateWindow} from "@background/hibernate";
import {onAlarmBackup} from "@background/backup";
import {undoClose} from "@background/undo";
import * as browser from 'webextension-polyfill';
import {ICommand} from '@types';

export async function handleMessages(message, sender, sendResponse) {
	const request = message as ICommand;

	switch (request.command) {
		case S.reload_popup_controls:
			setupPopup();
			break;
		case S.update_tab_count:
			updateTabCount();
			break;
		case S.discard_tabs:
			discardTabs(request.tabs);
			break;
		case S.move_tabs_to_window:
			moveTabsToWindow(request.window_id, request.tabs);
			break;
		case S.move_tabs_within_window:
			moveTabsWithinWindow(request.tab_ids, request.target_window, request.target_index);
			break;
		case S.create_tab:
			createTabInWindow(request.window_id);
			break;
		case S.focus_on_tab_and_window:
			if (!!request.tab) {
				focusOnTabAndWindow(request.tab.id, request.tab.windowId);
			} else {
				focusOnTabAndWindow(request.saved_tab.tabId, request.saved_tab.windowId);
			}
			break;
		case S.focus_on_tab_and_window_delayed:
			if (!!request.tab) {
				focusOnTabAndWindowDelayed(request.tab.id, request.tab.windowId);
			} else {
				focusOnTabAndWindowDelayed(request.saved_tab.tabId, request.saved_tab.windowId);
			}
			break;
		case S.focus_on_window:
			focusOnWindow(request.window_id);
			break;
		case S.focus_on_window_delayed:
			focusOnWindowDelayed(request.window_id);
			break;
		case S.set_window_color:
			setWindowColor(request.window_id, request.color);
			break;
		case S.set_window_name:
			setWindowName(request.window_id, request.name);
			break;
		case S.create_window_with_tabs:
			createWindowWithTabs(request.tabs, request.incognito);
			break;
		case S.create_window_with_session_tabs:
			createWindowWithSessionTabs(request.session, request.tab_id);
			break;
		case S.close_tabs:
			closeTabs(request.tabs);
			break;
		case S.find_duplicates:
			findDuplicates(request.window_id);
			break;
		case S.close_duplicate_tabs:
			closeDuplicateTabs();
			break;
		case S.merge_windows:
			mergeWindows(request.target_window);
			break;
		case S.set_tab_close_timer:
			setTabCloseTimers(request.tab_ids || [], request.minutes || 0);
			break;
		case S.clear_tab_close_timer:
			clearTabCloseTimers(request.tab_ids);
			break;
		case S.mute_tab:
			if (!!request.tabId) {
				browser.tabs.get(request.tabId).then((tab) => {
					if (tab) {
						browser.tabs.update(request.tabId, {muted: !tab.mutedInfo?.muted}).catch(() => {});
					}
				}).catch(() => {});
			}
			break;
		case S.hibernate_window:
			hibernateWindow(request.window_id);
			break;
		case S.undo_close:
			undoClose();
			break;
	}
}

export function onAlarm(alarm: browser.Alarms.Alarm) {
	if (alarm.name === "sessionAutoBackup") {
		onAlarmBackup(alarm);
	} else if (alarm.name === TAB_CLOSE_TIMER_ALARM) {
		checkTabCloseTimers();
	}
}

export function handleCommands(command : string) {
	if (command === S.switch_to_previous_active_tab) {
		if (!!globalTabsActive && globalTabsActive.length > 1) {
			var _tab = globalTabsActive[globalTabsActive.length - 2];
			focusOnTabAndWindow(_tab.tabId, _tab.windowId);
		}
	}
}

export function trackLastTab(tab : browser.Tabs.OnActivatedActiveInfoType) {
	if (!!tab && !!tab.tabId) {
		if (!!globalTabsActive && globalTabsActive.length > 0) {
			var lastActive = globalTabsActive[globalTabsActive.length - 1];
			if (!!lastActive && lastActive.tabId === tab.tabId && lastActive.windowId === tab.windowId) {
				return;
			}
		}
		while (globalTabsActive.length > 20) {
			globalTabsActive.shift();
		}
		for (let i = globalTabsActive.length - 1; i >= 0; i--) {
			if (globalTabsActive[i].tabId === tab.tabId) {
				globalTabsActive.splice(i, 1);
			}
		}
		globalTabsActive.push(tab);
	}
}

export async function setWindowColor(windowId : number, color : string) {
	var colors : Map<number, string> = await getLocalStorageMap<number, string>(S.windowColors);
	if (!!color) {
		colors.set(windowId, color);
	} else {
		colors.delete(windowId);
	}
	await setLocalStorageMap(S.windowColors, colors);
	await updateWindowHash(windowId);
	browser.runtime.sendMessage<ICommand>({
		command: S.refresh_windows,
		window_ids: [windowId]
	});
}

export async function setWindowName(windowId: number, name : string) {
	var names : Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);
	if (!!name) {
		names.set(windowId, name);
	} else {
		names.delete(windowId);
	}
	await setLocalStorageMap(S.windowNames, names);
	await updateWindowHash(windowId);
	browser.runtime.sendMessage<ICommand>({
		command: S.refresh_windows,
		window_ids: [windowId]
	});
}

async function updateWindowHash(windowId : number) {
	const window = await browser.windows.get(windowId, {populate: true});
	const hash = hashcode(window);
	const hashes : Map<number, number> = await getLocalStorageMap<number, number>(S.windowHashes);
	hashes.set(windowId, hash);
	await setLocalStorageMap(S.windowHashes, hashes);
}