// Minimal in-memory stub of webextension-polyfill for unit tests.
// Aliased in vitest.config.ts so imports of "webextension-polyfill"
// resolve to this instead of the real polyfill (which throws outside
// a real extension context).

const data = new Map<string, unknown>();

function readKeys(keys : unknown) : Record<string, unknown> {
	const out : Record<string, unknown> = {};
	if (keys === null || keys === undefined) {
		for (const [k, v] of data) out[k] = v;
	} else if (typeof keys === "string") {
		if (data.has(keys)) out[keys] = data.get(keys);
	} else if (Array.isArray(keys)) {
		for (const k of keys) if (data.has(k)) out[k] = data.get(k);
	} else if (typeof keys === "object") {
		for (const [k, v] of Object.entries(keys as Record<string, unknown>)) {
			out[k] = data.has(k) ? data.get(k) : v;
		}
	}
	return out;
}

function makeStorageArea() {
	return {
		get: async (keys : unknown = null) => readKeys(keys),
		set: async (obj : Record<string, unknown>) => {
			for (const [k, v] of Object.entries(obj)) data.set(k, v);
		},
		remove: async (keys : string | string[]) => {
			for (const k of Array.isArray(keys) ? keys : [keys]) data.delete(k);
		},
		clear: async () => data.clear(),
	};
}

export const storage = {
	local: makeStorageArea(),
	sync: makeStorageArea(),
};

export const runtime = {
	id: "tab-manager-pro@stefanxo.com",
	getManifest: () => ({manifest_version: 2, name: "Tab Manager Pro", version: "0.0.0-test"}),
	sendMessage: async () => undefined,
	onMessage: {
		addListener: () => undefined,
		removeListener: () => undefined,
	},
};

export const tabs = {
	query: async () => [],
};

export const windows = {
	getAll: async () => [],
};

export default {storage, runtime, tabs, windows};
