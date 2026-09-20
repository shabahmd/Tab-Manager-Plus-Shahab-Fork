import * as React from "react";

interface Toast {
	id: number;
	message: string;
	type: "info" | "success" | "error";
}

export function ToastContainer({toasts, onRemove}: {toasts: Toast[]; onRemove: (id: number) => void}) {
	if (toasts.length === 0) return null;
	return (
		<div className="toast-container" role="status" aria-live="polite">
			{toasts.map((toast) => (
				<div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
					<span>{toast.message}</span>
					<button onClick={() => onRemove(toast.id)} aria-label="Dismiss notification" className="toast-close">×</button>
				</div>
			))}
		</div>
	);
}

let toastId = 0;

export function createToast(message: string, type: Toast["type"] = "info"): Toast {
	toastId++;
	return {id: toastId, message, type};
}
