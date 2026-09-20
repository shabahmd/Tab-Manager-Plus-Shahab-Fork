import {getLocalStorage} from "@helpers/storage";
import {debugError} from "@helpers/debug";
import {collectContainerIds, ALL_CONTAINERS} from "@helpers/containers";
import {handleManagerKey} from "./tabmanager/keyboard";
import {applyRestoredSelection, clearSelectionState, persistSelection, pruneSelection, rangeSelect, readStoredSelection, toggleSelect} from "./tabmanager/selection";
import {sortWindows} from "./tabmanager/windowSort";
import {applyPopupOptionDefaults} from "./tabmanager/optionDefaults";
import {exportSessionsFile, exportSessionsHelperText, importSessionsFile, importSessionsHelperText, sessionsFeatureHelperText, syncSessions, toggleSessionsFeature} from "./tabmanager/sessions";
import {beginTabDrag, dropTabsOnTab, dropTabsOnWindow} from "./tabmanager/dragDrop";
import {animationsHelperText, badgeHelperText, changeTabHeightValue, changeTabLimitValue, changeTabWidthValue, compactHelperText, darkHelperText, disableResortingHelperText, enterToFocusHelperText, hideHelperText, openInOwnTabHelperText, orderByTabCountHelperText, tabActionsHelperText, tabHeightHelperText, tabLimitHelperText, tabWidthHelperText, toggleAnimationsState, toggleBadgeState, toggleCompactState, toggleDarkState, toggleDisableResortingState, toggleEnterToFocusState, toggleFilterMismatchedTabsState, toggleHideState, toggleOpenInOwnTabState, toggleOrderByTabCountState, toggleTabActionsState, toggleWindowTitlesState, windowTitlesHelperText} from "./tabmanager/popupOptions";
import {applySearch} from "./tabmanager/search";
import {closeSelectedTabs, closeTabById, discardSelectedTabs, discardTabById, focusFirstSelectedTab, highlightDuplicateTabs, closeDuplicateTabsAction, mergeAllWindows, setCloseTimerForSelection, moveSelectionToNewWindow, togglePinForSelection} from "./tabmanager/tabActions";
import {readStoredTabNames, renameSelectedTab} from "./tabmanager/tabNames";
import {nextLayout, readableLayout} from "./tabmanager/layouts";
import {setupPopupSubscriptions} from "./tabmanager/subscriptions";
import {isElementVisible, scrollToElement} from "./tabmanager/viewport";
import {getRandomTip, hoverIconStatus, hoverTabStatus} from "./tabmanager/status";
import {changeContainerColorValue, changeContainerFilterValue, changePopupLayout} from "./tabmanager/viewControls";
import {SelectionBadge} from "./SelectionBadge";
import {SessionList} from "./SessionList";
import {OptionsPanel} from "./OptionsPanel";
import {WindowList} from "./WindowList";
import {SearchActions} from "./SearchActions";
import {ContainerFilterRow} from "./ContainerFilterRow";
import {TopBar} from "./TopBar";
import {showToast, subscribe} from "@helpers/toast";
import {Window, ToastContainer} from "@views";
import * as React from "react";
import * as browser from 'webextension-polyfill';
import {ITabManager, ITabManagerState, ISavedSession} from "@types";

const {setTimeout, clearTimeout} = window

