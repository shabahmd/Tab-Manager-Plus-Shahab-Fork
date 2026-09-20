interface ToastEntry {
	id: number;
	message: string;
	type: "info" | "success" | "error";
	timestamp: number;
}

let toasts: ToastEntry[] = [];
let listeners: Array<() => void> = [];
let nextId = 0;
const TTL_MS = 3000;

function notify() {
	for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
	listeners.push(listener);
	return () => {
		listeners = listeners.filter(l => l !== listener);
	};
}

export function getToasts(): ToastEntry[] {
	const now = Date.now();
	toasts = toasts.filter(t => now - t.timestamp < TTL_MS);
	return toasts;
}

export function showToast(message: string, type: ToastEntry["type"] = "info"): void {
	toasts.push({id: nextId++, message, type, timestamp: Date.now()});
	notify();
}

export function dismissToast(id: number): void {
	toasts = toasts.filter(t => t.id !== id);
	notify();
}
