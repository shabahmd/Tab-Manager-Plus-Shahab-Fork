"use strict";

import {cleanupDebounce} from "@background/tracking";
import {getLocalStorage, getLocalStorageMap, setLocalStorage, setLocalStorageMap} from "@helpers/storage";
import {is_in_bounds, stringHashcode} from "@helpers/utils";
import {setWindowColor, setWindowName} from "@background/actions";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ISavedSession} from "@types";
import {debugError} from "@helpers/debug";

export async function setupWindowListeners() {
	browser.windows.onFocusChanged.removeListener(windowFocus);
	browser.windows.onCreated.removeListener(windowCreated);
	browser.windows.onRemoved.removeListener(windowRemoved);

	browser.windows.onFocusChanged.addListener(windowFocus);
	browser.windows.onCreated.addListener(windowCreated);
	browser.windows.onRemoved.addListener(windowRemoved);
}

export async function createWindowWithTabs(tabs : browser.Tabs.Tab[], isIncognito : boolean = false) {
	let pinnedIndex = 0;
	const firstTab = tabs.shift();
	const t = [];
	for (const _tab of tabs) {
		t.push(_tab.id);
	}

	const firstPinned = firstTab.pinned;
	const w = await browser.windows.create({tabId: firstTab.id, incognito: !!isIncognito});
	if (firstPinned) {
		await browser.tabs.update(w.tabs[0].id, {pinned: firstPinned});
		pinnedIndex++;
	}

	if (t.length > 0) {
		let i = 0;
		for (const oldTabId of t) {
			i++;
			const oldTab = await browser.tabs.get(oldTabId);
			const tabPinned = oldTab.pinned;
			let movedTabs : browser.Tabs.Tab | browser.Tabs.Tab[] = [];
			if (!tabPinned) {
				movedTabs = await browser.tabs.move(oldTabId, {windowId: w.id, index: -1});
			} else {
				movedTabs = await browser.tabs.move(oldTabId, {windowId: w.id, index: pinnedIndex++});
			}

			let firstTab : browser.Tabs.Tab;
			if (Array.isArray(movedTabs)) {
				firstTab = movedTabs[0];
			} else {
				firstTab = movedTabs;
			}

			if (firstTab) {
				if (tabPinned) {
					await browser.tabs.update(firstTab.id, {pinned: tabPinned});
				}
			}
		}
	}
	await browser.windows.update(w.id, {focused: true});
}

export async function createWindowWithSessionTabs(session: ISavedSession, tabId: number) {

	let customName : string;
	if (session && session.name && session.customName) {
		customName = session.name;
	}
	let color = "default";
	if (session && session.color) {
		color = session.color;
	}

	let whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];

	if (navigator.userAgent.search("Firefox") > -1) {
		whitelistWindow = ["left", "top", "width", "height", "incognito", "type"];
	}

	let whitelistTab = ["url", "active", "selected", "pinned", "index"];

	if (navigator.userAgent.search("Firefox") > -1) {
		whitelistTab = ["url", "active", "pinned", "index"];
	}

	const filteredWindow : browser.Windows.CreateCreateDataType = Object.keys(session.windowsInfo)
		.filter(function (key) {
			return whitelistWindow.includes(key);
		})
		.reduce(function (obj, key) {
			obj[key] = session.windowsInfo[key];
			return obj;
		}, {});

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

	if (navigator.userAgent.search("Firefox") === -1) {
		try {
			const systemApi = (chrome as any)["system"];
			const displayApi = systemApi ? systemApi["display"] : undefined;
			if (displayApi && typeof displayApi.getInfo === "function") {
				const displays = await displayApi.getInfo();
				const onScreen = displays.some((display: any) => {
					return filteredWindow.left >= display.bounds.left &&
						filteredWindow.top >= display.bounds.top &&
						filteredWindow.left < display.bounds.left + display.bounds.width &&
						filteredWindow.top < display.bounds.top + display.bounds.height;
				});
				if (!onScreen) {
					filteredWindow.left = 0;
					filteredWindow.top = 0;
				}
			}
		} catch (e) {
			// system.display not available, use simple clamp
		}
	}

	filteredWindow.type = "normal";

	// console.log("filtered window", filteredWindow);

	const newWindow = await browser.windows.create(filteredWindow).catch(function (error) {
		debugError(error);
	});

	if (!newWindow) return;

	const emptyTab = newWindow.tabs[0].id;

	for (let i = 0; i < session.tabs.length; i++) {
		const newTab = Object.keys(session.tabs[i])
			.filter(function (key) {
				return whitelistTab.includes(key);
			})
			.reduce(function (obj, key) {
				obj[key] = session.tabs[i][key];
				return obj;
			}, {});

		const fTab : browser.Tabs.Tab = newTab as browser.Tabs.Tab;

		if (tabId != null && tabId !== fTab.index) {
			continue;
		}
		fTab.windowId = newWindow.id;

		if (navigator.userAgent.search("Firefox") > -1) {
			if (!!fTab.url && fTab.url.search("about:") > -1) {
				fTab.url = "";
			}
		}
		try {
			await browser.tabs.create(fTab).catch(function (error) {
				debugError(error);
			});
		} catch (e) {
			debugError("couldn't restore tab", e);
		}
	}

	await browser.tabs.remove(emptyTab).catch(function (error) {
		debugError(error);
	});

	if (customName) {
		await setWindowName(newWindow.id, customName);
	}

	if (color !== "default") {
		await setWindowColor(newWindow.id, color);
	}

	await browser.windows.update(newWindow.id, {focused: true});
}

