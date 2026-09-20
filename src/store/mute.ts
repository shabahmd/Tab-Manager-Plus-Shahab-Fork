import {useTabManagerUI} from "@store/useTabManagerUI";
import * as browser from "webextension-polyfill";
import {S} from "@strings";

export async function toggleMute(tabId: number): Promise<void> {
	try {
		const tab = await browser.tabs.get(tabId);
		if (tab) {
			await browser.tabs.update(tabId, {muted: !tab.mutedInfo?.muted});
		}
	} catch (e) {
		console.error("Failed to toggle mute:", e);
	}
}

export async function toggleTabAudible(tabId: number): Promise<boolean> {
	try {
		const tab = await browser.tabs.get(tabId);
		return tab?.audible || false;
	} catch {
		return false;
	}
}
