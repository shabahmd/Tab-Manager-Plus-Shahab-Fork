"use strict";

import * as S from "@strings";
import * as React from "react";
import * as browser from 'webextension-polyfill';
import {ICommand, ITab, ITabState} from '@types';
import {debugLog} from "@helpers/debug";
import {AudioIndicator} from "./AudioIndicator";
import {normalizeContainerId, getContainerColor, getContainerName, DEFAULT_CONTAINER_ID} from "@helpers/containers";
import {displayTabTitle} from "./tabmanager/tabNames";

export class Tab extends React.Component<ITab, ITabState> {
	constructor(props : ITab) {
		super(props);
		this.state = {
			favIcon: "",
			dragFavIcon: "",
			draggingOver: "",
			hovered: false,
			tabRef: React.createRef()
		};

		this.onHover = this.onHover.bind(this);
		this.onHoverOut = this.onHoverOut.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.click = this.click.bind(this);
		this.dragStart = this.dragStart.bind(this);
		this.dragOver = this.dragOver.bind(this);
		this.dragOut = this.dragOut.bind(this);
		this.drop = this.drop.bind(this);
		this.resolveFavIconUrl = this.resolveFavIconUrl.bind(this);
		this.checkSettings = this.checkSettings.bind(this);
	}

	async componentDidMount() {
		await this.checkSettings();
	}

	async checkSettings() {
		await this.resolveFavIconUrl();
	}

