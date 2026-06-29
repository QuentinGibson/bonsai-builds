import { describe, expect, it } from "vitest";
import { getActiveFrame, getDisabledFrame, computeSpriteAttrs, SPRITE_SHEET_W, SPRITE_SHEET_H } from "./passiveIconSprite";
import { PASSIVE_ICON_FRAMES } from "../data/passiveIconFrames";
import { PASSIVE_ICON_FRAMES_DISABLED } from "../data/passiveIconFramesDisabled";

describe("getActiveFrame", () => {
	it("returns frame coords for a normal-size icon", () => {
		const frame = getActiveFrame("archonofundeathnode");
		expect(frame).toEqual({ x: 306, y: 0, w: 34, h: 34 });
	});

	it("returns frame coords for a notable-size icon looked up under notableActive prefix", () => {
		const frame = getActiveFrame("puppeteernoteble");
		expect(frame).not.toBeNull();
		expect(frame?.w).toBe(49);
		expect(frame?.h).toBe(49);
	});

	it("returns null for mastery icons absent from the sprite", () => {
		expect(getActiveFrame("mastergrouplife")).toBeNull();
	});

	it("handles subdirectory icon paths like gemling/gemlingbarrier", () => {
		const frame = getActiveFrame("gemling/gemlingbarrier");
		expect(frame).not.toBeNull();
	});

	it("resolves all 13 previously-missing passive icons", () => {
		const missing = [
			"archonofundeathnode",
			"archonofundeathnoteble",
			"armourelementaldamagedeflect",
			"armourelementaldamageenergyshieldrecharge",
			"coldfirenode",
			"endurancefrenzypowerchargenode",
			"energyshieldrechargedeflect",
			"energyshieldrechargedeflectnode",
			"gemling/gemlingbarrier",
			"minionaccuracydamage",
			"puppeteernode",
			"puppeteernoteble",
			"skillgemslotsnode",
		];
		for (const name of missing) {
			expect(getActiveFrame(name), `${name} should have a sprite frame`).not.toBeNull();
		}
	});
});

describe("getDisabledFrame", () => {
	it("returns frame coords for a normal-size icon in the disabled sheet", () => {
		const frame = getDisabledFrame("archonofundeathnode");
		expect(frame).not.toBeNull();
		expect(frame?.w).toBe(34);
	});

	it("returns null for mastery icons absent from the disabled sprite", () => {
		expect(getDisabledFrame("mastergrouplife")).toBeNull();
	});

	it("resolves the same 13 previously-missing icons in the disabled sheet", () => {
		const missing = [
			"archonofundeathnode",
			"archonofundeathnoteble",
			"armourelementaldamagedeflect",
			"armourelementaldamageenergyshieldrecharge",
			"coldfirenode",
			"endurancefrenzypowerchargenode",
			"energyshieldrechargedeflect",
			"energyshieldrechargedeflectnode",
			"gemling/gemlingbarrier",
			"minionaccuracydamage",
			"puppeteernode",
			"puppeteernoteble",
			"skillgemslotsnode",
		];
		for (const name of missing) {
			expect(getDisabledFrame(name), `${name} should have a disabled sprite frame`).not.toBeNull();
		}
	});
});

// ── Data parity ───────────────────────────────────────────────────────────────

describe("frame data parity", () => {
	it("active and disabled frame files have the same set of icon keys", () => {
		const activeKeys = new Set(Object.keys(PASSIVE_ICON_FRAMES));
		const disabledKeys = new Set(Object.keys(PASSIVE_ICON_FRAMES_DISABLED));

		const onlyInActive = [...activeKeys].filter(k => !disabledKeys.has(k));
		const onlyInDisabled = [...disabledKeys].filter(k => !activeKeys.has(k));

		expect(onlyInActive, "icons in active sheet but missing from disabled sheet").toEqual([]);
		expect(onlyInDisabled, "icons in disabled sheet but missing from active sheet").toEqual([]);
	});
});

// ── computeSpriteAttrs ────────────────────────────────────────────────────────

describe("computeSpriteAttrs", () => {
	it("centers the icon at (cx, cy) when frame starts at origin", () => {
		// frame at top-left of sprite, 34x34 icon
		const frame = { x: 0, y: 0, w: 34, h: 34 };
		const attrs = computeSpriteAttrs(100, 200, 34, frame);
		expect(attrs.x).toBeCloseTo(100 - 17);
		expect(attrs.y).toBeCloseTo(200 - 17);
		expect(attrs.width).toBeCloseTo(SPRITE_SHEET_W);
		expect(attrs.height).toBeCloseTo(SPRITE_SHEET_H);
	});

	it("shifts the sheet left/up so the correct frame aligns with the clip circle", () => {
		// archonofundeathnode: frame at x=306, y=0, w=34, h=34; imgSize=34
		const frame = { x: 306, y: 0, w: 34, h: 34 };
		const attrs = computeSpriteAttrs(0, 0, 34, frame);
		// s = 34/34 = 1; x = (0 - 17) - 306*1 = -323; y = (0 - 17) - 0 = -17
		expect(attrs.x).toBeCloseTo(-323);
		expect(attrs.y).toBeCloseTo(-17);
	});

	it("scales the sheet proportionally when imgSize differs from frame.w", () => {
		// 49x49 notable icon; display at imgSize=36
		const frame = { x: 0, y: 0, w: 49, h: 49 };
		const attrs = computeSpriteAttrs(0, 0, 36, frame);
		const s = 36 / 49;
		expect(attrs.width).toBeCloseTo(SPRITE_SHEET_W * s);
		expect(attrs.height).toBeCloseTo(SPRITE_SHEET_H * s);
	});
});
