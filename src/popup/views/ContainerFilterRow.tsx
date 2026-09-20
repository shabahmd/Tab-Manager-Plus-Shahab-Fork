"use strict";

import * as React from "react";
import {getContainerColor, getContainerName, ALL_CONTAINERS} from "@helpers/containers";

export interface ContainerFilterRowProps {
	containerIds: string[];
	containerFilter: string;
	containerColors: Record<string, string>;
	onChangeFilter: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	onChangeColor: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Firefox container filter dropdown with per-container color picker.
// Only rendered when tabs span multiple containers.
// Extracted from TabManager.render().
export class ContainerFilterRow extends React.Component<ContainerFilterRowProps> {
	render() {
		if (this.props.containerIds.length <= 1) return null;
		return (
			<div className="container-filter-row">
				<select
					className="container-filter"
					title="Filter by Firefox container"
					value={this.props.containerFilter}
					onChange={this.props.onChangeFilter}
				>
					<option value={ALL_CONTAINERS}>All containers</option>
					{this.props.containerIds.map((id) => (
						<option key={id} value={id}>{getContainerName(id)}</option>
					))}
				</select>
				{this.props.containerFilter !== ALL_CONTAINERS && (
					<input
						type="color"
						className="container-color"
						title="Container color"
						value={getContainerColor(this.props.containerFilter, this.props.containerColors)}
						onChange={this.props.onChangeColor}
					/>
				)}
			</div>
		);
	}
}
