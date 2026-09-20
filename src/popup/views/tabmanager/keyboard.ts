"use strict";

import * as browser from 'webextension-polyfill';
import {ITabManagerState} from "@types";
import {debugLog} from "@helpers/debug";

// Keyboard handling extracted from TabManager (which had grown into a
// GodClass). The host is the TabManager component itself - it satisfies this
// structural interface, so no circular import is needed.
export interface ManagerKeyHost {
	state: ITabManagerState;
	refs: any;
	select(id: number): void;
	selectTo(id: number, tabs: browser.Tabs.Tab[]): void;
	selectWindowTab(windowId: number, tabPosition: number): void;
	clearSelection(): void;
	addWindow(): void | Promise<void>;
	focusFirstSelected(): void | Promise<void>;
	saveSelection(): void;
	setState(state: any): void;
	forceUpdate(): void;
}

export function handleManagerKey(host: ManagerKeyHost, e) {
	// Ctrl+Shift+A → select all tabs across all windows (check first:
	// ctrlKey is also true for this combo)
	if (e.ctrlKey && e.shiftKey && e.keyCode === 65) {
		e.preventDefault();
		e.stopPropagation();
		for (const tab of host.state.tabsbyid.values()) {
			host.state.selection.add(tab.id);
		}
		host.setState({selection: new Set(host.state.selection)});
		host.saveSelection();
		host.forceUpdate();
		return;
	}
	// Ctrl+A → select all visible tabs
	if (e.ctrlKey && !e.shiftKey && e.keyCode === 65) {
		e.preventDefault();
		e.stopPropagation();
		const tabs = [...host.state.tabsbyid.values()].filter(t => {
			if (host.state.filterTabs && host.state.hiddenTabs.has(t.id)) return false;
			return true;
		});
		for (const tab of tabs) {
			host.state.selection.add(tab.id);
		}
		host.setState({selection: new Set(host.state.selection)});
		host.saveSelection();
		host.forceUpdate();
		return;
	}
	// enter
	if (e.keyCode === 13) {
		if (host.state.enterToFocus && host.state.searchLen > 0 && host.state.selection.size > 0) {
			host.focusFirstSelected();
		} else {
			host.addWindow();
		}
	}
	// escape key
	if (e.keyCode === 27) {
		if(host.state.searchLen > 0 || host.state.selection.size > 0) {
			// stop popup from closing if we have search text or selection active
			e.nativeEvent.preventDefault();
			e.nativeEvent.stopPropagation();
		}

		host.state.hiddenTabs.clear();
		host.setState({
		searchLen: 0,
		searchQuery: ""
		});

		(host.refs.searchbox as HTMLInputElement).value = "";
		host.clearSelection();
	}
	// any typed keys
	if (
		(e.keyCode >= 48 && e.keyCode <= 57) ||
		(e.keyCode >= 65 && e.keyCode <= 90) ||
		(e.keyCode >= 186 && e.keyCode <= 192) ||
		(e.keyCode >= 219 && e.keyCode <= 22) ||
		e.keyCode === 8 ||
		e.keyCode === 46 ||
		e.keyCode === 32
	) {
		if (document.activeElement !== host.refs.searchbox) {
			const activeInputElement = document.activeElement as HTMLInputElement;
			debugLog(activeInputElement);
			debugLog(host.refs.searchbox);
			if (activeInputElement.type !== "text" && activeInputElement.type !== "input") {
				(host.refs.searchbox as HTMLElement)?.focus();
			}
		}
	}
	// arrow keys
	/*
		left arrow  37
		up arrow  38
		right arrow 39
		down arrow  40
	*/
	if (e.keyCode >= 37 && e.keyCode <= 40) {
		if (document.activeElement !== host.refs.windowcontainer && document.activeElement !== host.refs.searchbox) {
			debugLog(document.activeElement);
			debugLog(host.refs.windowcontainer);
			(host.refs.windowcontainer as HTMLElement)?.focus();
		}

		if (document.activeElement !== host.refs.searchbox || !((host.refs.searchbox as HTMLInputElement).value)) {
			let goLeft = e.keyCode === 37;
			let goRight = e.keyCode === 39;
			let goUp = e.keyCode === 38;
			let goDown = e.keyCode === 40;
			if (host.state.layout === "vertical") {
				goLeft = e.keyCode === 38;
				goRight = e.keyCode === 40;
				goUp = e.keyCode === 37;
				goDown = e.keyCode === 39;
			}
			if (goLeft || goRight || goUp || goDown) {
				e.nativeEvent.preventDefault();
				e.nativeEvent.stopPropagation();
			}
			const altKey = e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey;
			if (goLeft || goRight) {
				navigateTabsLeftRight(host, goLeft, goRight, altKey);
			}
			if (goUp || goDown) {
				navigateWindowsUpDown(host, goUp, goDown);
			}
		}
	}
	// page up / page down
	if (e.keyCode === 33 || e.keyCode === 34) {
		if (document.activeElement != host.refs.windowcontainer) {
			(host.refs.windowcontainer as HTMLElement).focus();
		}
	}
	host.saveSelection();
}