export class TabManager extends React.Component<ITabManager, ITabManagerState> {
	constructor(props : ITabManager) {
		super(props);

		let layout = "blocks";
		let animations = true;
		let windowTitles = true;
		let compact = false;
		let dark = false;
		let tabactions = true;
		let badge = true;
		let sessionsFeature = false;
		let hideWindows = false;
		let filterTabs = false;
		let enterToFocus = false;
		let orderByTabCount = false;
		let disableResorting = false;
		let tabLimit = 0;
		let openInOwnTab = false;
		let tabWidth = 800;
		let tabHeight = 600;

		let resetTimeout = -1;
		// var closeTimeout;

		this.state = {
			layout: layout,
			animations: animations,
			windowTitles: windowTitles,
			tabLimit: tabLimit,
			openInOwnTab: openInOwnTab,
			tabWidth: tabWidth,
			tabHeight: tabHeight,
			compact: compact,
			dark: dark,
			tabactions: tabactions,
			badge: badge,
			hideWindows: hideWindows,
			sessionsFeature: sessionsFeature,
			lastOpenWindow: -1,
			windows: [],
			sessions: [],
			selection: new Set(),
			lastSelect: 0,
			hiddenTabs: new Set(),
			tabsbyid: new Map(),
			windowsbyid: new Map(),
			resetTimeout: resetTimeout,
			height: 600,
			hasScrollBar: false,
			focusUpdates: 0,
			topText: "",
			bottomText: "",
			lastDirection: "",
			optionsActive: !!this.props.optionsActive,
			filterTabs: filterTabs,
			enterToFocus: enterToFocus,
			orderByTabCount: orderByTabCount,
			disableResorting: disableResorting,
			dupTabs: false,
			dragFavicon: "",
			colorsActive: 0,
			containerFilter: ALL_CONTAINERS,
			containerColors: {},
			tabNames: {},

			tabCount: 0,
			hiddenCount: 0,
			searchLen: 0,
			toasts: [],
		};

		this.addWindow = this.addWindow.bind(this);
		this.animationsText = this.animationsText.bind(this);
		this.badgeText = this.badgeText.bind(this);
		this.changelayout = this.changelayout.bind(this);
		this.changeContainerColor = this.changeContainerColor.bind(this);
		this.changeContainerFilter = this.changeContainerFilter.bind(this);
		this.changeTabHeight = this.changeTabHeight.bind(this);
		this.changeTabLimit = this.changeTabLimit.bind(this);
		this.changeTabWidth = this.changeTabWidth.bind(this);
		this.checkKey = this.checkKey.bind(this);
		this.clearSelection = this.clearSelection.bind(this);
		this.compactText = this.compactText.bind(this);
		this.darkText = this.darkText.bind(this);
		this.deleteTabs = this.deleteTabs.bind(this);
		this.discardTabs = this.discardTabs.bind(this);
		this.donate = this.donate.bind(this);
		this.exportSessions = this.exportSessions.bind(this);
		this.exportSessionsText = this.exportSessionsText.bind(this);
		this.getTip = this.getTip.bind(this);
		this.hideText = this.hideText.bind(this);
		this.highlightDuplicates = this.highlightDuplicates.bind(this);
		this.closeDuplicates = this.closeDuplicates.bind(this);
		this.mergeWindows = this.mergeWindows.bind(this);
		this.setCloseTimer = this.setCloseTimer.bind(this);
		this.renameTab = this.renameTab.bind(this);
		this.hoverIcon = this.hoverIcon.bind(this);
		this.importSessions = this.importSessions.bind(this);
		this.importSessionsText = this.importSessionsText.bind(this);
		this.openInOwnTabText = this.openInOwnTabText.bind(this);
		this.pinTabs = this.pinTabs.bind(this);
		this.rateExtension = this.rateExtension.bind(this);
		this.scrollTo = this.scrollTo.bind(this);
		this.search = this.search.bind(this);
		this.sessionsText = this.sessionsText.bind(this);
		this.sessionSync = this.sessionSync.bind(this);
		this.tabActionsText = this.tabActionsText.bind(this);
		this.tabHeightText = this.tabHeightText.bind(this);
		this.tabLimitText = this.tabLimitText.bind(this);
		this.tabWidthText = this.tabWidthText.bind(this);
		this.toggleAnimations = this.toggleAnimations.bind(this);
		this.toggleBadge = this.toggleBadge.bind(this);
		this.toggleCompact = this.toggleCompact.bind(this);
		this.toggleDark = this.toggleDark.bind(this);
		this.toggleFilterMismatchedTabs = this.toggleFilterMismatchedTabs.bind(this);
		this.toggleEnterToFocus = this.toggleEnterToFocus.bind(this);
		this.toggleOrderByTabCount = this.toggleOrderByTabCount.bind(this);
		this.toggleDisableResorting = this.toggleDisableResorting.bind(this);
		this.toggleHide = this.toggleHide.bind(this);
		this.toggleOpenInOwnTab = this.toggleOpenInOwnTab.bind(this);
		this.toggleOptions = this.toggleOptions.bind(this);
		this.toggleSessions = this.toggleSessions.bind(this);
		this.toggleTabActions = this.toggleTabActions.bind(this);
		this.toggleWindowTitles = this.toggleWindowTitles.bind(this);
		this.update = this.update.bind(this);
		this.windowTitlesText = this.windowTitlesText.bind(this);
		this.onTabDetached = this.onTabDetached.bind(this);
		this.onTabAttached = this.onTabAttached.bind(this);
		this.onTabRemoved = this.onTabRemoved.bind(this);
		this.onTabCreated = this.onTabCreated.bind(this);
		this.dirtyWindow = this.dirtyWindow.bind(this);
	}
	UNSAFE_componentWillMount() {
		this.update();
	}

