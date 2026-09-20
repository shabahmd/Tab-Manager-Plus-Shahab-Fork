import {create} from "zustand";

interface TabManagerUIState {
	layout: string;
	dark: boolean;
	compact: boolean;
	tabactions: boolean;
	badge: boolean;
	windowTitles: boolean;
	hideWindows: boolean;
	filterTabs: boolean;
	animations: boolean;
	sessionsFeature: boolean;
	openInOwnTab: boolean;
	optionsActive: boolean;
	tabLimit: number;
	tabWidth: number;
	tabHeight: number;
	height: number;
	hasScrollBar: boolean;
	focusUpdates: number;
	topText: string;
	bottomText: string;
	lastDirection: string;
	dupTabs: boolean;
	dragFavicon: string;
	colorsActive: number;
	resetTimeout: number;
	tabCount: number;
	hiddenCount: number;
	searchLen: number;
	lastSelect: number;
	selection: Set<number>;
	hiddenTabs: Set<number>;
	tabsbyid: Map<number, any>;
	windowsbyid: Map<number, any>;
	toasts: any[];
	windows: any[];
	sessions: any[];
	lastOpenWindow: number;

	setLayout: (layout: string) => void;
	setDark: (dark: boolean) => void;
	setCompact: (compact: boolean) => void;
	setTabactions: (v: boolean) => void;
	setBadge: (v: boolean) => void;
	setWindowTitles: (v: boolean) => void;
	setHideWindows: (v: boolean) => void;
	setFilterTabs: (v: boolean) => void;
	setAnimations: (v: boolean) => void;
	setSessionsFeature: (v: boolean) => void;
	setOpenInOwnTab: (v: boolean) => void;
	setOptionsActive: (v: boolean) => void;
	setTabLimit: (v: number) => void;
	setTabWidth: (v: number) => void;
	setTabHeight: (v: number) => void;
	setHeight: (v: number) => void;
	setHasScrollBar: (v: boolean) => void;
	setFocusUpdates: (v: number) => void;
	setTopText: (v: string) => void;
	setBottomText: (v: string) => void;
	setLastDirection: (v: string) => void;
	setDupTabs: (v: boolean) => void;
	setDragFavicon: (v: string) => void;
	setColorsActive: (v: number) => void;
	setResetTimeout: (v: number) => void;
	setTabCount: (v: number) => void;
	setHiddenCount: (v: number) => void;
	setSearchLen: (v: number) => void;
	setLastSelect: (v: number) => void;
	toggleSelection: (tabId: number) => void;
	clearSelection: () => void;
	toggleHiddenTab: (tabId: number) => void;
	addToast: (message: string, type?: "info" | "success" | "error") => void;
	removeToast: (id: number) => void;
}

export const useTabManagerUI = create<TabManagerUIState>((set) => ({
	layout: "blocks",
	dark: false,
	compact: false,
	tabactions: true,
	badge: true,
	windowTitles: true,
	hideWindows: false,
	filterTabs: false,
	animations: true,
	sessionsFeature: false,
	openInOwnTab: false,
	optionsActive: false,
	tabLimit: 0,
	tabWidth: 800,
	tabHeight: 600,
	height: 600,
	hasScrollBar: false,
	focusUpdates: 0,
	topText: "",
	bottomText: "",
	lastDirection: "",
	dupTabs: false,
	dragFavicon: "",
	colorsActive: 0,
	resetTimeout: -1,
	tabCount: 0,
	hiddenCount: 0,
	searchLen: 0,
	lastSelect: 0,
	selection: new Set(),
hiddenTabs: new Set(),
	tabsbyid: new Map(),
	windowsbyid: new Map(),
	windows: [],
	sessions: [],
	toasts: [],
	lastOpenWindow: 0,

	setLayout: (layout) => set({layout}),
	setDark: (dark) => set({dark}),
	setCompact: (compact) => set({compact}),
	setTabactions: (tabactions) => set({tabactions}),
	setBadge: (badge) => set({badge}),
	setWindowTitles: (windowTitles) => set({windowTitles}),
	setHideWindows: (hideWindows) => set({hideWindows}),
	setFilterTabs: (filterTabs) => set({filterTabs}),
	setAnimations: (animations) => set({animations}),
	setSessionsFeature: (sessionsFeature) => set({sessionsFeature}),
	setOpenInOwnTab: (openInOwnTab) => set({openInOwnTab}),
	setOptionsActive: (optionsActive) => set({optionsActive}),
	setTabLimit: (tabLimit) => set({tabLimit}),
	setTabWidth: (tabWidth) => set({tabWidth}),
	setTabHeight: (tabHeight) => set({tabHeight}),
	setHeight: (height) => set({height}),
	setHasScrollBar: (hasScrollBar) => set({hasScrollBar}),
	setFocusUpdates: (focusUpdates) => set({focusUpdates}),
	setTopText: (topText) => set({topText}),
	setBottomText: (bottomText) => set({bottomText}),
	setLastDirection: (lastDirection) => set({lastDirection}),
	setDupTabs: (dupTabs) => set({dupTabs}),
	setDragFavicon: (dragFavicon) => set({dragFavicon}),
	setColorsActive: (colorsActive) => set({colorsActive}),
	setResetTimeout: (resetTimeout) => set({resetTimeout}),
	setTabCount: (tabCount) => set({tabCount}),
	setHiddenCount: (hiddenCount) => set({hiddenCount}),
	setSearchLen: (searchLen) => set({searchLen}),
	setLastSelect: (lastSelect) => set({lastSelect}),
	toggleSelection: (tabId) => set((state) => {
		const newSelection = new Set(state.selection);
		if (newSelection.has(tabId)) newSelection.delete(tabId);
		else newSelection.add(tabId);
		return {selection: newSelection};
	}),
	clearSelection: () => set({selection: new Set()}),
	toggleHiddenTab: (tabId) => set((state) => {
		const newHidden = new Set(state.hiddenTabs);
		if (newHidden.has(tabId)) newHidden.delete(tabId);
		else newHidden.add(tabId);
		return {hiddenTabs: newHidden};
	}),
	addToast: (message, type = "info") => set((state) => {
		const id = Date.now();
		return {toasts: [...state.toasts, {id, message, type}]};
	}),
	removeToast: (id) => set((state) => ({
		toasts: state.toasts.filter(t => t.id !== id),
	})),
}));
