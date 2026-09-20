import * as React from "react";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}
	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: "2rem", textAlign: "center" }}>
					<h2>Something went wrong</h2>
					<p>{this.state.error?.message || "An unexpected error occurred."}</p>
					<button onClick={() => window.location.reload()}>Reload</button>
				</div>
			);
		}
		return this.props.children;
	}
}
