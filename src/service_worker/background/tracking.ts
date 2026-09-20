"use strict";

import {hashcode} from "@background/windows"
import {debounce} from "@helpers/utils";
import {getLocalStorageMap, setLocalStorageMap, getLocalStorage, setLocalStorage} from "@helpers/storage";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ICommand} from "@types";
import {debugError} from "@helpers/debug";

export const cleanupDebounce = debounce(cleanUp, 500);

export async function cleanUp(remove_old = false) {
	const activewindows = await browser.windows.getAll({populate: true});
	const windowids: number[] = [];
	for (const _w of activewindows) {
		windowids.push(_w.id);
	}
	// console.log("window ids...", windowids);

	let windows = await getLocalStorage("windowAge", []);
	if (!(windows instanceof Array)) windows = [];

	// console.log("before", JSON.parse(JSON.stringify(windows)));
	for (let i = windows.length - 1; i >= 0; i--) {
		if (windowids.indexOf(windows[i]) < 0) {
			// console.log("did not find", windows[i], i);
			windows.splice(i, 1);
		}
	}

	// console.log("after", JSON.parse(JSON.stringify(windows)));
	await setLocalStorage("windowAge", windows);

	const names : Map<number, string> = await getLocalStorageMap<number, string>(S.windowNames);
	const colors : Map<number, string> = await getLocalStorageMap<number, string>(S.windowColors);
	const to_check = new Set<number>();
	const exists = new Set<number>();
	const to_refresh : number[] = [];

	// console.log("before", JSON.parse(JSON.stringify(names)));
	for (const [id, _name] of names) {
		if (windowids.indexOf(id) < 0) {
			// console.log("did not find", id);
			to_check.add(id);
		} else {
			exists.add(id);
		}
	}

	for (const [id, _color] of colors) {
		if (windowids.indexOf(id) < 0) {
			// console.log("did not find", id);
			to_check.add(id);
		} else {
			exists.add(id);
		}
	}

	if (to_check.size > 0) {
		const hashes : Map<number, number> = await getLocalStorageMap<number, number>(S.windowHashes);
		let found = false;

		for (const w of activewindows) {
			const windowhash = hashcode(w);
			for (const [id, _hash] of hashes) {
				if (!to_check.has(id)) continue;
				if (exists.has(id)) continue;
				if (w.id === id) break;
				if (_hash === windowhash) {
					debugError("found by hash, old id " + id + " new id " + w.id);
					to_refresh.push(w.id);
					if (names.get(id)) {
						names.set(w.id, names.get(id));
						names.delete(id);
					}
					if (colors.get(id)) {
						colors.set(w.id, colors.get(id));
						colors.delete(id);
					}
					hashes.set(w.id, _hash);
					hashes.delete(id);
					found = true;
					to_check.delete(id);
					break;
				}
			}
		}

		let save = false;
		if (remove_old) {
			for (const _id of to_check) {
				debugError("should delete from to check " + _id);
				colors.delete(_id);
				names.delete(_id);
				hashes.delete(_id);
				save = true;
			}
		}

		if (found || save) {
			await setLocalStorageMap<number, string>(S.windowNames, names);
			await setLocalStorageMap<number, string>(S.windowColors, colors);
			await setLocalStorageMap<number, number>(S.windowHashes, hashes);
			if (found) {
				browser.runtime.sendMessage<ICommand>({
					command: S.refresh_windows,
					window_ids: to_refresh
				});
			}
		}
	}
}