import {useAppStore} from "@store/useAppStore";
import {useTabManagerUI} from "@store/useTabManagerUI";
import {getLocalStorage, setLocalStorage} from "@helpers/storage";
import {debugLog} from "@helpers/debug";

export function TabManagerProvider({children}: { children: React.ReactNode }) {
	return <>{children}</>;
}

export async function initStoreFromStorage(): Promise<void> {
	try {
		const tabLimit = await getLocalStorage("tabLimit", 0);
		const tabWidth = await getLocalStorage("tabWidth", 800);
		const tabHeight = await getLocalStorage("tabHeight", 600);
		const layout = await getLocalStorage("layout", "blocks");
		const dark = await getLocalStorage("dark", false);
		const compact = await getLocalStorage("compact", false);
		const tabactions = await getLocalStorage("tabactions", true);
		const badge = await getLocalStorage("badge", true);
		const windowTitles = await getLocalStorage("windowTitles", true);
		const hideWindows = await getLocalStorage("hideWindows", false);
		const filterTabs = await getLocalStorage("filter-tabs", false);
		const animations = await getLocalStorage("animations", true);
		const sessionsFeature = await getLocalStorage("sessionsFeature", false);
		const openInOwnTab = await getLocalStorage("openInOwnTab", false);

		useTabManagerUI.setState({
			tabLimit,
			tabWidth,
			tabHeight,
			layout,
			dark,
			compact,
			tabactions,
			badge,
			windowTitles,
			hideWindows,
			filterTabs,
			animations,
			sessionsFeature,
			openInOwnTab,
		});

		const backupInterval = await getLocalStorage("backupInterval", 15);
		useTabManagerUI.setState({height: tabHeight});

		debugLog("Store initialized from storage");
	} catch (e) {
		debugError("initStoreFromStorage failed", e);
	}
}

export function getStore(): typeof useTabManagerUI {
	return useTabManagerUI;
}
