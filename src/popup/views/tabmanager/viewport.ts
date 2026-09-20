"use strict";

import {ITabManagerState} from "@types";

export interface ViewportHost {
	state: ITabManagerState;
	refs: any;
	setState(state: any): void;
	forceUpdate(): void;
}

export function scrollToElement(host: ViewportHost, what : string, id : number): void {
	var els = document.getElementById(what + "-" + id);
	if (!!els) {
		if (!isElementVisible(els)) {
			els.scrollIntoView({ behavior: host.state.animations ? "smooth" : "instant", block: "center", inline: "nearest" });
		}
	}
}

export function isElementVisible(elem : HTMLElement): boolean {
	if (!(elem instanceof Element)) throw Error("DomUtil: elem is not an element.");
	var style = getComputedStyle(elem);
	if (style.display === "none") return false;
	if (style.visibility !== "visible") return false;
	let _opacity : number = parseFloat(style.opacity);
	if (_opacity < 0.1) return false;
	if (elem.offsetWidth + elem.offsetHeight + elem.getBoundingClientRect().height + elem.getBoundingClientRect().width === 0) {
		return false;
	}
	var elemCenter = {
		x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
		y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
	};

	if (elemCenter.x < 0) return false;
	if (elemCenter.x > (document.documentElement.clientWidth || window.innerWidth)) return false;
	if (elemCenter.y < 0) return false;
	if (elemCenter.y > (document.documentElement.clientHeight || window.innerHeight)) return false;
	var pointContainer : ParentNode = document.elementFromPoint(elemCenter.x, elemCenter.y);
	do {
		if (pointContainer === elem) return true;
	} while ((pointContainer = pointContainer.parentNode))
	return false;
}

export function focusRootView(host: ViewportHost): void {
	host.setState({ focusUpdates: (host.state.focusUpdates + 1) });
	setTimeout(
		function() {
			if (document.activeElement === document.body) {
				host.refs.root?.focus();
				host.forceUpdate();
				if (host.state.focusUpdates < 5) focusRootView(host);
			}
		}.bind(host),
		500
	);
}

export function scrollActiveTabIntoView(animations: boolean): void {
	setTimeout(async function() {
		var scrollArea = document.getElementsByClassName("window-container")[0];
		var activeWindow = document.getElementsByClassName("activeWindow");
		if (!!activeWindow && activeWindow.length > 0) {
			var activeTab = activeWindow[0].getElementsByClassName("highlighted");
			if (!!activeTab && activeTab.length > 0) {
				if (!!scrollArea && scrollArea.scrollTop > 0) {
				} else {
					activeTab[0].scrollIntoView({ behavior: animations ? "smooth" : "instant", block: "center", inline: "nearest" });
				}
			}
		}
	}, 250);
}
