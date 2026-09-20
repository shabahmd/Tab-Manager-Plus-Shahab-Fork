"use strict";

import * as React from "react";

export interface SelectionBadgeProps {
	count: number;
}

// Floating badge showing how many tabs are currently selected.
// Extracted from TabManager.render().
export class SelectionBadge extends React.Component<SelectionBadgeProps> {
	render() {
		const count = this.props.count;
		if (count <= 0) return null;
		return (
			<div className="selection-badge" style={{
				position: "fixed",
				top: "10px",
				left: "10px",
				backgroundColor: "#4285f4",
				color: "white",
				padding: "4px 12px",
				borderRadius: "12px",
				fontSize: "13px",
				zIndex: "99999",
				pointerEvents: "none",
			}}>
				{count} tab{count !== 1 ? "s" : ""} selected
			</div>
		);
	}
}
