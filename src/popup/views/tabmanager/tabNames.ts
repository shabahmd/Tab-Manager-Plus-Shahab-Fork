"use strict";

import * as browser from 'webextension-polyfill';
import {ITabManagerState} from "@types";
import {setLocalStorage} from "@helpers/storage";

export interface TabNamesHost {
	state: ITabManagerState;
	setState(state: any): void;
	forceUpdate(): void;
}

export function readStoredTabNames(storage: any): Record<string, string> {
	const stored = storage["tabNames"];
	if (!!stored && typeof stored === "object") return stored as Record<string, string>;
	return {};
}

// Custom display title for a tab (rename feature, #257). Keyed by URL so
// names survive reloads; tab ids are unstable across sessions.
export function displayTabTitle(tab : browser.Tabs.Tab, tabNames? : Record<string, string>) : string {
	if (!!tab && !!tab.url && !!tabNames && !!tabNames[tab.url]) {
		return tabNames[tab.url];
	}
	return (tab && tab.title) || "";
}

export async function renameSelectedTab(host: TabNamesHost): Promise<void> {
	const ids = [...host.state.selection.keys()];
	if (ids.length !== 1) {
		host.setState({
			topText: "Select exactly one tab to rename it",
			bottomText: " "
		});
		return;
	}
	const tab = host.state.tabsbyid.get(ids[0]);
	if (!tab || !tab.url) return;
	const current = displayTabTitle(tab, host.state.tabNames);
	const name = window.prompt("Rename tab (empty clears the name)", current);
	if (name === null) return;
	const tabNames = {...(host.state.tabNames || {})};
	if (name.trim() === "") {
		delete tabNames[tab.url];
	} else {
		tabNames[tab.url] = name.trim().slice(0, 200);
	}
	host.setState({tabNames: tabNames});
	await setLocalStorage("tabNames", tabNames);
	host.forceUpdate();
}
