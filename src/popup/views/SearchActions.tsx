"use strict";

import * as React from "react";
import {maybePluralize} from "@helpers/utils";

export interface SearchActionsProps {
	layout: string;
	nextLayoutTitle: string;
	selectionSize: number;
	visibleCount: number;
	searchLen: number;
	filterTabs: boolean;
	dupTabs: boolean;
	onChangeLayout: () => void;
	onDeleteTabs: () => void;
	onDiscardTabs: () => void;
	onPinTabs: () => void;
	onToggleFilter: () => void;
	onAddWindow: () => void;
	onHighlightDuplicates: () => void;
	onCloseDuplicates: () => void;
	onMergeWindows: () => void;
	onSetCloseTimer: () => void;
	onRenameTab: () => void;
	canRename: boolean;
	onHoverIcon: (e: React.MouseEvent<HTMLDivElement> | string) => void;
}

// Action icon buttons of the search row, extracted from TabManager.render().
export class SearchActions extends React.Component<SearchActionsProps> {
	render() {
		const hasSelection = this.props.selectionSize > 0;
		return (
			<td className="two">
				<div
					className={"icon windowaction " + this.props.layout + "-view"}
					title={"Change to " + this.props.nextLayoutTitle + " View"}
					onClick={this.props.onChangeLayout}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div
					className="icon windowaction trash"
					title={
						hasSelection
							? "Close selected tabs\nWill close " + maybePluralize(this.props.selectionSize, 'tab')
							: "Close current Tab"
					}
					onClick={this.props.onDeleteTabs}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div
					className="icon windowaction discard"
					title={
						hasSelection
							? "Discard selected tabs\nWill discard " + maybePluralize(this.props.selectionSize, 'tab') + " - freeing memory"
							: "Select tabs to discard them and free memory"
					}
					style={
						hasSelection
							? {}
							: { opacity: 0.25 }
					}
					onClick={this.props.onDiscardTabs}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div
					className="icon windowaction pin"
					title={
						hasSelection
							? "Pin selected tabs\nWill pin " + maybePluralize(this.props.selectionSize, 'tab')
							: "Pin current Tab"
					}
					onClick={this.props.onPinTabs}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div
					className={"icon windowaction filter" + (this.props.filterTabs ? " enabled" : "")}
					title={
						(this.props.filterTabs ? "Turn off hiding of" : "Hide") +
						" tabs that do not match search" +
						(this.props.searchLen > 0
							? "\n" +
								(this.props.filterTabs ? "Will reveal " : "Will hide ") +
								maybePluralize(this.props.visibleCount, 'tab')
							: "")
					}
					onClick={this.props.onToggleFilter}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div
					className="icon windowaction new"
					title={
						hasSelection
							? "Move tabs to new window\nWill move " + maybePluralize(this.props.selectionSize, 'selected tab') + " to it"
							: "Open new empty window"
					}
					onClick={this.props.onAddWindow}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div
					className={"icon windowaction duplicates" + (this.props.dupTabs ? " enabled" : "")}
					title="Highlight Duplicates"
					onClick={this.props.onHighlightDuplicates}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div
					className="icon windowaction close-duplicates"
					title="Close duplicate tabs&#10;Keeps one tab per URL"
					onClick={this.props.onCloseDuplicates}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div
					className="icon windowaction emoji"
					title="Merge all windows&#10;Moves every tab into the most recently active window"
					onClick={this.props.onMergeWindows}
					onMouseEnter={this.props.onHoverIcon}
				>
					🗂
				</div>
				<div
					className="icon windowaction emoji"
					title="Auto-close timer&#10;Close the selected tabs after N minutes (0 clears timers)"
					onClick={this.props.onSetCloseTimer}
					onMouseEnter={this.props.onHoverIcon}
				>
					⏱
				</div>
				<div
					className="icon windowaction emoji"
					title={
						this.props.canRename
							? "Rename the selected tab"
							: "Select exactly one tab to rename it"
					}
					style={
						this.props.canRename
							? {}
							: { opacity: 0.25 }
					}
					onClick={this.props.onRenameTab}
					onMouseEnter={this.props.onHoverIcon}
				>
					✏️
				</div>
			</td>
		);
	}
}
