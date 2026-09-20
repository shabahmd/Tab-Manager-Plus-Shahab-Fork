"use strict";

import * as React from "react";
import {ITabOptions} from "@types";
import {TabOptions} from "./TabOptions";

export interface OptionsPanelProps extends ITabOptions {}

// Options container extracted from TabManager.render(). The parent keeps
// the optionsActive conditional; this component only wires TabOptions props.
export class OptionsPanel extends React.Component<OptionsPanelProps> {
	render() {
		return (
			<div className={"options-container"} ref="options-container">
				<TabOptions
					compact={this.props.compact}
					dark={this.props.dark}
					animations={this.props.animations}
					windowTitles={this.props.windowTitles}
					tabLimit={this.props.tabLimit}
					openInOwnTab={this.props.openInOwnTab}
					tabWidth={this.props.tabWidth}
					tabHeight={this.props.tabHeight}
					tabactions={this.props.tabactions}
					badge={this.props.badge}
					hideWindows={this.props.hideWindows}
					sessionsFeature={this.props.sessionsFeature}
					enterToFocus={this.props.enterToFocus}
					orderByTabCount={this.props.orderByTabCount}
					disableResorting={this.props.disableResorting}
					exportSessions={this.props.exportSessions}
					importSessions={this.props.importSessions}
					toggleOpenInOwnTab={this.props.toggleOpenInOwnTab}
					toggleBadge={this.props.toggleBadge}
					toggleHide={this.props.toggleHide}
					toggleSessions={this.props.toggleSessions}
					toggleAnimations={this.props.toggleAnimations}
					toggleWindowTitles={this.props.toggleWindowTitles}
					toggleCompact={this.props.toggleCompact}
					toggleDark={this.props.toggleDark}
					toggleTabActions={this.props.toggleTabActions}
					toggleEnterToFocus={this.props.toggleEnterToFocus}
					toggleOrderByTabCount={this.props.toggleOrderByTabCount}
					toggleDisableResorting={this.props.toggleDisableResorting}
					changeTabLimit={this.props.changeTabLimit}
					changeTabWidth={this.props.changeTabWidth}
					changeTabHeight={this.props.changeTabHeight}
					openInOwnTabText={this.props.openInOwnTabText}
					badgeText={this.props.badgeText}
					hideText={this.props.hideText}
					sessionsText={this.props.sessionsText}
					exportSessionsText={this.props.exportSessionsText}
					importSessionsText={this.props.importSessionsText}
					animationsText={this.props.animationsText}
					windowTitlesText={this.props.windowTitlesText}
					tabLimitText={this.props.tabLimitText}
					tabWidthText={this.props.tabWidthText}
					tabHeightText={this.props.tabHeightText}
					compactText={this.props.compactText}
					darkText={this.props.darkText}
					tabActionsText={this.props.tabActionsText}
					enterToFocusText={this.props.enterToFocusText}
					orderByTabCountText={this.props.orderByTabCountText}
					disableResortingText={this.props.disableResortingText}
					getTip={this.props.getTip}
				/>
			</div>
		);
	}
}
