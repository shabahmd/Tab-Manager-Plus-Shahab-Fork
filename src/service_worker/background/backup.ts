import * as browser from "webextension-polyfill";
import {debugError} from "@helpers/debug";

const BACKUP_KEY = "session_backups";
const MAX_BACKUPS = 50;
const DEFAULT_INTERVAL_MINUTES = 15;

export async function startAlarmBackup(): Promise<void> {
	try {
		const interval = await getBackupInterval();
		await browser.alarms.clear("sessionAutoBackup").catch(() => {});
		await browser.alarms.create("sessionAutoBackup", {periodInMinutes: interval});
	} catch (e) {
		debugError("startAlarmBackup failed", e);
	}
}

export async function stopAlarmBackup(): Promise<void> {
	try {
		await browser.alarms.clear("sessionAutoBackup").catch(() => {});
	} catch (e) {
		debugError("stopAlarmBackup failed", e);
	}
}

export async function onAlarmBackup(alarm: browser.Alarms.Alarm): Promise<void> {
	if (alarm.name !== "sessionAutoBackup") return;
	try {
		const windows = await browser.windows.getAll({populate: true});
		const timestamp = new Date().toISOString();
		const backups = (await browser.storage.local.get(BACKUP_KEY))[BACKUP_KEY] || [];
		if (!Array.isArray(backups)) {
			await browser.storage.local.set({[BACKUP_KEY]: [{timestamp, windows}]});
		} else {
			backups.push({timestamp, windows});
			if (backups.length > MAX_BACKUPS) {
				backups.shift();
			}
			await browser.storage.local.set({[BACKUP_KEY]: backups});
		}
	} catch (e) {
		debugError("onAlarmBackup failed", e);
	}
}

async function getBackupInterval(): Promise<number> {
	try {
		const val = await browser.storage.local.get("backupInterval");
		if (typeof val["backupInterval"] === "number" && val["backupInterval"] > 0) {
			return val["backupInterval"];
		}
	} catch {
		// Storage unavailable; fall back to the default interval.
	}
	return DEFAULT_INTERVAL_MINUTES;
}
