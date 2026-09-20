"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import * as S from "@strings";
import {ICommand, ITabManagerState} from "@types";
import {setLocalStorage} from "@helpers/storage";

export interface PopupOptionsHost {
	state: ITabManagerState;
	setState(state: any): void;
	forceUpdate(): void;
	update(): void | Promise<void>;
}

export async function changeTabLimitValue(host: PopupOptionsHost, e : React.ChangeEvent<HTMLInputElement>): Promise<void> {
	var _tab_limit = parseInt(e.target.value);
	host.setState({
		tabLimit: _tab_limit
	});
	await setLocalStorage("tabLimit", _tab_limit);
	tabLimitHelperText(host);
	host.forceUpdate();
}

export function tabLimitHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Limit the number of tabs per window. Will move new tabs into a new window instead. 0 to turn off"
	});
}

export async function changeTabWidthValue(host: PopupOptionsHost, e : React.ChangeEvent<HTMLInputElement>): Promise<void> {
	var _tab_width = parseInt(e.target.value);
	host.setState({
		tabWidth: _tab_width
	});
	await setLocalStorage("tabWidth", _tab_width);
	document.body.style.width = _tab_width + "px";
	tabWidthHelperText(host);
	host.forceUpdate();
}

export function tabWidthHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Change the width of this window. 800 by default."
	});
}

export async function changeTabHeightValue(host: PopupOptionsHost, e : React.ChangeEvent<HTMLInputElement>): Promise<void> {
	var _tab_height = parseInt(e.target.value);
	host.setState({
		tabHeight: _tab_height
	});
	await setLocalStorage("tabHeight", _tab_height);
	document.body.style.height = _tab_height + "px";
	tabHeightHelperText(host);
	host.forceUpdate();
}

export function tabHeightHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Change the height of this window. 600 by default."
	});
}

export async function toggleAnimationsState(host: PopupOptionsHost): Promise<void> {
	var _animations = !host.state.animations;
	host.setState({ animations: _animations });
	await setLocalStorage("animations", _animations);
	animationsHelperText(host);
	host.forceUpdate();
}

export function animationsHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Enables/disables animations. Default : on"
	});
}

export async function toggleWindowTitlesState(host: PopupOptionsHost): Promise<void> {
	var _window_titles = !host.state.windowTitles;
	host.setState({windowTitles: _window_titles});
	await setLocalStorage("windowTitles", _window_titles);
	windowTitlesHelperText(host);
	host.forceUpdate();
}

export function windowTitlesHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Enables/disables window titles. Default : on"
	});
}

export async function toggleCompactState(host: PopupOptionsHost): Promise<void> {
	var _compact = !host.state.compact;
	host.setState({compact: _compact});
	await setLocalStorage("compact", _compact);
	compactHelperText(host);
	host.forceUpdate();
}

export function compactHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Compact mode is a more compressed layout. Default : off"
	});
}

export async function toggleDarkState(host: PopupOptionsHost): Promise<void> {
	var _dark = !host.state.dark;
	host.setState({dark: _dark});
	await setLocalStorage("dark", _dark);

	darkHelperText(host);
	if (_dark) {
		document.body.className = "dark";
		document.documentElement.className = "dark";
	} else {
		document.body.className = "";
		document.documentElement.className = "";
	}
	host.forceUpdate();
}

export function darkHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Dark mode inverts the layout - better on the eyes. Default : off"
	});
}

export async function toggleTabActionsState(host: PopupOptionsHost): Promise<void> {
	var _tabactions = !host.state.tabactions;
	host.setState({tabactions: _tabactions});
	await setLocalStorage("tabactions", _tabactions);
	tabActionsHelperText(host);
	host.forceUpdate();
}

export function tabActionsHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Adds 'Open a new tab' and 'Close this window' option to each window. Default : on"
	});
}

export async function toggleBadgeState(host: PopupOptionsHost): Promise<void> {
	var _badge = !host.state.badge;
	host.setState({badge: _badge});
	await setLocalStorage("badge", _badge);
	badgeHelperText(host);
	browser.runtime.sendMessage<ICommand>({command: S.update_tab_count});
	host.forceUpdate();
}

export function badgeHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Shows the number of open tabs on the Tab Manager icon. Default : on"
	});
}

export async function toggleOpenInOwnTabState(host: PopupOptionsHost): Promise<void> {
	var _openInOwnTab = !host.state.openInOwnTab;
	host.setState({openInOwnTab: _openInOwnTab});
	await setLocalStorage("openInOwnTab", _openInOwnTab);
	openInOwnTabHelperText(host);
	browser.runtime.sendMessage<ICommand>({ command: S.reload_popup_controls });
	host.forceUpdate();
}

export function openInOwnTabHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Open the Tab Manager by default in own tab, or as a popup?"
	});
}

export async function toggleHideState(host: PopupOptionsHost): Promise<void> {
	var _hide_windows = host.state.hideWindows;
	if (navigator.userAgent.search("Firefox") > -1) {
		_hide_windows = false;
	} else {
		var granted = await browser.permissions.request({ permissions: ["system.display"] } as any).catch(() => false);
		if (granted) {
			_hide_windows = !_hide_windows;
		} else {
			_hide_windows = false;
		}
	}

	await setLocalStorage("hideWindows", _hide_windows);
	host.setState({
		hideWindows: _hide_windows
	});
	hideHelperText(host);
	host.forceUpdate();
}

export function hideHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Automatically minimizes inactive chrome windows. Default : off"
	});
}

export async function toggleFilterMismatchedTabsState(host: PopupOptionsHost): Promise<void> {
	var _filter_tabs = !host.state.filterTabs;
	host.setState({
		filterTabs: _filter_tabs
	});
	await setLocalStorage("filter-tabs", _filter_tabs);
	host.forceUpdate();
}

export async function toggleEnterToFocusState(host: PopupOptionsHost): Promise<void> {
	var _enter_to_focus = !host.state.enterToFocus;
	host.setState({
		enterToFocus: _enter_to_focus
	});
	await setLocalStorage("enterToFocus", _enter_to_focus);
	enterToFocusHelperText(host);
	host.forceUpdate();
}

export function enterToFocusHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Pressing enter after a search will switch to the first match instead of moving all matches to a new window. Default : off"
	});
}

export async function toggleOrderByTabCountState(host: PopupOptionsHost): Promise<void> {
	var _order_by_count = !host.state.orderByTabCount;
	host.setState({
		orderByTabCount: _order_by_count
	});
	await setLocalStorage("orderByTabCount", _order_by_count);
	orderByTabCountHelperText(host);
	await host.update();
	host.forceUpdate();
}

export function orderByTabCountHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Order windows by tab count, windows with the most tabs first. Default : off"
	});
}

export async function toggleDisableResortingState(host: PopupOptionsHost): Promise<void> {
	var _disable_resorting = !host.state.disableResorting;
	host.setState({
		disableResorting: _disable_resorting
	});
	await setLocalStorage("disableResorting", _disable_resorting);
	disableResortingHelperText(host);
	await host.update();
	host.forceUpdate();
}

export function disableResortingHelperText(host: PopupOptionsHost): void {
	host.setState({
		bottomText: "Keep windows in a stable order instead of re-sorting them when their activity changes. Default : off"
	});
}
