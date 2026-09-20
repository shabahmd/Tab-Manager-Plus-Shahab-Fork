"use strict";

import {ITabManagerState, ISavedSession} from "@types";
import * as React from "react";
import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {debugError} from "@helpers/debug";

export interface SessionHost {
	state: ITabManagerState;
	setState(state: any): void;
	forceUpdate(): void;
	update(): void | Promise<void>;
	sessionSync(): void | Promise<void>;
}

export async function syncSessions(host: SessionHost): Promise<void> {
	const values = await getLocalStorage('sessions', {});
	//console.log(values);
	const sessions : ISavedSession[] = [];
	for (const key in values) {
		const sess = values[key];
		if (sess.id && sess.tabs && sess.windowsInfo) {
			sessions.push(sess);
		}
	}
	host.setState({
		sessions: sessions
	});
	await host.update();
}

export async function toggleSessionsFeature(host: SessionHost): Promise<void> {
	const _sessionsFeature = !host.state.sessionsFeature;
	host.setState({sessionsFeature: _sessionsFeature});
	await setLocalStorage("sessionsFeature", _sessionsFeature);
	sessionsFeatureHelperText(host);
	host.forceUpdate();
}

export function sessionsFeatureHelperText(host: SessionHost): void {
	host.setState({
		bottomText: "Allows you to save/restore windows into sessions. ( Tab History will be lost ) Default : off"
	});
}

export function exportSessionsFile(host: SessionHost): void {
	if (host.state.sessions.length === 0) {
		window.alert("You have currently no windows saved for later. There is nothing to export.");
		return;
	}
	let exportName = "tab-manager-pro-backup";
	const today = new Date();
	const y = today.getFullYear();
	// JavaScript months are 0-based.
	const m = ("0" + (today.getMonth() + 1)).slice(-2);
	const d = ("0" + today.getDate()).slice(-2);
	const h = ("0" + today.getHours()).slice(-2);
	const mi = ("0" + today.getMinutes()).slice(-2);
	const s = ("0" + today.getSeconds()).slice(-2);
	exportName += "-" + y + m + d + "-" + h + mi + "-" + s;
	const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(host.state.sessions, null, 2));
	const downloadAnchorNode = document.createElement("a");
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute("download", exportName + ".json");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
	exportSessionsHelperText(host);
	host.forceUpdate();
}

export function exportSessionsHelperText(host: SessionHost): void {
	host.setState({
		bottomText: "Allows you to export your saved windows to an external backup"
	});
}

export function importSessionsFile(host: SessionHost, evt : React.ChangeEvent<HTMLInputElement>): void {
	if (navigator.userAgent.search("Firefox") > -1) {
		if(window.inPopup) {
			window.alert("Due to a Firefox bug session import does not work in the popup. Please use the options screen or open Tab Manager Pro in its' own tab");
			return;
		}
	}
	try {
		const inputField = evt.target; // #session_import
		const files = evt.target.files;
		if (!files.length) {
			alert("No file selected!");
			host.setState({ bottomText: "Error: Could not read the backup file!" });
			return;
		}
		const file = files[0];
		const reader = new FileReader();

		reader.onload = async event => {
			//console.log('FILE CONTENT', event.target.result);
			let backupFile;
			try {
				backupFile = JSON.parse(event.target.result.toString());
			} catch (err) {
				debugError(err);
				window.alert(err);
				host.setState({ bottomText: "Error: Could not read the backup file!" });
			}
			if (!!backupFile && backupFile.length > 0) {
				let success = backupFile.length;
				for (let i = 0; i < backupFile.length; i++) {
					const newSession = backupFile[i];
					if (newSession.windowsInfo && newSession.tabs && newSession.id) {
						const sessions = await getLocalStorage('sessions', {});
						sessions[newSession.id] = newSession;
						//this.state.sessions.push(obj);

						await setLocalStorage('sessions', sessions).catch(function(err) {
							debugError(err);
							debugError(err.message);
							success--;
						});
						//console.log(value);
					}
				}
				host.setState({ bottomText: success + " windows successfully restored!" });
			} else {
				host.setState({ bottomText: "Error: Could not restore any windows from the backup file!" });
			}
			inputField.value = "";
			host.sessionSync();
		};
		reader.readAsText(file);
	} catch (err) {
		debugError(err);
		window.alert(err);
	}
	importSessionsHelperText(host);
	host.forceUpdate();
}

export function importSessionsHelperText(host: SessionHost): void {
	host.setState({
		bottomText: "Allows you to restore your saved windows from an external backup"
	});
}
