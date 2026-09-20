"use strict";

import * as browser from 'webextension-polyfill';
import {ITabManagerState} from "@types";
import {setLocalStorage} from "@helpers/storage";
import {debounce} from "@helpers/utils";
import {debugLog} from "@helpers/debug";

export interface SelectionHost {
	state: ITabManagerState;
	refs: any;
	restoredSelection: number[] | null;
	getWindowRef(windowId: number): any;
	setState(state: any): void;
	forceUpdate(): void;
	scrollTo(what: string, id: number): void;
}

export const persistSelection = debounce((selection: Set<number>) => {
	setLocalStorage("selection", [...selection]).catch((e) => debugLog("saveSelection failed:", e));
}, 500);

export function readStoredSelection(storage: any): number[] | null {
	const storedSelection = storage["selection"];
	if (Array.isArray(storedSelection)) {
		return storedSelection.filter((id) => typeof id === "number");
	}
	return null;
}

export function applyRestoredSelection(host: SelectionHost): void {
	if (!!host.restoredSelection) {
		for (const id of host.restoredSelection) {
			if (host.state.tabsbyid.has(id)) {
				host.state.selection.add(id);
			}
		}
		host.restoredSelection = null;
	}
}

export function pruneSelection(host: SelectionHost): void {
	for (let id of host.state.selection.keys()) {
		if (!host.state.tabsbyid.has(id)) {
			host.state.selection.delete(id);
			host.setState({lastSelect: id});
		}
	}
}

export function selectionStatusText(selected: number): {topText: string, bottomText: string} {
	if (selected === 0) {
		return {
			topText: "No tabs selected",
			bottomText: " "
		};
	}
	if (selected === 1) {
		return {
			topText: "Selected " + selected + " tab",
			bottomText: "Press enter to switch to it"
		};
	}
	return {
		topText: "Selected " + selected + " tabs",
		bottomText: "Press enter to move them to a new window"
	};
}

export function toggleSelect(host: SelectionHost, id: number): void {
	if (host.state.selection.has(id)) {
		host.state.selection.delete(id);
		host.setState({
			lastSelect: id
		});
	} else {
		host.state.selection.add(id);
		host.setState({
			lastSelect: id
		});
	}
	host.scrollTo('tab', id);
	var tab = host.state.tabsbyid.get(id);
	const windowComponent = host.getWindowRef(tab.windowId as number);
	const tabComponent = windowComponent && (windowComponent as any).refs['tab' + id];
	if (!!windowComponent && !!tabComponent && typeof tabComponent.resolveFavIconUrl === 'function') {
		tabComponent.resolveFavIconUrl();
	}

	debugLog(host.state.selection);
	const status = selectionStatusText(host.state.selection.size);
	host.setState(status);
	persistSelection(host.state.selection);
}

export function rangeSelect(host: SelectionHost, id: number, tabs: browser.Tabs.Tab[]): void {
	let activate = false;
	const lastSelect = host.state.lastSelect;
	if (id === lastSelect) {
		toggleSelect(host, id);
		return;
	}
	if (!!lastSelect) {
		if (host.state.selection.has(lastSelect)) {
			activate = true;
		}
	} else {
		if (host.state.selection.has(id)) {
			activate = false;
		} else {
			activate = true;
		}
	}

	let rangeIndex1 : number;
	let rangeIndex2 : number;
	for (let i = 0; i < tabs.length; i++) {
		if (tabs[i].id === id) {
			rangeIndex1 = i;
		}
		if (!!lastSelect && tabs[i].id === lastSelect) {
			rangeIndex2 = i;
		}
	}
	if (!!lastSelect && !rangeIndex2) {
		toggleSelect(host, id);
		return;
	}
	if (!rangeIndex2) {
		const neighbours = [];
		for (let i = 0; i < tabs.length; i++) {
			const tabId = tabs[i].id;
			if (tabId !== id) {
				if (host.state.selection.has(tabId)) {
					neighbours.push(tabId);
				}
			}
		}

		if (activate) {
			// find closest selected item that's not connected
			let leftSibling = 0;
			let rightSibling = tabs.length - 1;
			for (let i = 0; i < rangeIndex1; i++) {
				if (neighbours.indexOf(i) > -1) {
					leftSibling = i;
				}
			}
			for (let i = tabs.length - 1; i > rangeIndex1; i--) {
				if (neighbours.indexOf(i) > -1) {
					rightSibling = i;
				}
			}
			let diff1 = rangeIndex1 - leftSibling;
			let diff2 = rightSibling - rangeIndex1;
			if (diff1 > diff2) {
				rangeIndex2 = rightSibling;
			} else {
				rangeIndex2 = leftSibling;
			}
		} else {
			// find furthest selected item that's connected
			let leftSibling = rangeIndex1;
			let rightSibling = rangeIndex1;
			for (let i = rangeIndex1; i > 0; i--) {
				if (neighbours.indexOf(i) > -1) {
					leftSibling = i;
				}
			}
			for (let i = rangeIndex1; i < tabs.length; i++) {
				if (neighbours.indexOf(i) > -1) {
					rightSibling = i;
				}
			}
			let diff1 = rangeIndex1 - leftSibling;
			let diff2 = rightSibling - rangeIndex1;
			if (diff1 > diff2) {
				rangeIndex2 = leftSibling;
			} else {
				rangeIndex2 = rightSibling;
			}
		}
	}

	host.setState({
		lastSelect: tabs[rangeIndex2].id
	});
	if (rangeIndex2 < rangeIndex1) {
		let r1 = rangeIndex2;
		let r2 = rangeIndex1;
		rangeIndex1 = r1;
		rangeIndex2 = r2;
	}

	for (let i = 0; i < tabs.length; i++) {
		if (i >= rangeIndex1 && i <= rangeIndex2) {
			const _tab_id = tabs[i].id;
			if (activate) {
				host.state.selection.add(_tab_id);
			} else {
				host.state.selection.delete(_tab_id);
			}
		}
	}

	host.scrollTo('tab', host.state.lastSelect);

	const status = selectionStatusText(host.state.selection.size);
	host.setState(status);
	persistSelection(host.state.selection);
	host.forceUpdate();
}

export function clearSelectionState(host: SelectionHost): void {
	host.state.selection.clear();
	host.setState({
		lastSelect: 0
	});
	persistSelection(host.state.selection);
}
