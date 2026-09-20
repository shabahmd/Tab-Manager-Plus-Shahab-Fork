import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {debugError} from "@helpers/debug";
import * as browser from "webextension-polyfill";

const UNDO_KEY = "recently_closed";
const MAX_UNDO = 20;

export async function saveClosedTab(tabId: number, tab: any): Promise<void> {
	try {
		const closed = (await getLocalStorage(UNDO_KEY, [])) as any[];
		if (!Array.isArray(closed)) {
			closed.length = 0;
		}
		closed.unshift({
			tabId,
			url: tab?.url || "",
			title: tab?.title || "",
			favIconUrl: tab?.favIconUrl || "",
			windowId: tab?.windowId || 0,
			timestamp: Date.now(),
		});
		if (closed.length > MAX_UNDO) closed.pop();
		await setLocalStorage(UNDO_KEY, closed);
	} catch (e) {
		debugError("saveClosedTab failed", e);
	}
}

export async function getRecentlyClosed(): Promise<any[]> {
	try {
		const closed = (await getLocalStorage(UNDO_KEY, [])) as any[];
		return Array.isArray(closed) ? closed : [];
	} catch {
		return [];
	}
}

export async function undoClose(): Promise<void> {
	try {
		const closed = (await getLocalStorage(UNDO_KEY, [])) as any[];
		if (Array.isArray(closed) && closed.length > 0) {
			const last = closed[0];
			await browser.tabs.create({
				url: last.url || "",
				windowId: last.windowId || undefined,
			}).catch(() => {});
			await undoCloseTab(last.tabId);
		}
	} catch (e) {
		debugError("undoClose failed", e);
	}
}

export async function undoCloseTab(tabId: number): Promise<void> {
	try {
		const closed = (await getLocalStorage(UNDO_KEY, [])) as any[];
		if (Array.isArray(closed)) {
			const index = closed.findIndex((c) => c.tabId === tabId);
			if (index >= 0) {
				closed.splice(index, 1);
				await setLocalStorage(UNDO_KEY, closed);
			}
		}
	} catch (e) {
		debugError("undoCloseTab failed", e);
	}
}

export async function clearUndo(): Promise<void> {
	try {
		await setLocalStorage(UNDO_KEY, []);
	} catch (e) {
		debugError("clearUndo failed", e);
	}
}