	render() {
		const children = [];
		if (this.props.layout === "vertical") {
			children.push(
				<div key={"tab-pinned-" + this.props.tab.id} className={"tab-pinned " + (!this.props.tab.pinned ? "hidden" : "")}>
					Pinned
				</div>
			);
			children.push(
				<div key={"tab-highlighted-" + this.props.tab.id} className={"tab-highlighted " + (!this.props.tab.highlighted ? "hidden" : "")}>
					Active
				</div>
			);
			children.push(
				<div key={"tab-selected-" + this.props.tab.id} className={"tab-selected " + (!this.props.selected ? "hidden" : "")}>
					Selected
				</div>
			);
			children.push(
				<div
					key={"tab-icon-" + this.props.tab.id}
					className="iconoverlay "
					style={{
						backgroundImage: this.state.favIcon ? "url(" + this.state.favIcon + ")" : ""
					}}
				/>
			);
			children.push(
				<div key={"tab-title-" + this.props.tab.id} className="tabtitle">
					{this.highlightSearchText(displayTabTitle(this.props.tab, this.props.tabNames) || "", this.props.searchQuery || "")}
				</div>
			);
		}

		const tabDom = {
			className:
				"icon tab " +
				(this.props.selected ? "selected " : "") +
				(this.props.tab.pinned ? "pinned " : "") +
				(this.props.tab.highlighted ? "highlighted " : "") +
				(this.props.hidden ? "hidden " : "") +
				((this.props.tab.mutedInfo && this.props.tab.mutedInfo.muted) ? "muted " : "") +
				(this.props.tab.audible ? "audible " : "") +
				(this.props.tab.discarded ? "discarded " : "") +
				(this.props.layout === "vertical" ? "full " : "") +
				(this.props.tab.incognito ? "incognito " : "") +
				(this.state.draggingOver) +
				(this.props.searchActive ? "search-active " : "") +
				" tab-" +
				this.props.tab.id +
				" " +
				(this.props.layout === "vertical" ? "vertical " : "blocks "),
			style:
				(this.props.layout === "vertical"
					? { }
					: { backgroundImage: this.state.favIcon ? "url(" + this.state.favIcon + ")" : "" }
				)
			,
			id: this.props.id,
			title: displayTabTitle(this.props.tab, this.props.tabNames),
			onClick: this.click,
			onMouseDown: this.onMouseDown,
			onMouseEnter: this.onHover,
			onMouseOut: this.onHoverOut,
			ref: this.state.tabRef
		};

		if (this.props.draggable) {
			tabDom["onDragStart"] = this.dragStart;
			tabDom["onDragOver"] = this.dragOver;
			tabDom["onDragLeave"] = this.dragOut;
			tabDom["onDrop"] = this.drop;
			tabDom["draggable"] = "true";
		}

		const containerId = normalizeContainerId(this.props.tab);
		const showContainer = containerId !== DEFAULT_CONTAINER_ID;

		return (
			<div {...tabDom}>
				{children}
				{showContainer && (
					<div
						className="container-stripe"
						title={getContainerName(containerId)}
						style={{backgroundColor: getContainerColor(containerId, this.props.containerColors)}}
					/>
				)}
				<div className="limiter" />
				<AudioIndicator tab={this.props.tab} />
			</div>
		);
	}
	onHover(e) {
		this.setState({hovered: true});
		this.props.hoverHandler(this.props.tab);
	}
	onHoverOut(e) {
		this.setState({hovered: false});
	}
	async onMouseDown(e : React.MouseEvent<HTMLDivElement>) {
		if (e.button === 0) return;
		if (!this.props.draggable) return;
		await this.click(e);
	}
	async click(e : React.MouseEvent<HTMLDivElement>) {
		this.stopProp(e);

		const tabId : number = this.props.tab.id;

		if (e.button === 1) {
			this.props.middleClick(tabId);
		} else if (e.button === 2 || e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey) {
			e.preventDefault();
			if (e.button === 2 && (e.nativeEvent.metaKey || e.nativeEvent.altKey || e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)) {
				this.props.selectTo(tabId);
			} else {
				this.props.select(tabId);
			}
		} else {
			if (this.props.click) {
				this.props.click(e, this.props.tab.id);
			} else {
				const windowId = this.props.window.id;

				if (navigator.userAgent.search("Firefox") > -1) {
					browser.runtime.sendMessage<ICommand>({
						command: S.focus_on_tab_and_window_delayed,
						saved_tab: {tabId: tabId, windowId: windowId}
					});
				} else {
					browser.runtime.sendMessage<ICommand>({
						command: S.focus_on_tab_and_window,
						saved_tab: {tabId: tabId, windowId: windowId}
					});
				}
			}

			if (window.inPopup) window.close();
		}
		return false;
	}
	dragStart(e : React.DragEvent<HTMLDivElement>) {
		if (!this.props.draggable) return false;
		if (!this.props.drag) return false;

		this.setState({
			dragFavIcon: ""
		});
		this.props.dragFavicon(this.state.favIcon);
		e.dataTransfer.setData("Text", this.props.tab.id.toString());
		e.dataTransfer.setData("text/uri-list", this.props.tab.url || "");
		this.props.drag(e, this.props.tab.id);
	}
	dragOver(e : React.DragEvent<HTMLDivElement>) {
		if (!this.props.draggable) return false;
		if (!this.props.drag) return false;

		const favicon = this.props.dragFavicon();
		let draggingover;

		const before = this.state.draggingOver;
		if (this.props.layout === "vertical") {
			draggingover = e.nativeEvent.offsetY > this.state.tabRef.current.clientHeight / 2 ? "bottom" : "top";
		} else {
			draggingover = e.nativeEvent.offsetX > this.state.tabRef.current.clientWidth / 2 ? "right" : "left";
		}

		this.setState({
			draggingOver: draggingover,
			dragFavIcon: favicon
		});

		if (before !== this.state.draggingOver) {
			this.forceUpdate();
			this.props.parentUpdate();
		}
	}
	dragOut() {
		if (!this.props.draggable) return false;
		if (!this.props.drag) return;

		this.setState({
			dragFavIcon: "",
			draggingOver: ""
		});
		this.forceUpdate();
		this.props.parentUpdate();
	}
	drop(e : React.DragEvent<HTMLDivElement>) {
		if (!this.props.draggable) return false;
		if (!this.props.drag) return false;
		if (!this.props.drop) return;

		this.stopProp(e);

		const before = this.state.draggingOver === "top" || this.state.draggingOver === "left";

		this.setState({
			draggingOver: "",
			dragFavIcon: ""
		});

		this.props.drop(this.props.tab.id, before);
		this.forceUpdate();
		this.props.parentUpdate();
	}
	async resolveFavIconUrl() {
		let image : string;
		// firefox screenshots; needs <all_urls>
		// if(!!browser.tabs.captureTab) {
		// 	console.log("tabs captureTab");
		// 	image = await browser.tabs.captureTab(this.props.tab.id);
		// 	image = "url(" + image + ")";
		// }else

		const _url : string = this.props.tab.url || this.props.tab.pendingUrl || "";

		if (!!_url && navigator.userAgent.search("Firefox") === -1) {
			image = "chrome-extension://" + chrome.runtime.id + "/_favicon/?pageUrl=" + encodeURIComponent(_url) + "&size=64"; // &" + Date.now();			} else if (!!_url && _url.indexOf("chrome://") !== 0 && _url.indexOf("about:") !== 0) {
				image = this.props.tab.favIconUrl ? "" + this.props.tab.favIconUrl + "" : "";
			} else {
			const favIcons = ["bookmarks", "chrome", "crashes", "downloads", "extensions", "flags", "history", "settings"];
			const iconUrl = _url;
			if (iconUrl.length > 9) {
				const iconName = iconUrl.slice(9).match(/^\w+/g);
				debugLog(iconName);
				image = !iconName || favIcons.indexOf(iconName[0]) < 0 ? "" : "../images/chrome/" + iconName[0] + ".png";
			}
		}
		this.setState({
			favIcon: image
		});
	}
	stopProp(e) {
		if(e && e.nativeEvent) {
			e.nativeEvent.preventDefault();
			e.nativeEvent.stopPropagation();
		}
		if(e && e.preventDefault) {
			e.preventDefault();
			e.stopPropagation();
		}
	}
	highlightSearchText(text: string, query: string): React.ReactNode {
		if (!query) return text;
		const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`(${escaped})`, 'gi');
		const parts = text.split(regex);
		return parts.map((part, i) =>
			regex.test(part)
				? <mark key={i} className="search-highlight">{part}</mark>
				: <span key={i}>{part}</span>
		);
	}
}
