"use strict";

// Popup option defaults extracted from TabManager.loadStorage().
// Fills missing storage keys with defaults (mutating the passed object,
// as before) and returns the values as a typed bag.
export interface PopupOptionValues {
	layout: string;
	animations: boolean;
	windowTitles: boolean;
	compact: boolean;
	dark: boolean;
	tabactions: boolean;
	badge: boolean;
	sessionsFeature: boolean;
	hideWindows: boolean;
	filterTabs: boolean;
	enterToFocus: boolean;
	orderByTabCount: boolean;
	disableResorting: boolean;
	tabLimit: number;
	openInOwnTab: boolean;
	tabWidth: number;
	tabHeight: number;
	containerColors: Record<string, string>;
}

export function isSystemDark() : boolean {
	return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export function applyPopupOptionDefaults(storage : Record<string, any>) : PopupOptionValues {
	if (!storage["layout"]) storage["layout"] = "blocks";
	if (typeof storage["tabLimit"] === "undefined") storage["tabLimit"] = 0;
	if (typeof storage["tabWidth"] === "undefined") storage["tabWidth"] = 800;
	if (typeof storage["tabHeight"] === "undefined") storage["tabHeight"] = 600;

	if (typeof storage["animations"] === "undefined") storage["animations"] = true;
	if (typeof storage["windowTitles"] === "undefined") storage["windowTitles"] = true;
	if (typeof storage["tabactions"] === "undefined") storage["tabactions"] = true;
	if (typeof storage["badge"] === "undefined") storage["badge"] = true;

	if (typeof storage["openInOwnTab"] === "undefined") storage["openInOwnTab"] = false;
	if (typeof storage["compact"] === "undefined") storage["compact"] = false;
	// When no stored preference exists, derive the theme from the OS without
	// writing a "dark" key into the storage bag, so the theme keeps tracking
	// system changes instead of being pinned on first launch.
	let darkValue : boolean;
	if (typeof storage["dark"] === "undefined") {
		storage["_darkNeedsSystemTheme"] = true;
		darkValue = isSystemDark();
	} else {
		darkValue = storage["dark"] as boolean;
	}
	if (typeof storage["sessionsFeature"] === "undefined") storage["sessionsFeature"] = false;
	if (typeof storage["hideWindows"] === "undefined") storage["hideWindows"] = false;
	if (typeof storage["filter-tabs"] === "undefined") storage["filter-tabs"] = false;
	if (typeof storage["enterToFocus"] === "undefined") storage["enterToFocus"] = false;
	if (typeof storage["orderByTabCount"] === "undefined") storage["orderByTabCount"] = false;
	if (typeof storage["disableResorting"] === "undefined") storage["disableResorting"] = false;
	if (typeof storage["containerColors"] === "undefined") storage["containerColors"] = {};

	return {
		layout: storage["layout"] as string,
		tabLimit: storage["tabLimit"] as number,
		tabWidth: storage["tabWidth"] as number,
		tabHeight: storage["tabHeight"] as number,
		openInOwnTab: storage["openInOwnTab"] as boolean,
		animations: storage["animations"] as boolean,
		windowTitles: storage["windowTitles"] as boolean,
		compact: storage["compact"] as boolean,
		dark: darkValue,
		tabactions: storage["tabactions"] as boolean,
		badge: storage["badge"] as boolean,
		sessionsFeature: storage["sessionsFeature"] as boolean,
		hideWindows: storage["hideWindows"] as boolean,
		filterTabs: storage["filter-tabs"] as boolean,
		enterToFocus: storage["enterToFocus"] as boolean,
		orderByTabCount: storage["orderByTabCount"] as boolean,
		disableResorting: storage["disableResorting"] as boolean,
		containerColors: storage["containerColors"] as Record<string, string> || {},
	};
}
