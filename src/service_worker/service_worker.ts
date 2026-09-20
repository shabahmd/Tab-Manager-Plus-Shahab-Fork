"use strict";

import {debugLog} from "@helpers/debug";
import { setLocalStorage } from "@helpers/storage";
import * as _a from "@background/actions";
import * as _w from '@background/windows';
import * as _t from '@background/tabs';
import {startAlarmBackup, stopAlarmBackup} from "@background/backup";
import {cleanupDebounce, cleanUp} from '@background/tracking';

import * as _c from '@ui/context_menus';
import * as _o from '@ui/open';
import {debounce} from "@helpers/utils";
import * as browser from 'webextension-polyfill';

function addListenerSafe(target: any, listener: (...args: any[]) => void, label: string) {
	try {
		if (!!target && typeof target.addListener === "function") {
			target.addListener(listener);
		} else {
			debugLog(label + " not supported in this browser (non-fatal)");
		}
	} catch (e) {
		debugLog(label + " failed (non-fatal):", e);
	}
}

addListenerSafe(browser.runtime && browser.runtime.onStartup, async function () {
	debugLog(" ON STARTUP");
}, "runtime.onStartup");

// Chrome-only; Firefox has no runtime.onSuspend - must not throw at load.
addListenerSafe(browser.runtime && browser.runtime.onSuspend, async function () {
	debugLog(" ON SUSPEND");
}, "runtime.onSuspend");

addListenerSafe(browser.commands && browser.commands.onCommand, _a.handleCommands, "commands.onCommand");
addListenerSafe(browser.runtime && browser.runtime.onMessage, _a.handleMessages, "runtime.onMessage");
addListenerSafe(browser.alarms && browser.alarms.onAlarm, _a.onAlarm, "alarms.onAlarm");

(async function () {
	try {
		let windows = await browser.windows.getAll({ populate: true });
	await setLocalStorage("windowAge", []);
	if (!!windows && windows.length > 0) {
		windows.sort(function (a, b) {
			if (a.id < b.id) return 1;
			if (a.id > b.id) return -1;
			return 0;
		});
		for (let i = 0; i < windows.length; i++) {
			if (!!windows[i].id) await _w.windowActive(windows[i].id);
		}
	}
	} catch (e) {
		debugLog("initial window scan failed (non-fatal):", e);
	}
})();

export const setupDebounced = debounce(setup, 2000);

async function setup() {
	try {
		await _c.setupContextMenus();
	} catch (e) {
		debugLog("setupContextMenus failed (non-fatal):", e);
	}
	try {
		await _o.setupPopup();
	} catch (e) {
		debugLog("setupPopup failed (non-fatal):", e);
	}
	try {
		await _t.setupTabListeners();
	} catch (e) {
		debugLog("setupTabListeners failed (non-fatal):", e);
	}
	try {
		await _w.setupWindowListeners();
	} catch (e) {
		debugLog("setupWindowListeners failed (non-fatal):", e);
	}

	try {
		_t.updateTabCountDebounce();
	} catch (e) {
		debugLog("updateTabCount failed (non-fatal):", e);
	}

	try {
		await startAlarmBackup();
	} catch (e) {
		debugLog("startAlarmBackup failed (non-fatal):", e);
	}

	setTimeout(cleanupDebounce, 2500);
}

setInterval(setupDebounced, 300000);
setTimeout(() => { stopAlarmBackup(); cleanUp.bind(this, true); }, 2000000);

setup().catch((e) => debugLog("setup failed (non-fatal):", e));