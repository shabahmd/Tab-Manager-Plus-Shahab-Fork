import * as browser from "webextension-polyfill";
import {S} from "@strings";
import {debugError} from "@helpers/debug";

export async function hibernateWindow(windowId: number): Promise<void> {
	try {
		const tabs = await browser.tabs.query({windowId});
		for (const tab of tabs) {
			if (!tab.active && !tab.discarded) {
				await browser.tabs.discard(tab.id).catch((e) => {
					debugError(`Failed to discard tab ${tab.id}`, e);
				});
			}
		}
	} catch (e) {
		debugError("hibernateWindow failed", e);
	}
}