export function focusOnWindowDelayed(windowId: number) {
	setTimeout(focusOnWindow.bind(this, windowId), 125);
}

export async function focusOnWindow(windowId : number) {
	await browser.windows.update(windowId, {focused: true});
}

async function hideWindows(windowId : number) {
	if (navigator.userAgent.search("Firefox") > -1) return;
	if (!windowId || windowId < 0) return;

	const hide_windows = await getLocalStorage("hideWindows", false);
	if (!hide_windows) return;

	const has_permission = await browser.permissions.contains({permissions: ['system.display']});
	if (!has_permission) return;

	let displaylayouts;
	try {
		const systemApi = (chrome as any)["system"];
		const displayApi = systemApi ? systemApi["display"] : undefined;
		if (!displayApi || typeof displayApi.getInfo !== "function") return;
		displaylayouts = await displayApi.getInfo();
	} catch (e) {
		console.error("system.display.getInfo failed (non-fatal):", e);
		return;
	}
	const monitor_bounds = [];

	try {
		for (const displaylayout of displaylayouts) {
			monitor_bounds.push(displaylayout.bounds);
		}
	} catch (err) {
		console.error(err);
		return;
	}

	const windows = await browser.windows.getAll({populate: true});
	let monitor = null;

	for (const window of windows) {
		if (window.id === windowId) {
			for (const bounds_index in monitor_bounds) {
				const _monitor = monitor_bounds[bounds_index];
				const _is_in_bounds = is_in_bounds(window, _monitor);
				if (_is_in_bounds) {
					monitor = _monitor;
					break;
				}
			}
		}
	}

	if (monitor == null) return;

	for (const window of windows) {
		if (window.id !== windowId) {
			if (is_in_bounds(window, monitor)) {
				await browser.windows.update(window.id, {"state": "minimized"});
			}
		}
	}
}

export async function windowActive(windowId : number) {
	if (windowId < 0) return;

	let windows = [];
	const windowAge = await getLocalStorage("windowAge", []);
	if (windowAge instanceof Array) windows = windowAge;

	if (windows.indexOf(windowId) > -1) windows.splice(windows.indexOf(windowId), 1);
	windows.unshift(windowId);
	await setLocalStorage("windowAge", windows);

	// browser.windows.getLastFocused({ populate: true }, function (w) {
	// 	for (let i = 0; i < w.tabs.length; i++) {
	// 		var tab = w.tabs[i];
	// 		if (tab.active === true) {
	// 			// console.log("get last focused", tab.id);
	// 			// tabActiveChanged({
	// 			// 	tabId: tab.id,
	// 			// 	windowId: tab.windowId
	// 			// });
	// 		}
	// 	};
	// });
	// console.log(windows);
}

