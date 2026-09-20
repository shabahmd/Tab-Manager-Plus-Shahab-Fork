"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import {ITabManagerState} from "@types";
import {displayTabTitle} from "./tabNames";

export interface StatusHost {
	state: ITabManagerState;
	setState(state: any): void;
	forceUpdate(): void;
	update(): void | Promise<void>;
}

export function hoverTabStatus(host: StatusHost, tab : browser.Tabs.Tab): void {
	host.setState({ topText: displayTabTitle(tab, host.state.tabNames) });
	host.setState({ bottomText: tab.url || tab.pendingUrl || "" });
	// clearTimeout(host.state.closeTimeout);
	// host.state.closeTimeout = setTimeout(function () {
	//  window.close();
	// }, 100000);
	var _reset_timeout = host.state.resetTimeout;
	clearTimeout(_reset_timeout);
	_reset_timeout = setTimeout(
		function() {
			host.setState({ topText: "", bottomText: "" });
			host.update();
		}.bind(host),
		15000
	) as unknown as number;
	host.setState({resetTimeout: _reset_timeout});
	//host.update();
}

export function hoverIconStatus(host: StatusHost, e : React.MouseEvent<HTMLDivElement> | string): void {
	var text = "";
	if (typeof (e) === "string") {
		text = e;
	} else {
		if (e && e.nativeEvent) {
			e.nativeEvent.preventDefault();
			e.nativeEvent.stopPropagation();
		}

		if (e && e.target && !!(e.target as HTMLDivElement).title) {
			text = (e.target as HTMLDivElement).title;
		}
	}

	var bottom = " ";
	if (text.indexOf("\n") > -1) {
		var a = text.split("\n");
		text = a[0];
		bottom = a[1];
	}
	host.setState({ topText: text });
	host.setState({ bottomText: bottom });
	//host.update();
	host.forceUpdate();
}

export function getRandomTip(): string {
	var tips = [
		"You can right click on a tab to select it",
		"Press enter to move all selected tabs to a new window",
		"Middle click to close a tab",
		"Tab Manager Plus loves saving time",
		"To see incognito tabs, enable incognito access in the extension settings",
		"You can drag and drop tabs to other windows",
		"You can type to search right away",
		"You can search for different tabs : google OR yahoo"
	];

	return "Tip: " + tips[Math.floor(Math.random() * tips.length)];
}
