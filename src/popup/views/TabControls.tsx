import * as React from "react";
import * as S from "@strings";
import {useTabManagerUI} from "@store/useTabManagerUI";
import {toggleMute} from "@store/mute";
import {deleteTabsFromStore, discardTabsFromStore, discardTabFromStore, addWindowFromStore, pinTabsFromStore, hibernateTabsFromStore, muteTabsFromStore} from "@store/TabManager.actions";

export function TabControls() {
	const selection = useTabManagerUI((s) => s.selection);
	const selectionSize = selection.size;

	return (
		<>
			<button
				title="Delete selected tabs"
				onClick={() => deleteTabsFromStore()}
			>
				Delete
			</button>
			<button
				title="Discard selected tabs"
				disabled={selectionSize === 0}
				onClick={() => discardTabsFromStore()}
			>
				Discard
			</button>
			<button
				title="Pin/Unpin selected tabs"
				disabled={selectionSize === 0}
				onClick={() => pinTabsFromStore()}
			>
				Pin
			</button>
			<button
				title="Mute selected tabs"
				disabled={selectionSize === 0}
				onClick={() => muteTabsFromStore()}
			>
				🔊 Mute
			</button>
			<button
				title="Hibernate selected tabs (discard to save RAM)"
				disabled={selectionSize === 0}
				onClick={() => hibernateTabsFromStore()}
			>
				💤 Hibernate
			</button>
			<button
				title="Move selected tabs to new window"
				disabled={selectionSize === 0}
				onClick={() => addWindowFromStore()}
			>
				New Window
			</button>
		</>
	);
}
