"use strict";

import * as React from "react";
import {ITabManagerState} from "@types";
import {setLocalStorage} from "@helpers/storage";
import {ALL_CONTAINERS} from "@helpers/containers";
import {nextLayout, readableLayout} from "./layouts";

export interface ViewControlsHost {
	state: ITabManagerState;
	setState(state: any): void;
	forceUpdate(): void;
}

export function changeContainerFilterValue(host: ViewControlsHost, e : React.ChangeEvent<HTMLSelectElement>): void {
	host.setState({
		containerFilter: e.target.value
	});
	host.forceUpdate();
}

export async function changeContainerColorValue(host: ViewControlsHost, e : React.ChangeEvent<HTMLInputElement>): Promise<void> {
	if (host.state.containerFilter === ALL_CONTAINERS) return;
	const containerColors = {...host.state.containerColors, [host.state.containerFilter]: e.target.value};
	host.setState({
		containerColors: containerColors
	});
	await setLocalStorage("containerColors", containerColors);
	host.forceUpdate();
}

export async function changePopupLayout(host: ViewControlsHost, layout): Promise<void> {
	let newLayout;
	if (layout && typeof (layout) === "string") {
		newLayout = layout;
	} else {
		newLayout = nextLayout(host.state.layout);
	}
	await setLocalStorage("layout", newLayout);

	host.setState({
		layout: newLayout,
		topText: "Switched to " + readableLayout(host.state.layout) + " view",
		bottomText: " "
	});

	host.forceUpdate();
}
