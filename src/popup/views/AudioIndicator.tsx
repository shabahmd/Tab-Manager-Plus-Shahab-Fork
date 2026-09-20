import * as React from "react";
import {useTabManagerUI} from "@store/useTabManagerUI";
import * as S from "@strings";
import * as browser from 'webextension-polyfill';
import {ICommand} from "@types";

export function AudioIndicator({tab}: {tab: browser.Tabs.Tab & {mutedInfo?: {muted: boolean}}}) {
	if (!tab.audible) return null;
	return (
		<span
			className="audio-indicator"
			title="Playing audio - click to mute"
			style={{
				display: "inline-block",
				marginLeft: "4px",
				cursor: "pointer",
				fontSize: "14px",
				animation: tab.audible ? "pulse 1s infinite" : "none",
			}}
			onClick={(e) => {
				e.stopPropagation();
				// Mute via background script
				browser.runtime.sendMessage<ICommand>({
					command: S.mute_tab,
					tabId: tab.id,
					muted: tab.mutedInfo?.muted || false,
				}).catch(() => {});
			}}
		>
			🔊
		</span>
	);
}
