import {create} from "zustand";
import * as browser from 'webextension-polyfill';
import {getLocalStorage, setLocalStorage, getLocalStorageMap, setLocalStorageMap, removeLocalStorage} from "@helpers/storage";
import {debugError, debugLog} from "@helpers/debug";

interface WindowState {
	windowId: number;
	title: string;
	incognito: boolean;
	focused: boolean;
	tabs: browser.Tabs.Tab[];
}

interface AppState {
	windows: WindowState[];
	sessions: any[];
	selection: Set<number>;
	hiddenTabs: Set<number>;
	tabsbyid: Map<number, browser.Tabs.Tab>;
	windowsbyid: Map<number, browser.Windows.Window>;
	toasts: any[];
	layout: string;
	dark: boolean;
	compact: boolean;
	tabLimit: number;
	tabWidth: number;
	tabHeight: number;
	animations: boolean;
	badge: boolean;
	filterTabs: boolean;
	hideWindows: boolean;
	sessionsFeature: boolean;
	tabactions: boolean;
	windowTitles: boolean;
	openInOwnTab: boolean;
	lastOpenWindow: number;
	optionsActive: boolean;
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

	setWindows: (windows: WindowState[]) => void;
	updateWindow: (windowId: number, updates: Partial<WindowState>) => void;
	setTabsbyid: (map: Map<number, browser.Tabs.Tab>) => void;
	setWindowsbyid: (map: Map<number, browser.Windows.Window>) => void;
	addToast: (message: string, type?: "info" | "success" | "error") => void;
	removeToast: (id: number) => void;
	toggleSelection: (tabId: number) => void;
	clearSelection: () => void;
	toggleHiddenTab: (tabId: number) => void;
	setLayout: (layout: string) => void;
	setDark: (dark: boolean) => void;
	setTabLimit: (limit: number) => void;
	setTabWidth: (width: number) => void;
	setTabHeight: (height: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
	windows: [],
	sessions: [],
	selection: new Set(),
	hiddenTabs: new Set(),
	tabsbyid: new Map(),
	windowsbyid: new Map(),
	toasts: [],
	layout: "blocks",
	dark: false,
	compact: false,
	tabLimit: 0,
	tabWidth: 800,
	tabHeight: 600,
	animations: true,
	badge: true,
	filterTabs: false,
	hideWindows: false,
	sessionsFeature: false,
	tabactions: true,
	windowTitles: true,
	openInOwnTab: false,
	lastOpenWindow: -1,
	optionsActive: false,
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

	setWindows: (windows) => set({windows}),
	updateWindow: (windowId, updates) => set((state) => ({
		windows: state.windows.map(w => w.windowId === windowId ? {...w, ...updates} : w),
	})),
	setTabsbyid: (map) => set({tabsbyid: map}),
	setWindowsbyid: (map) => set({windowsbyid: map}),
	addToast: (message, type = "info") => set((state) => {
		const id = Date.now();
		return {toasts: [...state.toasts, {id, message, type}]};
	}),
	removeToast: (id) => set((state) => ({
		toasts: state.toasts.filter(t => t.id !== id),
	})),
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
	setLayout: (layout) => set({layout}),
	setDark: (dark) => set({dark}),
	setTabLimit: (limit) => set({tabLimit: limit}),
	setTabWidth: (width) => set({tabWidth: width}),
	setTabHeight: (height) => set({tabHeight: height}),
}));
