"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import {ISavedSession} from "@types";
import {Session} from "./Session";

export interface SessionListProps {
	sessions: ISavedSession[];
	visible: boolean;
	colorsActive: number;
	layout: string;
	selection: Set<number>;
	searchActive: boolean;
	searchQuery?: string;
	tabactions: boolean;
	hiddenTabs: Set<number>;
	filterTabs: boolean;
	windowTitles: boolean;
	lastOpenWindow: number;
	onHoverTab: (tab: browser.Tabs.Tab) => void;
	onScrollTo: (what: string, id: number) => void;
	onHoverIcon: (e: React.MouseEvent<HTMLDivElement> | string) => void;
	onParentUpdate: () => void;
	onToggleColors: (active: boolean, windowId: number) => void;
	onTabMiddleClick: (tabId: number) => void;
	onSelect: (id: number) => void;
}

// Saved session windows extracted from TabManager.render().
export class SessionList extends React.Component<SessionListProps> {
	render() {
		const props = this.props;
		return (
			<>
				<div className={"hrCont " + (!props.visible ? "hidden" : "")}>
					<div className="hrDiv">
						<span className="hrSpan">Saved windows</span>
					</div>
				</div>
				{props.visible
					? props.sessions.map((window : ISavedSession) => {
							if (!!props.colorsActive && props.colorsActive !== Number(window.id)) return;
							return (
								<Session
									key={"session" + window.id}
									session={window}
									tabs={window.tabs}
									incognito={window.incognito}
									layout={props.layout}
									selection={props.selection}
									searchActive={props.searchActive}
									searchQuery={props.searchQuery}
									tabactions={props.tabactions}
									hiddenTabs={props.hiddenTabs}
									filterTabs={props.filterTabs}
									hoverHandler={props.onHoverTab}
									scrollTo={props.onScrollTo}
									hoverIcon={props.onHoverIcon}
									parentUpdate={props.onParentUpdate}
									toggleColors={props.onToggleColors}
									tabMiddleClick={props.onTabMiddleClick}
									select={props.onSelect}
									windowTitles={props.windowTitles}
									lastOpenWindow={props.lastOpenWindow}
									draggable={false}
								/>
							);
						})
					: false}
			</>
		);
	}
}
