import {describe, expect, it} from "vitest";
import {debounce, is_in_bounds, isInViewport, stringHashcode, maybePluralize, toBoolean} from "@helpers/utils";

describe("utils", () => {
	describe("debounce", () => {
		it("should delay function execution", (done) => {
			let called = false;
			const fn = debounce(() => { called = true; }, 50);
			fn();
			expect(called).toBe(false);
			setTimeout(() => { expect(called).toBe(true); done(); }, 100);
		});
		it("should execute immediately when immediate=true", (done) => {
			let called = false;
			const fn = debounce(() => { called = true; }, 50, true);
			fn();
			expect(called).toBe(true);
			done();
		});
	});

	describe("is_in_bounds", () => {
		it("should return true when object is within bounds", () => {
			expect(is_in_bounds({left: 50, top: 50}, {left: 0, top: 0, width: 100, height: 100})).toBe(true);
		});
		it("should return false when outside bounds", () => {
			expect(is_in_bounds({left: 150, top: 50}, {left: 0, top: 0, width: 100, height: 100})).toBe(false);
		});
	});

	describe("isInViewport", () => {
		it("should work with mock elements", () => {
			const el = {getBoundingClientRect: () => ({top: 10, left: 10, bottom: 50, right: 50})};
			const ofEl = {height: 100, width: 100};
			expect(isInViewport(el, ofEl)).toBe(true);
		});
	});

	describe("stringHashcode", () => {
		it("should return consistent hashes", () => {
			expect(stringHashcode("test")).toBe(stringHashcode("test"));
		});
		it("should return number", () => {
			expect(typeof stringHashcode("test")).toBe("number");
		});
	});

	describe("maybePluralize", () => {
		it("should pluralize correctly", () => {
			expect(maybePluralize(1, "tab")).toBe("1 tab");
			expect(maybePluralize(2, "tab")).toBe("2 tabs");
		});
	});

	describe("toBoolean", () => {
		it("should handle all cases", () => {
			expect(toBoolean("true")).toBe(true);
			expect(toBoolean("false")).toBe(false);
			expect(toBoolean("yes")).toBe(true);
			expect(toBoolean("no")).toBe(false);
			expect(toBoolean("0")).toBe(false);
			expect(toBoolean("")).toBe(false);
			expect(toBoolean(0)).toBe(false);
			expect(toBoolean(1)).toBe(true);
			expect(toBoolean(undefined)).toBe(false);
			expect(toBoolean(null)).toBe(false);
		});
	});
});