function navigateTabsLeftRight(host: ManagerKeyHost, goLeft: boolean, goRight: boolean, altKey: boolean) {
	const selectedTabs = [...host.state.selection.keys()];
	if (!altKey && selectedTabs.length > 1) {
		// Multi-tab selection without Alt: movement keys are handled elsewhere.
	} else {
		let found = false;
		let selectedNext = false;
		let selectedTab = 0;
		let first = 0;
		let prev = 0;
		let last = 0;
		if (selectedTabs.length === 1) {
			selectedTab = selectedTabs[0];
		} else if (selectedTabs.length > 1) {
			if (host.state.lastSelect) {
				selectedTab = host.state.lastSelect;
			} else {
				selectedTab = selectedTabs[0];
			}
		} else if (selectedTabs.length === 0 && !!host.state.lastSelect) {
			selectedTab = host.state.lastSelect;
		}
		if (host.state.lastDirection) {
		if (goRight && host.state.lastDirection === "goRight") {
			// Already moving right; fall through to continue right.
		} else if (goLeft && host.state.lastDirection === "goLeft") {
			// Already moving left; fall through to continue left.
		} else if (selectedTabs.length > 1) {
				host.select(host.state.lastSelect);
				host.setState({
					lastDirection: ""
				});
				found = true;
			} else {
				host.setState({
					lastDirection: ""
				});
			}
		}
		if (!host.state.lastDirection) {
			if (goRight) host.setState({ lastDirection: "goRight" });
			if (goLeft) host.setState({ lastDirection: "goLeft" });
		}
		for (const _w of host.state.windows) {
			if (found) break;
			if (_w.state !== "minimized") {
				for (const _t of _w.tabs) {
					// stay within search results while searching
					if (host.state.searchLen > 0 && host.state.hiddenTabs.has(_t.id)) continue;
					last = _t.id;
					if (!first) first = _t.id;
					if (!selectedTab) {
						if (!altKey) host.state.selection.clear();
						host.select(_t.id);
						found = true;
						break;
					} else if (selectedTab === _t.id) {
						if (goRight) {
							selectedNext = true;
						} else if (prev) {
							if (!altKey) host.state.selection.clear();
							host.select(prev);
							found = true;
							break;
						}
					} else if (selectedNext) {
						if (!altKey) host.state.selection.clear();
						host.select(_t.id);
						found = true;
						break;
					}
					prev = _t.id;
				}
			}
		}
		for (const _w of host.state.windows) {
			if (found) break;
			if (_w.state === "minimized") {
				for (const _t of _w.tabs) {
					// stay within search results while searching
					if (host.state.searchLen > 0 && host.state.hiddenTabs.has(_t.id)) continue;
					last = _t.id;
					if (!first) first = _t.id;
					if (!selectedTab) {
						if (!altKey) host.state.selection.clear();
						host.select(_t.id);
						found = true;
						break;
					} else if (selectedTab === _t.id) {
						if (goRight) {
							selectedNext = true;
						} else if (prev) {
							if (!altKey) host.state.selection.clear();
							host.select(prev);
							found = true;
							break;
						}
					} else if (selectedNext) {
						if (!altKey) host.state.selection.clear();
						host.select(_t.id);
						found = true;
						break;
					}
					prev = _t.id;
				}
			}
		}
		if (!found && goRight && !!first) {
			if (!altKey) host.state.selection.clear();
			host.select(first);
			found = true;
		}
		if (!found && goLeft && !!last) {
			if (!altKey) host.state.selection.clear();
			host.select(last);
			found = true;
		}
	}
}

function navigateWindowsUpDown(host: ManagerKeyHost, goUp: boolean, goDown: boolean) {
	const selectedTabs = [...host.state.selection.keys()];
	if (selectedTabs.length > 1) {
		// Multi-tab selection: vertical window navigation is handled elsewhere.
	} else {
		let found = false;
		let selectedNext = false;
		let selectedTab = -1;
		let first = 0;
		let prev = 0;
		let last = 0;
		let tabPosition = -1;
		let i = -1;
		if (selectedTabs.length === 1) {
			selectedTab = selectedTabs[0];
		}
		for (const _w of host.state.windows) {
			i = 0;
			if (found) break;
			if (_w.state !== "minimized") {
				if (!first) first = _w.id;
				for (const _t of _w.tabs) {
					i++;
					last = _w.id;
					if (!selectedTab) {
						host.selectWindowTab(_w.id, tabPosition);
						found = true;
						break;
					} else if (selectedTab === _t.id) {
						tabPosition = i;
						if (goDown) {
							selectedNext = true;
							break;
						} else if (prev) {
							host.selectWindowTab(prev, tabPosition);
							found = true;
							break;
						}
					} else if (selectedNext) {
						host.selectWindowTab(_w.id, tabPosition);
						found = true;
						break;
					}
				}
				prev = _w.id;
			}
		}
		for (const _w of host.state.windows) {
			i = 0;
			if (found) break;
			if (_w.state === "minimized") {
				if (!first) first = _w.id;
				for (const _t of _w.tabs) {
					i++;
					last = _w.id;
					if (!selectedTab) {
						host.selectWindowTab(_w.id, tabPosition);
						found = true;
						break;
					} else if (selectedTab === _t.id) {
						tabPosition = i;
						if (goDown) {
							selectedNext = true;
							break;
						} else if (prev) {
							host.selectWindowTab(prev, tabPosition);
							found = true;
							break;
						}
					} else if (selectedNext) {
						host.selectWindowTab(_w.id, tabPosition);
						found = true;
						break;
					}
				}
				prev = _w.id;
			}
		}
		if (!found && goDown && !!first) {
			host.state.selection.clear();
			host.selectWindowTab(first, tabPosition);
			found = true;
		}
		if (!found && goUp && !!last) {
			host.state.selection.clear();
			host.selectWindowTab(last, tabPosition);
			found = true;
		}
	}
}
