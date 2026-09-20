import * as browser from 'webextension-polyfill';
import {debugError} from '@helpers/debug';

export async function getLocalStorage<T>(key: string, default_value: T): Promise<T>;
export async function getLocalStorage(key: string): Promise<unknown>;
export async function getLocalStorage(key: string, default_value: unknown = null): Promise<unknown> {
	try {
		const result = await browser.storage.local.get([key]);
		return result[key] === undefined ? default_value : result[key];
	} catch (e) {
		debugError("getLocalStorage failed", e);
		return default_value;
	}
}

export async function getLocalStorageMap<T extends number, V>(key: string): Promise<Map<T, V>> {
	try {
		const result = await browser.storage.local.get([key]);
		if (result[key] === undefined) {
			return new Map<T, V>();
		}
		const newMap = new Map<T, V>();
		const obj: Record<string, unknown> = result[key] as Record<string, unknown>;
		for (const [k, v] of Object.entries(obj)) {
			const parsedKey = parseInt(k);
			if (!isNaN(parsedKey)) {
				newMap.set(parsedKey as T, v as V);
			}
		}
		return newMap;
	} catch (e) {
		debugError("getLocalStorageMap failed", e);
		return new Map<T, V>();
	}
}

export async function getLocalStorageStringMap<T, V>(key: string): Promise<Map<T, V>> {
	try {
		const result = await browser.storage.local.get([key]);
		if (result[key] === undefined) {
			return new Map<T, V>();
		}
		const newMap = new Map<T, V>();
		const obj: Record<string, unknown> = result[key] as Record<string, unknown>;
		for (const [k, v] of Object.entries(obj)) {
			newMap.set(k as T, v as V);
		}
		return newMap;
	} catch (e) {
		debugError("getLocalStorageStringMap failed", e);
		return new Map<T, V>();
	}
}

export async function setLocalStorage(key: string, value: unknown): Promise<void> {
	try {
		const obj: Record<string, unknown> = {};
		obj[key] = value;
		await browser.storage.local.set(obj);
	} catch (e) {
		debugError("setLocalStorage failed", e);
	}
}

export async function setLocalStorageMap<T, V>(key: string, value: Map<T, V>): Promise<void> {
	try {
		const obj: Record<string, unknown> = {};
		obj[key] = Object.fromEntries(value);
		await browser.storage.local.set(obj);
	} catch (e) {
		debugError("setLocalStorageMap failed", e);
	}
}

export async function removeLocalStorage(key: string): Promise<void> {
	try {
		await browser.storage.local.remove(key);
	} catch (e) {
		debugError("removeLocalStorage failed", e);
	}
}