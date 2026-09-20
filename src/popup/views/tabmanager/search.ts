"use strict";

import {ITabManagerState} from "@types";
import {matchTabSearch, parseTabSearch} from "./tabSearch";

export interface SearchHost {
	state: ITabManagerState;
	setState(state: any): void;
	forceUpdate(): void;
	saveSelection(): void;
}

export function applySearch(host: SearchHost, e): void {
	let hiddenCount = host.state.hiddenCount || 0;
	const searchQuery = e.target.value || "";
	const searchLen = searchQuery.length;

	const {searchType, searchTerms} = parseTabSearch(searchQuery);

	if (!searchLen) {
		host.state.selection.clear();
		host.state.hiddenTabs.clear();
		hiddenCount = 0;
	} else {
		let idList : number[];
		const lastSearchLen = host.state.searchLen;
		idList = [ ...host.state.tabsbyid.keys() ];
		if(searchType === "normal") {
			if (!lastSearchLen) {
				idList = [ ...host.state.tabsbyid.keys() ];
			} else if (lastSearchLen > searchLen) {
				idList = [ ...host.state.hiddenTabs.keys() ];
			} else if (lastSearchLen < searchLen) {
				idList = [ ...host.state.selection.keys() ];
			}
		}
		for (const id of idList) {
			const tab = host.state.tabsbyid.get(id);
			let tabSearchTerm;
			if (tab.title) tabSearchTerm = tab.title;
			if (tab.url) tabSearchTerm += " " + tab.url;
			tabSearchTerm = tabSearchTerm.toLowerCase();
			const match = matchTabSearch(tabSearchTerm, e.target.value, searchType, searchTerms);
		if (match || tab.pinned) {
			hiddenCount -= host.state.hiddenTabs.has(id) ? 1 : 0;
			host.state.selection.add(id);
			host.state.hiddenTabs.delete(id);
		} else {
			hiddenCount += 1 - (host.state.hiddenTabs.has(id) ? 1 : 0);
			host.state.hiddenTabs.add(id);
			host.state.selection.delete(id);
		}
			host.setState({
				lastSelect: id
			});
		}
	}

	host.setState({
		hiddenCount: hiddenCount,
		searchLen: searchLen,
		searchQuery: searchQuery
	})

	const matches = host.state.selection.size;
	// var matchtext = "";
	if (matches === 0 && searchLen > 0) {
		host.setState({
			topText: "No matches for '" + searchQuery + "'",
			bottomText: ""
		});
	} else if (matches === 0) {
		host.setState({
			topText: "",
			bottomText: ""
		});
	} else if (matches > 1) {
		host.setState({
			topText: host.state.selection.size + " matches for '" + searchQuery + "'",
			bottomText: "Press enter to move them to a new window"
		});
	} else if (matches === 1) {
		host.setState({
			topText: host.state.selection.size + " match for '" + searchQuery + "'",
			bottomText: "Press enter to switch to the tab"
		});
	}
	host.saveSelection();
	host.forceUpdate();
}
