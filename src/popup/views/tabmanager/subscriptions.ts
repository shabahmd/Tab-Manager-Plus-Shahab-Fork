"use strict";

import * as browser from 'webextension-polyfill';
import * as S from "@strings";
import {ICommand, ITabManagerState} from "@types";
import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {debounce} from "@helpers/utils";
import {debugError} from "@helpers/debug";
import {focusRootView, scrollActiveTabIntoView} from "./viewport";

export interface SubscriptionHost {
	state: ITabManagerState;
	refs: any;
	setState(state: any): void;
	forceUpdate(): void;
	loadStorage(): Promise<void>;
	update(): void | Promise<void>;
	sessionSync(): void | Promise<void>;
	dirtyWindow(windowId: number): void;
	getWindowRef(windowId: number): any;
	onTabCreated(tab : browser.Tabs.Tab): void;
	onTabDetached(tabId : number, detachInfo : browser.Tabs.OnDetachedDetachInfoType): void;
	onTabAttached(tabId : number, attachInfo: browser.Tabs.OnAttachedAttachInfoType): void;
	onTabRemoved(tabId : number, removeInfo : browser.Tabs.OnRemovedRemoveInfoType): void;
}

// Browser event subscriptions extracted from TabManager.componentDidMount().
export async function setupPopupSubscriptions(host: SubscriptionHost): Promise<void> {
	await host.loadStorage();

	if (navigator.userAgent.search("Firefox") > -1) {
	} else {
		let result = await browser.permissions.contains({permissions: ["system.display"]});
		if (!result) {
			setLocalStorage("hideWindows", false);
			host.setState({
				hideWindows: false
			});
		}
	}

	let _this = host;

	let runUpdate = debounce(host.update, 250);
	runUpdate = runUpdate.bind(host);

	var runTabUpdate = async (tabid, changeinfo, tab) => {
		host.dirtyWindow(tab.windowId);

		const windowComponent = _this.getWindowRef(tab.windowId) as any;
		if (!!windowComponent) {
			if (!!windowComponent.refs["tab" + tabid]) {
				var _tabref = windowComponent.refs["tab" + tabid] as any;
				await _tabref.checkSettings();
			}
		}
	}

	browser.tabs.onCreated.addListener(runUpdate);
	browser.tabs.onUpdated.addListener(runUpdate);
	browser.tabs.onUpdated.addListener(runTabUpdate);
	browser.tabs.onMoved.addListener(runUpdate);
	browser.tabs.onRemoved.addListener(runUpdate);
	browser.tabs.onReplaced.addListener(runUpdate);
	browser.tabs.onDetached.addListener(runUpdate);
	browser.tabs.onAttached.addListener(runUpdate);

	browser.tabs.onCreated.addListener(host.onTabCreated);
	browser.tabs.onDetached.addListener(host.onTabDetached);
	browser.tabs.onAttached.addListener(host.onTabAttached);
	browser.tabs.onRemoved.addListener(host.onTabRemoved);

	browser.tabs.onActivated.addListener(runUpdate);
	browser.windows.onFocusChanged.addListener(runUpdate);
	browser.windows.onCreated.addListener(runUpdate);
	browser.windows.onRemoved.addListener(runUpdate);

	browser.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
		const request = message as ICommand;

		debugError("command", request.command);
		switch (request.command) {
			case S.refresh_windows:
				let window_ids : number[] = request.window_ids;
				for (let window_id of window_ids) {
					const windowComponent = _this.getWindowRef(window_id) as any;
					if (!windowComponent) continue;
					windowComponent.checkSettings();
				}
				break;
		}
	});


	browser.storage.onChanged.addListener(host.sessionSync);

	await host.sessionSync();

	(host.refs.root as HTMLElement)?.focus();
	focusRootView(host);

	const animations = await getLocalStorage("animations", false);
	scrollActiveTabIntoView(animations);

	// box.select();
	// box.focus();
}
