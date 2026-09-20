"use strict";

// Firefox Multi-Account Container support (visual awareness only).
// Chrome/Brave do not expose `tab.cookieStoreId`, so every tab there falls
// back to the default container and no UI is shown.

export const DEFAULT_CONTAINER_ID = "firefox-default";
export const PRIVATE_CONTAINER_ID = "firefox-private";
export const ALL_CONTAINERS = "all";

const DEFAULT_CONTAINER_COLORS : Record<string, string> = {
	[DEFAULT_CONTAINER_ID]: "#999999",
	[PRIVATE_CONTAINER_ID]: "#8000d7",
	"firefox-container-1": "#00a7e0",
	"firefox-container-2": "#f8682c",
	"firefox-container-3": "#ffcb00",
	"firefox-container-4": "#70e26c",
};

const FALLBACK_CONTAINER_COLORS = ["#00a7e0", "#f8682c", "#ffcb00", "#70e26c", "#e22850", "#8000d7", "#0090ed", "#7a6a44"];

export function normalizeContainerId(tab : {cookieStoreId?: string} | undefined) : string {
	const id = tab && tab.cookieStoreId;
	return id || DEFAULT_CONTAINER_ID;
}

export function getContainerColor(containerId : string, customColors? : Record<string, string>) : string {
	if (!!customColors && !!customColors[containerId]) return customColors[containerId];
	if (!!DEFAULT_CONTAINER_COLORS[containerId]) return DEFAULT_CONTAINER_COLORS[containerId];
	// Deterministic fallback color for unknown container ids
	let hash = 0;
	for (let i = 0; i < containerId.length; i++) {
		hash = (hash * 31 + containerId.charCodeAt(i)) | 0;
	}
	return FALLBACK_CONTAINER_COLORS[Math.abs(hash) % FALLBACK_CONTAINER_COLORS.length];
}

export function getContainerName(containerId : string) : string {
	if (containerId === DEFAULT_CONTAINER_ID) return "No Container";
	if (containerId === PRIVATE_CONTAINER_ID) return "Private";
	const match = containerId.match(/^firefox-container-(\d+)$/);
	if (!!match) return "Container " + match[1];
	return containerId;
}

export function collectContainerIds(tabs : Iterable<{cookieStoreId?: string}>) : string[] {
	const ids = new Set<string>();
	for (const tab of tabs) {
		ids.add(normalizeContainerId(tab));
	}
	const list = [...ids];
	// Default container first, then the rest alphabetically
	list.sort((a, b) => {
		if (a === DEFAULT_CONTAINER_ID) return -1;
		if (b === DEFAULT_CONTAINER_ID) return 1;
		return a < b ? -1 : 1;
	});
	return list;
}
