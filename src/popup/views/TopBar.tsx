"use strict";

import * as React from "react";
import {maybePluralize} from "@helpers/utils";

export interface TopBarProps {
	tabCount: number;
	windowCount: number;
	topText: string;
	bottomText: string;
	tip: string;
	onDonate: () => void;
	onRate: () => void;
	onToggleOptions: () => void;
	onHoverIcon: (e: React.MouseEvent<HTMLDivElement> | string) => void;
}

// Top header bar of the popup (donate/rate/options + status texts).
// Extracted from TabManager.render(). Note: the legacy topbox/topboxurl
// refs were write-only and are intentionally not carried over.
export class TopBar extends React.Component<TopBarProps> {
	render() {
		return (
			<div className="window top" ref="tophover">
				<div className="icon windowaction donate" title="Donate a Coffee" onClick={this.props.onDonate} onMouseEnter={this.props.onHoverIcon} />
				<div
					className="icon windowaction rate"
					title="Rate Tab Manager Plus"
					onClick={this.props.onRate}
					onMouseEnter={this.props.onHoverIcon}
				/>
				<div className="icon windowaction options" title="Options" onClick={this.props.onToggleOptions} onMouseEnter={this.props.onHoverIcon} />
				<input
					type="text"
					disabled={true}
					className="tabtitle"
					placeholder={maybePluralize(this.props.tabCount, 'tab') + " in " + maybePluralize(this.props.windowCount, 'window')}
					value={this.props.topText}
				/>
				<input type="text" disabled={true} className="taburl" placeholder={this.props.tip} value={this.props.bottomText} />
			</div>
		);
	}
}
