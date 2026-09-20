import {describe, expect, it} from "vitest";
import {applyPopupOptionDefaults, isSystemDark} from "../popup/views/tabmanager/optionDefaults";

describe("isSystemDark", () => {
	it("returns a boolean", () => {
		expect(typeof isSystemDark()).toBe("boolean");
	});

	it("falls back to false when matchMedia is unavailable (jsdom)", () => {
		// jsdom does not implement window.matchMedia, so the optional
		// chaining fallback must yield false, not throw.
		expect(isSystemDark()).toBe(false);
	});
});

describe("applyPopupOptionDefaults dark handling", () => {
	it("marks system-derived theme without pinning a dark key to storage", () => {
		const storage : Record<string, any> = {};
		const options = applyPopupOptionDefaults(storage);

		expect(options.dark).toBe(isSystemDark());
		// The derived value must not be persisted as "dark".
		expect(storage["dark"]).toBeUndefined();
		expect(storage["_darkNeedsSystemTheme"]).toBe(true);
	});

	it("keeps an existing stored preference untouched", () => {
		const storage : Record<string, any> = {dark: true};
		const options = applyPopupOptionDefaults(storage);

		expect(options.dark).toBe(true);
		expect(storage["dark"]).toBe(true);
		expect(storage["_darkNeedsSystemTheme"]).toBeUndefined();
	});
});
