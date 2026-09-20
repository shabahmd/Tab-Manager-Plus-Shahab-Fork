"use strict";

import * as browser from 'webextension-polyfill';
import {debugError} from "@helpers/debug";

export const TAB_CLOSE_TIMER_ALARM = "tabCloseTimers";
const TIMER_KEY = "tabCloseTimers";

// Auto-close timers (#256): maps tabId -> epoch-ms deadline. A 1-minute
// repeating alarm closes expired tabs; the alarm is removed when no timers
// remain so the worker stays idle.
async function readTimers(): Promise<Record<string, number>> {
	try {
		const stored = (await browser.storage.local.get(TIMER_KEY))[TIMER_KEY];
		if (!!stored && typeof stored === "object") return stored as Record<string, number>;
	} catch (e) {
		debugError("readTimers failed", e);
	}
	return {};
}

async function writeTimers(timers: Record<string, number>): Promise<void> {
	try {
		await browser.storage.local.set({[TIMER_KEY]: timers});
		if (Object.keys(timers).length > 0) {
			await browser.alarms.create(TAB_CLOSE_TIMER_ALARM, {periodInMinutes: 1}).catch(() => {});
		} else {
			await browser.alarms.clear(TAB_CLOSE_TIMER_ALARM).catch(() => {});
		}
	} catch (e) {
		debugError("writeTimers failed", e);
	}
}

export async function setTabCloseTimers(tabIds: number[], minutes: number): Promise<void> {
	if (!tabIds || tabIds.length === 0) return;
	if (!minutes || minutes <= 0) {
		return clearTabCloseTimers(tabIds);
	}
	const deadline = Date.now() + Math.round(minutes * 60000);
	const timers = await readTimers();
	for (const tabId of tabIds) {
		if (tabId == null) continue;
		timers[String(tabId)] = deadline;
	}
	await writeTimers(timers);
}

export async function clearTabCloseTimers(tabIds?: number[]): Promise<void> {
	const timers = await readTimers();
	if (!tabIds) {
		await writeTimers({});
		return;
	}
	for (const tabId of tabIds) {
		delete timers[String(tabId)];
	}
	await writeTimers(timers);
}

export async function checkTabCloseTimers(): Promise<void> {
	const timers = await readTimers();
	const ids = Object.keys(timers);
	if (ids.length === 0) return;
	const now = Date.now();
	let changed = false;
	for (const id of ids) {
		if (timers[id] > now) continue;
		const tabId = parseInt(id);
		try {
			await browser.tabs.get(tabId);
			await browser.tabs.remove(tabId);
		} catch (e) {
			// Already gone or unclosable - just drop the timer.
			debugError("checkTabCloseTimers failed for tab", tabId, e);
		}
		delete timers[id];
		changed = true;
	}
	if (changed) {
		await writeTimers(timers);
	}
}
