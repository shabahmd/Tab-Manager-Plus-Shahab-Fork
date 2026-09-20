import * as browser from "webextension-polyfill";
import {useTabManagerUI} from "@store/useTabManagerUI";
import * as S from "@strings";
import {getLocalStorage} from "@helpers/storage";
import {debugError} from "@helpers/debug";
import {ICommand} from "@types";

export function dirtyWindowFromStore(windowId: number): void {
	// Uses message to trigger re-render since Window components manage own state
	browser.runtime.sendMessage<ICommand>({command: S.refresh_windows, window_ids: [windowId]}).catch(() => {});
}

export async function updateFromStore(): Promise<void> {
	const store = useTabManagerUI.getState();
	const windows = await browser.windows.getAll({populate: true});
	const sort_windows = await getLocalStorage("windowAge", []);

	windows.sort(function(a, b) {
		const aSort = sort_windows.indexOf(a.id);
		const bSort = sort_windows.indexOf(b.id);
		if (a.state === "minimized" && b.state !== "minimized") return 1;
		if (b.state === "minimized" && a.state !== "minimized") return -1;
		if (aSort < bSort) return -1;
		if (aSort > bSort) return 1;
		return 0;
	});

	const tabsbyid = new Map<number, browser.Tabs.Tab>();
	const windowsbyid = new Map<number, browser.Windows.Window>();
	let tabCount = 0;

	for (const window of windows) {
		windowsbyid.set(window.id, window);
		for (const tab of window.tabs) {
			tabsbyid.set(tab.id, tab);
			tabCount++;
		}
	}

	// Clean stale selection
	for (const id of store.selection.keys()) {
		if (!tabsbyid.has(id)) {
			store.toggleSelection(id);
		}
	}

	useTabManagerUI.setState({
		lastOpenWindow: windows[0]?.id || 0,
		windows,
		tabsbyid,
		windowsbyid,
		tabCount,
	});
}

export async function onTabCreatedFromStore(tab: browser.Tabs.Tab): Promise<void> {
	dirtyWindowFromStore(tab.windowId);
	const store = useTabManagerUI.getState();
	if (!store.hiddenTabs.has(tab.id)) {
		const tabsbyid = new Map(store.tabsbyid);
		tabsbyid.set(tab.id, tab);
		useTabManagerUI.setState({tabsbyid, tabCount: store.tabCount + 1});
	}
}

export async function onTabRemovedFromStore(tabId: number, removeInfo: browser.Tabs.OnRemovedRemoveInfoType): Promise<void> {
	dirtyWindowFromStore(removeInfo.windowId);
	const store = useTabManagerUI.getState();
	const tabsbyid = new Map(store.tabsbyid);
	tabsbyid.delete(tabId);
	const hiddenTabs = new Set(store.hiddenTabs);
	hiddenTabs.delete(tabId);
	const selection = new Set(store.selection);
	selection.delete(tabId);
	useTabManagerUI.setState({
		tabsbyid,
		hiddenTabs,
		selection,
		tabCount: Math.max(0, store.tabCount - 1),
	});
}

export async function onTabDetachedFromStore(tabId: number, detachInfo: browser.Tabs.OnDetachedDetachInfoType): Promise<void> {
	dirtyWindowFromStore(detachInfo.oldWindowId);
}

export async function onTabAttachedFromStore(tabId: number, attachInfo: browser.Tabs.OnAttachedAttachInfoType): Promise<void> {
	dirtyWindowFromStore(attachInfo.newWindowId);
}

export async function onTabUpdatedFromStore(tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType, tab: browser.Tabs.Tab): Promise<void> {
	const store = useTabManagerUI.getState();
	const tabsbyid = new Map(store.tabsbyid);
	const existing = tabsbyid.get(tabId);
	if (existing) {
		tabsbyid.set(tabId, {...existing, ...tab});
		useTabManagerUI.setState({tabsbyid});
	}
}

export async function sessionSyncFromStore(): Promise<void> {
	const store = useTabManagerUI.getState();
	const sessions = store.sessions || [];
	await browser.storage.local.set({sessions: JSON.stringify(sessions)});
}