	async loadStorage() {
		var storage = await browser.storage.local.get(null);

		const options = applyPopupOptionDefaults(storage);

		// Restore persisted selection; invalid ids are pruned in update().
		this.restoredSelection = readStoredSelection(storage);
		this.setState({
			tabNames: readStoredTabNames(storage)
		});

		storage["version"] = window.extensionVersion;

		await browser.storage.local.set(storage);

		if (options.dark) {
			document.body.className = "dark";
		} else {
			document.body.className = "";
		}

		this.setState({
			layout: options.layout,
			animations: options.animations,
			windowTitles: options.windowTitles,
			tabLimit: options.tabLimit,
			openInOwnTab: options.openInOwnTab,
			tabWidth: options.tabWidth,
			tabHeight: options.tabHeight,
			compact: options.compact,
			dark: options.dark,
			tabactions: options.tabactions,
			badge: options.badge,
			hideWindows: options.hideWindows,
			sessionsFeature: options.sessionsFeature,
			filterTabs: options.filterTabs,
			enterToFocus: options.enterToFocus,
			orderByTabCount: options.orderByTabCount,
			disableResorting: options.disableResorting,
			containerColors: options.containerColors
		});
	}

	hoverHandler(tab : browser.Tabs.Tab) {
		hoverTabStatus(this, tab);
	}
	hoverIcon(e : React.MouseEvent<HTMLDivElement> | string) {
		hoverIconStatus(this, e);
	}
	render() {
		let _this = this;

		// let hiddenCount = this.state.hiddenCount || 0;
		let tabCount = this.state.tabCount;

		// Firefox container filter (only shown when multiple containers exist)
		const containerIds = collectContainerIds(this.state.tabsbyid.values());

		let haveSess = false;

		if (this.state.sessionsFeature) {
			if (this.state.sessions.length > 0) haveSess = true;
			// disable session window if we have filtering enabled
			// and filter active
			if (haveSess && this.state.filterTabs) {
				if (this.state.searchLen > 0 || this.state.hiddenTabs.size > 0) {
					haveSess = false;
				}
			}
		}

		return (
			<div
				id="root"
				className={
					(this.state.compact ? "compact" : "") +
					" " +
					(this.state.animations ? "animations" : "no-animations") +
					" " +
					(this.state.windowTitles ? "windowTitles" : "no-windowTitles")
				}
				onKeyDown={this.checkKey}
				ref="root"
				tabIndex={0}
			>
				{!this.state.optionsActive && <div className={"window-container " + this.state.layout} ref="windowcontainer" tabIndex={2}>
					<WindowList
						windows={this.state.windows}
						colorsActive={this.state.colorsActive}
						layout={this.state.layout}
						selection={this.state.selection}
						searchLen={this.state.searchLen}
						searchQuery={this.state.searchQuery}
						sessionsFeature={this.state.sessionsFeature}
						tabactions={this.state.tabactions}
						hiddenTabs={this.state.hiddenTabs}
						filterTabs={this.state.filterTabs}
						containerFilter={this.state.containerFilter}
						containerColors={this.state.containerColors}
						tabNames={this.state.tabNames}
						windowTitles={this.state.windowTitles}
						lastOpenWindow={this.state.lastOpenWindow}
						onHoverTab={this.hoverHandler}
						onScrollTo={this.scrollTo}
						onHoverIcon={this.hoverIcon}
						onParentUpdate={this.update}
						onToggleColors={this.toggleColors}
						onTabMiddleClick={this.deleteTab}
						onSelect={this.select}
						onSelectTo={this.selectTo}
						onDrag={this.drag}
						onDrop={this.drop}
						onDropWindow={this.dropWindow}
						onDragFavicon={this.dragFavicon}
						registerWindowRef={this.registerWindowRef}
					/>
					<SessionList
						sessions={this.state.sessions}
						visible={haveSess}
						colorsActive={this.state.colorsActive}
						layout={this.state.layout}
						selection={this.state.selection}
						searchActive={this.state.searchLen > 0}
						searchQuery={this.state.searchQuery}
						tabactions={this.state.tabactions}
						hiddenTabs={this.state.hiddenTabs}
						filterTabs={this.state.filterTabs}
						windowTitles={this.state.windowTitles}
						lastOpenWindow={this.state.lastOpenWindow}
						onHoverTab={this.hoverHandler}
						onScrollTo={this.scrollTo}
						onHoverIcon={this.hoverIcon}
						onParentUpdate={this.update}
						onToggleColors={this.toggleColors}
						onTabMiddleClick={this.deleteTab}
						onSelect={this.select}
					/>
				</div>}
				{this.state.optionsActive && <OptionsPanel
					compact={this.state.compact}
					dark={this.state.dark}
					animations={this.state.animations}
					windowTitles={this.state.windowTitles}
					tabLimit={this.state.tabLimit}
					openInOwnTab={this.state.openInOwnTab}
					tabWidth={this.state.tabWidth}
					tabHeight={this.state.tabHeight}
					tabactions={this.state.tabactions}
					badge={this.state.badge}
					hideWindows={this.state.hideWindows}
					sessionsFeature={this.state.sessionsFeature}
					enterToFocus={this.state.enterToFocus}
					orderByTabCount={this.state.orderByTabCount}
					disableResorting={this.state.disableResorting}
					exportSessions={this.exportSessions}
					importSessions={this.importSessions}
					toggleOpenInOwnTab={this.toggleOpenInOwnTab}
					toggleBadge={this.toggleBadge}
					toggleHide={this.toggleHide}
					toggleSessions={this.toggleSessions}
					toggleAnimations={this.toggleAnimations}
					toggleWindowTitles={this.toggleWindowTitles}
					toggleCompact={this.toggleCompact}
					toggleDark={this.toggleDark}
					toggleTabActions={this.toggleTabActions}
					toggleEnterToFocus={this.toggleEnterToFocus}
					toggleOrderByTabCount={this.toggleOrderByTabCount}
					toggleDisableResorting={this.toggleDisableResorting}
					changeTabLimit={this.changeTabLimit}
					changeTabWidth={this.changeTabWidth}
					changeTabHeight={this.changeTabHeight}
					openInOwnTabText={this.openInOwnTabText}
					badgeText={this.badgeText}
					hideText={this.hideText}
					sessionsText={this.sessionsText}
					exportSessionsText={this.exportSessionsText}
					importSessionsText={this.importSessionsText}
					animationsText={this.animationsText}
					windowTitlesText={this.windowTitlesText}
					tabLimitText={this.tabLimitText}
					tabWidthText={this.tabWidthText}
					tabHeightText={this.tabHeightText}
					compactText={this.compactText}
					darkText={this.darkText}
					tabActionsText={this.tabActionsText}
					enterToFocusText={this.enterToFocusText}
					orderByTabCountText={this.orderByTabCountText}
					disableResortingText={this.disableResortingText}
					getTip={this.getTip}
				/>}
				<TopBar
					tabCount={tabCount}
					windowCount={this.state.windows.length}
					topText={this.state.topText}
					bottomText={this.state.bottomText}
					tip={this.getTip()}
					onDonate={this.donate}
					onRate={this.rateExtension}
					onToggleOptions={this.toggleOptions}
					onHoverIcon={this.hoverIcon}
				/>
				{!this.state.optionsActive && !this.state.colorsActive && <div className={"window searchbox"}>
					<table>
						<tbody>
							<tr>
								<td className="one">
									<input className="searchBoxInput" type="text" placeholder="Start typing to search tabs..." tabIndex={1} onChange={this.search} ref="searchbox" />
								</td>
								<SearchActions
									layout={this.state.layout}
									nextLayoutTitle={readableLayout(nextLayout(this.state.layout))}
									selectionSize={this.state.selection.size}
									visibleCount={this.state.tabsbyid.size - this.state.selection.size}
									searchLen={this.state.searchLen}
									filterTabs={this.state.filterTabs}
									dupTabs={this.state.dupTabs}
									onChangeLayout={this.changelayout}
									onDeleteTabs={this.deleteTabs}
									onDiscardTabs={this.discardTabs}
									onPinTabs={this.pinTabs}
									onToggleFilter={this.toggleFilterMismatchedTabs}
									onAddWindow={this.addWindow}
									onHighlightDuplicates={this.highlightDuplicates}
									onCloseDuplicates={this.closeDuplicates}
									onMergeWindows={this.mergeWindows}
									onSetCloseTimer={this.setCloseTimer}
									onRenameTab={this.renameTab}
									canRename={this.state.selection.size === 1}
									onHoverIcon={this.hoverIcon}
								/>
							</tr>
						</tbody>
					</table>
					<ContainerFilterRow
						containerIds={containerIds}
						containerFilter={this.state.containerFilter}
						containerColors={this.state.containerColors}
						onChangeFilter={this.changeContainerFilter}
						onChangeColor={this.changeContainerColor}
					/>
				</div>}
				<div className="window placeholder" />
				<SelectionBadge count={this.state.selection.size} />
			</div>
		);
	}

