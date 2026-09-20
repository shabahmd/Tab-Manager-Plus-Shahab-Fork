import * as browser from "webextension-polyfill";
import * as S from "@strings";
import {useTabManagerUI} from "@store/useTabManagerUI";
import {getLocalStorage} from "@helpers/storage";

export async function deleteTabsFromStore(): Promise<void> {
	const store = useTabManagerUI.getState();
	const tabs: browser.Tabs.Tab[] = [...store.selection.keys()].map((id) => store.tabsbyid.get(id)).filter(Boolean);
	if (tabs.length) {
		browser.runtime.sendMessage<ICommand>({command: S.close_tabs, tabs});
	} else {
		const t = await browser.tabs.query({currentWindow: true, active: true});
		if (t && t.length > 0) {
			await browser.tabs.remove(t[0].id);
		}
	}
	store.setLastSelect(0);
	store.clearSelection();
}

export async function deleteTabFromStore(tabId: number): Promise<void> {
	browser.tabs.remove(tabId);
}

export async function discardTabsFromStore(): Promise<void> {
	const store = useTabManagerUI.getState();
	const tabs: browser.Tabs.Tab[] = [...store.selection.keys()].map((id) => store.tabsbyid.get(id)).filter(Boolean);
	if (tabs.length) {
		browser.runtime.sendMessage<ICommand>({command: S.discard_tabs, tabs});
	}
	store.clearSelection();
}

export async function discardTabFromStore(tabId: number): Promise<void> {
	browser.tabs.discard(tabId);
}

export async function addWindowFromStore(): Promise<void> {
	const store = useTabManagerUI.getState();
	const count = store.selection.size;
	const tabs: browser.Tabs.Tab[] = [...store.selection.keys()].map((id) => store.tabsbyid.get(id)).filter(Boolean);

	if (count === 0) {
		await browser.windows.create({});
	} else if (count === 1) {
		if (navigator.userAgent.search("Firefox") > -1) {
			await browser.runtime.sendMessage<ICommand>({command: S.focus_on_tab_and_window_delayed, tab: tabs[0]});
		} else {
			await browser.runtime.sendMessage<ICommand>({command: S.focus_on_tab_and_window, tab: tabs[0]});
		}
	} else {
		const normal_tabs = tabs.filter((t) => !t.incognito);
		const incognito_tabs = tabs.filter((t) => t.incognito);
		if (normal_tabs.length > 0) {
			await browser.runtime.sendMessage<ICommand>({command: S.create_window_with_tabs, tabs: normal_tabs, incognito: false});
		}
		if (incognito_tabs.length > 0) {
			await browser.runtime.sendMessage<ICommand>({command: S.create_window_with_tabs, tabs: incognito_tabs, incognito: true});
		}
	}
	if (!!window.inPopup) window.close();
}

export async function pinTabsFromStore(): Promise<void> {
	const store = useTabManagerUI.getState();
	const tabs: browser.Tabs.Tab[] = [...store.selection.keys()]
		.map((id) => store.tabsbyid.get(id))
		.filter(Boolean)
		.sort((a, b) => a.index - b.index);
	if (tabs.length) {
		if (tabs[0].pinned) tabs.reverse();
		for (let i = 0; i < tabs.length; i++) {
			await browser.tabs.update(tabs[i].id, {pinned: !tabs[0].pinned});
		}
	} else {
		const t = await browser.tabs.query({currentWindow: true, active: true});
		if (t && t.length > 0) {
			await browser.tabs.update(t[0].id, {pinned: !t[0].pinned});
		}
	}
}

export async function hibernateTabsFromStore(): Promise<void> {
	const store = useTabManagerUI.getState();
	const tabs: browser.Tabs.Tab[] = [...store.selection.keys()].map((id) => store.tabsbyid.get(id)).filter(Boolean);
	if (tabs.length) {
		for (const tab of tabs) {
			if (!tab.active && !tab.discarded) {
				await browser.tabs.discard(tab.id).catch(() => {});
			}
		}
		store.clearSelection();
	}
}

export async function muteTabsFromStore(): Promise<void> {
	const store = useTabManagerUI.getState();
	const tabs: browser.Tabs.Tab[] = [...store.selection.keys()].map((id) => store.tabsbyid.get(id)).filter(Boolean);
	for (const tab of tabs) {
		await browser.tabs.update(tab.id, {muted: !tab.mutedInfo?.muted}).catch(() => {});
	}
}
