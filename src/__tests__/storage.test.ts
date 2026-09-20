import {describe, expect, it} from "vitest";
import {getLocalStorage, setLocalStorage, getLocalStorageMap} from "@helpers/storage";

describe("storage", () => {
	it("should get/set values", async () => {
		await setLocalStorage("test_key", "test_value");
		const val = await getLocalStorage("test_key");
		expect(val).toBe("test_value");
	});

	it("should return default for missing keys", async () => {
		const val = await getLocalStorage("nonexistent_key", "default");
		expect(val).toBe("default");
	});

	it("should handle Map operations", async () => {
		const map = new Map<number, string>();
		map.set(1, "test");
		await setLocalStorage("test_map", map);
		const result = await getLocalStorageMap<number, string>("test_map");
		expect(result.get(1)).toBe("test");
	});
});