	async componentDidMount()
	{
		return setupPopupSubscriptions(this);
	}
	async sessionSync() {
		return syncSessions(this);
	}
	dragFavicon(icon : string) : string {
		if (!icon) {
			return this.state.dragFavicon;
		} else {
			this.setState({ dragFavicon: icon });
			return icon;
		}
	}
	rateExtension() {
		if (navigator.userAgent.search("Firefox") > -1) {
			browser.tabs.create({ url: "https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/" });
		} else {
			browser.tabs.create({ url: "https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff" });
		}
		this.forceUpdate();
	}
	donate() {
		browser.tabs.create({ url: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW" });
		this.forceUpdate();
	}
	toggleOptions() {
		this.setState({ optionsActive: !this.state.optionsActive });
		this.forceUpdate();
	}
	toggleColors(active : boolean, windowId : number) {
		this.setState({
			colorsActive: !!active ? windowId : 0
		})
		debugError("colorsActive", active, windowId, this.state.colorsActive);
		this.forceUpdate();
	}

	onTabCreated(tab : browser.Tabs.Tab) {
		this.dirtyWindow(tab.windowId);
	}

	onTabRemoved(tabId : number, removeInfo : browser.Tabs.OnRemovedRemoveInfoType) {
		this.dirtyWindow(removeInfo.windowId);
	}

	onTabDetached(tabId : number, detachInfo : browser.Tabs.OnDetachedDetachInfoType) {
		const windowId = detachInfo.oldWindowId;
		this.dirtyWindow(windowId);
	}

	onTabAttached(tabId : number, attachInfo: browser.Tabs.OnAttachedAttachInfoType) {
		const windowId = attachInfo.newWindowId;
		this.dirtyWindow(windowId);
	}

	dirtyWindow(windowId : number) {
		const window = this.getWindowRef(windowId) as Window;
		if (!window) return;
		window.setState({dirty: true});
	}

	async update() {
		const windows : browser.Windows.Window[] = await browser.windows.getAll({ populate: true });
		const sort_windows = await getLocalStorage("windowAge", []);

		sortWindows(windows, sort_windows, {
			orderByTabCount: this.state.orderByTabCount,
			disableResorting: this.state.disableResorting
		});

		this.state.windowsbyid.clear();
		this.state.tabsbyid.clear();

		this.setState({
			lastOpenWindow: windows[0].id,
			windows: windows
		});

		let tabCount = 0;

		for (const window of windows) {
			this.state.windowsbyid.set(window.id, window);
			for (const tab of window.tabs) {
				this.state.tabsbyid.set(tab.id, tab);
				tabCount++;
			}
		}
		// Apply selection restored from storage (only ids that still exist)
		applyRestoredSelection(this);
		pruneSelection(this);
		persistSelection(this.state.selection);
		this.setState({
			tabCount: tabCount
		});
		//this.state.searchLen = 0;
		// this.forceUpdate();
	}
	async deleteTabs() {
		return closeSelectedTabs(this);
	}
	deleteTab(tabId : number) {
		closeTabById(this, tabId);
	}
	async discardTabs() {
		return discardSelectedTabs(this);
	}
	discardTab(tabId) {
		discardTabById(this, tabId);
	}
	async focusFirstSelected() {
		return focusFirstSelectedTab(this);
	}
	async addWindow() {
		return moveSelectionToNewWindow(this);
	}
	async pinTabs() {
		return togglePinForSelection(this);
	}
	highlightDuplicates() {
		highlightDuplicateTabs(this);
	}
	closeDuplicates() {
		closeDuplicateTabsAction(this);
	}
	mergeWindows() {
		mergeAllWindows(this);
	}
	setCloseTimer() {
		setCloseTimerForSelection(this);
	}
	async renameTab() {
		return renameSelectedTab(this);
	}
	search(e) {
		applySearch(this, e);
	}
	clearSelection() {
		clearSelectionState(this);
	}
	// Pending selection ids read from storage; applied on next update()
	// once the live tab list is known (stale ids are dropped).
	restoredSelection : number[] | null = null;
	windowRefs = new Map<number, Window>();
	registerWindowRef = (windowId : number, instance : Window | null) => {
		if (!instance) {
			this.windowRefs.delete(windowId);
		} else {
			this.windowRefs.set(windowId, instance);
		}
	};
	getWindowRef(windowId : number) {
		return this.windowRefs.get(windowId);
	}
	saveSelection() {
		persistSelection(this.state.selection);
	}
	checkKey(e) {
		handleManagerKey(this, e);
	}
	selectWindowTab(windowId, tabPosition) {
		if (!tabPosition || tabPosition < 1) tabPosition = 1;
		for (let _w of this.state.windows) {
			if (_w.id !== windowId) continue;
			let i = 0;
			for (let _t of _w.tabs) {
				i++;
				if ((_w.tabs.length >= tabPosition && tabPosition === i) || (_w.tabs.length < tabPosition && _w.tabs.length === i)) {
					this.state.selection.clear();
					this.select(_t.id);
				}
			}
		}
	}
	scrollTo(what : string, id : number) {
		scrollToElement(this, what, id);
	}
	changeContainerFilter(e : React.ChangeEvent<HTMLSelectElement>) {
		changeContainerFilterValue(this, e);
	}
	async changeContainerColor(e : React.ChangeEvent<HTMLInputElement>) {
		return changeContainerColorValue(this, e);
	}
	async changelayout(layout) {
		return changePopupLayout(this, layout);
	}
	select(id : number) {
		toggleSelect(this, id);
	}
	selectTo(id : number, tabs : browser.Tabs.Tab[]) {
		rangeSelect(this, id, tabs);
	}
	drag(e : React.DragEvent<HTMLDivElement>, id : number) {
		beginTabDrag(this, e, id);
	}
	async drop(id : number, before : boolean) {
		return dropTabsOnTab(this, id, before);
	}
	async dropWindow(windowId : number) {
		dropTabsOnWindow(this, windowId);
	}
	async changeTabLimit(e : React.ChangeEvent<HTMLInputElement>) {
		return changeTabLimitValue(this, e);
	}
	tabLimitText() {
		tabLimitHelperText(this);
	}
	async changeTabWidth(e : React.ChangeEvent<HTMLInputElement>) {
		return changeTabWidthValue(this, e);
	}
	tabWidthText() {
		tabWidthHelperText(this);
	}
	async changeTabHeight(e : React.ChangeEvent<HTMLInputElement>) {
		return changeTabHeightValue(this, e);
	}
	tabHeightText() {
		tabHeightHelperText(this);
	}
	async toggleAnimations() {
		return toggleAnimationsState(this);
	}
	animationsText() {
		animationsHelperText(this);
	}
	async toggleWindowTitles() {
		return toggleWindowTitlesState(this);
	}
	windowTitlesText() {
		windowTitlesHelperText(this);
	}
	async toggleCompact() {
		return toggleCompactState(this);
	}
	compactText() {
		compactHelperText(this);
	}
	async toggleDark() {
		return toggleDarkState(this);
	}
	darkText() {
		darkHelperText(this);
	}
	async toggleTabActions() {
		return toggleTabActionsState(this);
	}
	tabActionsText() {
		tabActionsHelperText(this);
	}
	async toggleBadge() {
		return toggleBadgeState(this);
	}
	badgeText() {
		badgeHelperText(this);
	}
	async toggleOpenInOwnTab() {
		return toggleOpenInOwnTabState(this);
	}
	openInOwnTabText() {
		openInOwnTabHelperText(this);
	}
	async toggleSessions() {
		return toggleSessionsFeature(this);
	}
	sessionsText() {
		sessionsFeatureHelperText(this);
	}
	exportSessions() {
		exportSessionsFile(this);
	}
	exportSessionsText() {
		exportSessionsHelperText(this);
	}
	importSessions(evt : React.ChangeEvent<HTMLInputElement>) {
		importSessionsFile(this, evt);
	}
	importSessionsText() {
		importSessionsHelperText(this);
	}
	async toggleHide() {
		return toggleHideState(this);
	}
	hideText() {
		hideHelperText(this);
	}
	async toggleFilterMismatchedTabs() {
		return toggleFilterMismatchedTabsState(this);
	}
	async toggleEnterToFocus() {
		return toggleEnterToFocusState(this);
	}
	enterToFocusText() {
		enterToFocusHelperText(this);
	}
	async toggleOrderByTabCount() {
		return toggleOrderByTabCountState(this);
	}
	orderByTabCountText() {
		orderByTabCountHelperText(this);
	}
	async toggleDisableResorting() {
		return toggleDisableResortingState(this);
	}
	disableResortingText() {
		disableResortingHelperText(this);
	}
	getTip() {
		return getRandomTip();
	}
	elVisible(elem : HTMLElement) {
		return isElementVisible(elem);
	}
}