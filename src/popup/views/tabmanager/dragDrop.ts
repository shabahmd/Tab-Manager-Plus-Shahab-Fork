"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import * as S from "@strings";
import {ICommand, ITabManagerState} from "@types";
import {persistSelection} from "./selection";

export interface DragDropHost {
	state: ITabManagerState;
	setState(state: any): void;
	forceUpdate(): void;
	update(): void | Promise<void>;
}

export function beginTabDrag(host: DragDropHost, e : React.DragEvent<HTMLDivElement>, id : number): void {
	if (!host.state.selection.has(id)) {
		host.state.selection.add(id);
		host.setState({
			lastSelect: id
		});
	}
	host.forceUpdate();
}

export async function dropTabsOnTab(host: DragDropHost, id : number, before : boolean): Promise<void> {
	const hostState = host.state;
	var tab : browser.Tabs.Tab = hostState.tabsbyid.get(id);
	var tabs : browser.Tabs.Tab[] = [...hostState.selection.keys()].map(function(tabId) {
		return hostState.tabsbyid.get(tabId);
	});
	var index = tab.index + (before ? 0 : 1);

	if (navigator.userAgent.search("Firefox") > -1) {
		browser.runtime.sendMessage<ICommand>({command: S.move_tabs_within_window, tab_ids: tabs.map(t => t.id), target_window: tab.windowId, target_index: index});
	} else {
		for (let i = 0; i < tabs.length; i++) {
			const t : browser.Tabs.Tab = tabs[i];
			try {
				await browser.tabs.move(t.id, { windowId: tab.windowId, index: index });
				await browser.tabs.update(t.id, { pinned: t.pinned });
			} catch (e) {
				console.error("Drop failed:", e);
			}
		}
	}
	hostState.selection.clear();
	persistSelection(hostState.selection);
	await host.update();
}

export function dropTabsOnWindow(host: DragDropHost, windowId : number): void {
	const hostState = host.state;
	var tabs : browser.Tabs.Tab[] = [...hostState.selection.keys()].map(function(id) {
		return hostState.tabsbyid.get(id);
	});

	browser.runtime.sendMessage<ICommand>({command: S.move_tabs_to_window, window_id: windowId, tabs: tabs});

	hostState.selection.clear();
	persistSelection(hostState.selection);
}