async function windowFocus(windowId : number) {
	try {
		if (windowId) {
			await windowActive(windowId);
			// console.log("onFocused", windowId);
			await hideWindows(windowId);
		}
	} catch (e) {
		// Window is gone or state unchanged; nothing to do.
	}
}

async function windowCreated(window : browser.Windows.Window) {
	try {
		if (!!window && !!window.id) {
			await windowActive(window.id);
		}
	} catch (e) {
		// Window is gone or state unchanged; nothing to do.
	}
	// console.log("onCreated " + window.id, window);
	setTimeout(cleanupDebounce, 250);
}

async function windowRemoved(windowId : number) {
	try {
		if (windowId) {
			await windowActive(windowId);
		}
	} catch (e) {
		// Window is gone or state unchanged; nothing to do.
	}
	// console.log("onRemoved", windowId);
}

export async function checkWindow(windowId : number) {
	if (!windowId) return;

	const colors: Map<number, string> = await getLocalStorageMap<number, string>(S.windowColors);
	const names: Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);

	if (!names[windowId] && !colors[windowId]) return;

	const hashes: Map<number, number> = await getLocalStorageMap<number, number>(S.windowHashes);

	try {
		const window = await browser.windows.get(windowId, {populate: true});

		const newHash = hashcode(window);
		hashes.set(windowId, newHash);
		await setLocalStorageMap(S.windowHashes, hashes);
	} catch (e) {
		console.log(e);
	}
}

export function hashcode(window : browser.Windows.Window) : number {
	const urls = [];
	for (let i = 0; i < window.tabs.length; i++) {
		if (!window.tabs[i].url) continue;
		urls.push(window.tabs[i].url);
	}
	urls.sort();

	let hash = 0;
	for (let i = 0; i < urls.length; i++) {
		const code = stringHashcode(urls[i]);
		hash = ((hash << 5) - hash) + code;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

// Merge windows (#262): move every tab into one window per incognito group
// (normal + incognito can never mix), then remove the emptied windows.
// The requested target wins its group; otherwise the window with the most
// tabs does. Unmovable tabs stay put and their window is kept.
export async function mergeWindows(targetWindowId?: number): Promise<void> {
	const windows = await browser.windows.getAll({populate: true});
	if (!windows || windows.length < 2) return;

	const groups = new Map<boolean, browser.Windows.Window[]>();
	for (const window of windows) {
		if (window.type !== "normal" && (window.tabs || []).length === 0) continue;
		const key = !!window.incognito;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(window);
	}

	for (const group of groups.values()) {
		if (group.length < 2) continue;
		let target = group.find((w) => w.id === targetWindowId);
		if (!target) {
			target = [...group].sort((a, b) => ((b.tabs || []).length - (a.tabs || []).length) || (a.id - b.id))[0];
		}
		for (const source of group) {
			if (source.id === target.id) continue;
			for (const tab of [...(source.tabs || [])]) {
				if (tab.id == null) continue;
				try {
					await browser.tabs.move(tab.id, {windowId: target.id, index: -1});
					if (tab.pinned) {
						await browser.tabs.update(tab.id, {pinned: true}).catch(() => {});
					}
				} catch (e) {
					console.error("mergeWindows failed for tab", tab.id, e);
				}
			}
			try {
				const remaining = await browser.tabs.query({windowId: source.id});
				if (remaining.length === 0) {
					await browser.windows.remove(source.id);
				}
			} catch (e) {
				console.error("mergeWindows failed to clean up window", source.id, e);
			}
		}
	}

	try {
		const focusId = (windows.some((w) => w.id === targetWindowId) && targetWindowId) || undefined;
		if (focusId !== undefined) {
			await browser.windows.update(focusId, {focused: true});
		}
	} catch (e) {
		debugError("mergeWindows focus failed", e);
	}
}