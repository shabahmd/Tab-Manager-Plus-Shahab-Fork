"use strict";

import * as React from "react";
import * as browser from 'webextension-polyfill';
import {Window} from "./Window";

export interface WindowListProps {
	windows: browser.Windows.Window[];
	colorsActive: number;
	layout: string;
	selection: Set<number>;
	searchLen: number;
	searchQuery?: string;
	sessionsFeature?: boolean;
	tabactions: boolean;
	hiddenTabs: Set<number>;
	filterTabs: boolean;
	containerFilter?: string;
	containerColors?: Record<string, string>;
	tabNames?: Record<string, string>;
	windowTitles: boolean;
	lastOpenWindow: number;
	onHoverTab: (tab: browser.Tabs.Tab) => void;
	onScrollTo: (what: string, id: number) => void;
	onHoverIcon: (e: React.MouseEvent<HTMLDivElement> | string) => void;
	onParentUpdate: () => void;
	onToggleColors: (active: boolean, windowId: number) => void;
	onTabMiddleClick: (tabId: number) => void;
	onSelect: (id: number) => void;
	onSelectTo: (id: number, tabs: browser.Tabs.Tab[]) => void;
	onDrag: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
	onDrop: (id: number, before: boolean) => void;
	onDropWindow: (windowId: number) => void;
	onDragFavicon: (icon: string) => string;
	registerWindowRef: (windowId: number, instance: Window | null) => void;
}

// Live browser windows (active first, minimized after their own header).
// Extracted from TabManager.render(). Window instances are registered
// through a callback-ref map owned by TabManager.
export class WindowList extends React.Component<WindowListProps> {
	render() {
		const props = this.props;
		const haveMin = props.windows.some((window) => window.state === "minimized");
		return (
			<>
				{props.windows.map((window : browser.Windows.Window) => {
					if (window.state === "minimized") return;
					if (!!props.colorsActive && props.colorsActive !== window.id) return;
					return (
						<Window
							key={"window" + window.id}
							window={window}
							tabs={window.tabs}
							incognito={window.incognito}
							layout={props.layout}
							selection={props.selection}
							searchActive={props.searchLen > 0}
							sessionsFeature={props.sessionsFeature}
							tabactions={props.tabactions}
							hiddenTabs={props.hiddenTabs}
							filterTabs={props.filterTabs}
							containerFilter={props.containerFilter}
							containerColors={props.containerColors}
							tabNames={props.tabNames}
							hoverHandler={props.onHoverTab}
							scrollTo={props.onScrollTo}
							hoverIcon={props.onHoverIcon}
							parentUpdate={props.onParentUpdate}
							toggleColors={props.onToggleColors}
							tabMiddleClick={props.onTabMiddleClick}
							select={props.onSelect}
							selectTo={props.onSelectTo}
							draggable={true}
							drag={props.onDrag}
							drop={props.onDrop}
							dropWindow={props.onDropWindow}
							windowTitles={props.windowTitles}
							lastOpenWindow={props.lastOpenWindow}
							dragFavicon={props.onDragFavicon}
							ref={(instance) => props.registerWindowRef(window.id as number, instance)}
						/>
					);
				})}
				<div className={"hrCont " + (!haveMin ? "hidden" : "")}>
					<div className="hrDiv">
						<span className="hrSpan">Minimized windows</span>
					</div>
				</div>
				{props.windows.map((window) => {
					if (window.state !== "minimized") return;
					if (!!props.colorsActive && props.colorsActive !== window.id) return;
					return (
						<Window
							key={"window" + window.id}
							window={window}
							tabs={window.tabs}
							incognito={window.incognito}
							layout={props.layout}
							selection={props.selection}
							searchActive={props.searchLen > 0}
							searchQuery={props.searchQuery}
							sessionsFeature={props.sessionsFeature}
							tabactions={props.tabactions}
							hiddenTabs={props.hiddenTabs}
							filterTabs={props.filterTabs}
							containerFilter={props.containerFilter}
							containerColors={props.containerColors}
							tabNames={props.tabNames}
							hoverHandler={props.onHoverTab}
							scrollTo={props.onScrollTo}
							hoverIcon={props.onHoverIcon}
							parentUpdate={props.onParentUpdate}
							toggleColors={props.onToggleColors}
							tabMiddleClick={props.onTabMiddleClick}
							select={props.onSelect}
							selectTo={props.onSelectTo}
							draggable={true}
							drag={props.onDrag}
							drop={props.onDrop}
							dropWindow={props.onDropWindow}
							windowTitles={props.windowTitles}
							lastOpenWindow={props.lastOpenWindow}
							dragFavicon={props.onDragFavicon}
							ref={(instance) => props.registerWindowRef(window.id as number, instance)}
						/>
					);
				})}
			</>
		);
	}
}
