import * as React from "react";
import {useTabManagerUI} from "@store/useTabManagerUI";
import {hibernateWindow} from "@service_worker/background/hibernate";

export function WindowControls({windowId}: {windowId: number}) {
	const windows = useTabManagerUI((s) => s.windows);
	const win = windows.find((w) => w.windowId === windowId);
	const tabCount = win?.tabs?.length || 0;

	return (
		<button
			title="Hibernate this window (discard inactive tabs to save RAM)"
			onClick={() => hibernateWindow(windowId)}
		>
			💤 Hibernate ({tabCount})
		</button>
	);
}
