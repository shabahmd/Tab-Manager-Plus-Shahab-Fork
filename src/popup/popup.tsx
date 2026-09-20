"use strict";

import {getLocalStorage} from "@helpers/storage";
import {debugLog} from "@helpers/debug";
import {TabManager} from '@views';
import {ErrorBoundary} from "@ErrorBoundary";
import * as React from 'react';
import {createRoot} from "react-dom/client";
import * as LegacyReactDOM from "react-dom";

declare global {
	interface Window {
		loaded: boolean;
		inPopup: boolean;
		inPanel: boolean;
		optionPage: boolean;
		extensionVersion: string;
	}
}

window.loaded = false;
window.inPopup = window.location.search.indexOf("?popup") > -1;
window.inPanel = window.location.search.indexOf("?panel") > -1;
window.extensionVersion = process.env.VERSION;

const MAX_RETRIES = 14;
const RETRY_INTERVAL = 75;

window.onload = () => window.requestAnimationFrame(loadApp);

setTimeout(loadApp, RETRY_INTERVAL);
setTimeout(loadApp, RETRY_INTERVAL * 2);
setTimeout(loadApp, RETRY_INTERVAL * 4);
setTimeout(loadApp, RETRY_INTERVAL * 6);
setTimeout(loadApp, RETRY_INTERVAL * 10);
setTimeout(loadApp, RETRY_INTERVAL * 14);
setTimeout(loadApp, RETRY_INTERVAL * 20);
setTimeout(loadApp, RETRY_INTERVAL * 40);
setTimeout(loadApp, RETRY_INTERVAL * 80);
setTimeout(loadApp, RETRY_INTERVAL * 160);
setTimeout(loadApp, RETRY_INTERVAL * 320);
setTimeout(loadApp, RETRY_INTERVAL * 640);
setTimeout(loadApp, RETRY_INTERVAL * 1280);
setTimeout(loadApp, RETRY_INTERVAL * 2560);

let retryCount = 0;

function mountApp() {
	const container = document.getElementById("TMP");
	if (!container) throw new Error("TMP container not found");
	const app = <ErrorBoundary><TabManager optionsActive={!!window.optionPage}/></ErrorBoundary>;
	try {
		createRoot(container).render(app);
	} catch (e) {
		// Fallback for older Chromium builds (e.g. Brave releases behind
		// upstream) where react-dom/client entry may be unavailable.
		const legacyRender = (LegacyReactDOM as any).render;
		if (typeof legacyRender !== "function") throw e;
		legacyRender.call(LegacyReactDOM, app, container);
	}
}

function showLoadError() {
	try {
		const container = document.getElementById("TMP");
		// React replaces the placeholder once mounted (TabManager renders #root).
		if (container && !container.querySelector("#root")) {
			container.textContent = "Tab Manager Pro could not load. Please close and reopen.";
		}
	} catch (e) {
		// ignore - nothing left to do
	}
}

async function loadApp() {
	if (!!window.loaded) return;
	if (retryCount >= MAX_RETRIES) {
		showLoadError();
		return;
	}
	retryCount++;

	let height : number = 600;
	let width : number = 800;
	try {
		height = await getLocalStorage("tabHeight", 600);
		width = await getLocalStorage("tabWidth", 800);
	} catch (e) {
		debugLog("loadApp storage unavailable, using defaults:", e);
	}
	debugLog(height, width);
		if (window.inPopup) {

			if (height > 0 && width > 0) {
				document.body.style.width = width + "px";
				document.body.style.height = height + "px";
			}

			var root = document.getElementById("root");
			if (root != null) {
				var _height = parseInt(document.body.style.height.split("px")[0]) || 0;
				if (_height < 300) {
					_height = 400;
					document.body.style.minHeight = _height + "px";
				} else {
					_height++;
					if (_height > 600) _height = 600;
					document.body.style.minHeight = _height + "px";
				}
			}
		} else {
			if (window.inPanel) {
				document.documentElement.style.maxHeight = "auto";
				document.documentElement.style.maxWidth = "auto";
				document.body.style.maxHeight = "auto";
				document.body.style.maxWidth = "auto";
			}
			document.documentElement.style.maxHeight = "100%";
			document.documentElement.style.maxWidth = "100%";
			document.documentElement.style.height = "100%";
			document.documentElement.style.width = "100%";
			document.body.style.maxHeight = "100%";
			document.body.style.maxWidth = "100%";
			document.body.style.height = "100%";
			document.body.style.width = "100%";
		}

		if (!!window.loaded) return;
		try {
			mountApp();
		} catch (e) {
			debugLog("loadApp attempt " + retryCount + " failed:", e);
			return;
		}
		window.loaded = true;
}

window.addEventListener("contextmenu", function (e) {
	e.preventDefault();
});
