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
	let values = await getLocalStorage('sessions', {});
	//console.log(values);
	let sessions : ISavedSession[] = [];
	for (let key in values) {
		let sess = values[key];
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
	var _sessionsFeature = !host.state.sessionsFeature;
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
	var exportName = "tab-manager-plus-backup";
	var today = new Date();
	var y = today.getFullYear();
	// JavaScript months are 0-based.
	var m = ("0" + (today.getMonth() + 1)).slice(-2);
	var d = ("0" + today.getDate()).slice(-2);
	var h = ("0" + today.getHours()).slice(-2);
	var mi = ("0" + today.getMinutes()).slice(-2);
	var s = ("0" + today.getSeconds()).slice(-2);
	exportName += "-" + y + m + d + "-" + h + mi + "-" + s;
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(host.state.sessions, null, 2));
	var downloadAnchorNode = document.createElement("a");
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
			window.alert("Due to a Firefox bug session import does not work in the popup. Please use the options screen or open Tab Manager Plus in its' own tab");
			return;
		}
	}
	try {
		let inputField = evt.target; // #session_import
		let files = evt.target.files;
		if (!files.length) {
			alert("No file selected!");
			host.setState({ bottomText: "Error: Could not read the backup file!" });
			return;
		}
		let file = files[0];
		let reader = new FileReader();

		reader.onload = async event => {
			//console.log('FILE CONTENT', event.target.result);
			var backupFile;
			try {
				backupFile = JSON.parse(event.target.result.toString());
			} catch (err) {
				debugError(err);
				window.alert(err);
				host.setState({ bottomText: "Error: Could not read the backup file!" });
			}
			if (!!backupFile && backupFile.length > 0) {
				var success = backupFile.length;
				for (let i = 0; i < backupFile.length; i++) {
					var newSession = backupFile[i];
					if (newSession.windowsInfo && newSession.tabs && newSession.id) {
						let sessions = await getLocalStorage('sessions', {});
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
