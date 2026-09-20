import {fileURLToPath} from "node:url";
import {defineConfig} from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@helpers": fileURLToPath(new URL("./src/helpers", import.meta.url)),
			"@store": fileURLToPath(new URL("./src/store", import.meta.url)),
			"@strings": fileURLToPath(new URL("./src/strings/strings.ts", import.meta.url)),
			"@types": fileURLToPath(new URL("./src/types/index.ts", import.meta.url)),
			"@ui": fileURLToPath(new URL("./src/service_worker/ui", import.meta.url)),
			"@background": fileURLToPath(new URL("./src/service_worker/background", import.meta.url)),
			"@ErrorBoundary": fileURLToPath(new URL("./src/ErrorBoundary.tsx", import.meta.url)),
			"webextension-polyfill": fileURLToPath(new URL("./tests/mocks/webextension-polyfill.ts", import.meta.url)),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["src/__tests__/**/*.test.ts"],
	},
});
