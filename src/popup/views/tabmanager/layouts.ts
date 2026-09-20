"use strict";

// Popup layout variants extracted from TabManager.
export type PopupLayout = "blocks" | "blocks-big" | "horizontal" | "vertical";

export function nextLayout(layout : string) : string {
	switch (layout) {
		case "blocks":
			return "blocks-big";
		case "blocks-big":
			return "horizontal";
		case "horizontal":
			return "vertical";
		default:
			return "blocks";
	}
}

export function readableLayout(layout : string) : string {
	switch (layout) {
		case "blocks":
			return "Block";
		case "blocks-big":
			return "Big Block";
		case "horizontal":
			return "Horizontal";
		default:
			return "Vertical";
	}
}
