import { expect, test } from "vitest";
import { patchNodeNote, hasNodeNote } from "./passiveNodeNote";
import { CLASS_START_NODES } from "./classStartNodes";
import type { PassiveNode } from "../../services/buildStorage";

// ── CLASS_START_NODES ─────────────────────────────────────────────────────────

test("CLASS_START_NODES uses game string table IDs, not numeric skill integers", () => {
	expect(CLASS_START_NODES["Warrior"]).toBe("marauder594");
	expect(CLASS_START_NODES["Ranger"]).toBe("ranger596");
	expect(CLASS_START_NODES["Witch"]).toBe("witch595");
	for (const id of Object.values(CLASS_START_NODES)) {
		expect(/^\d+$/.test(id)).toBe(false);
	}
});

// ── patchNodeNote ─────────────────────────────────────────────────────────────

test("patchNodeNote sets additional_text on the matching node", () => {
  const passives: PassiveNode[] = [{ id: "42" }];
  const result = patchNodeNote("42", "my note", passives);
  expect(result).toEqual([{ id: "42", additional_text: "my note" }]);
});

test("patchNodeNote does not touch unrelated nodes", () => {
  const passives: PassiveNode[] = [{ id: "42", additional_text: "keep" }, { id: "7" }];
  const result = patchNodeNote("7", "new note", passives);
  expect(result[0]).toEqual({ id: "42", additional_text: "keep" });
  expect(result[1]).toEqual({ id: "7", additional_text: "new note" });
});

test("patchNodeNote with empty string removes additional_text entirely", () => {
  const passives: PassiveNode[] = [{ id: "42", additional_text: "old note" }];
  const result = patchNodeNote("42", "", passives);
  expect(result).toEqual([{ id: "42" }]);
  expect(result[0]).not.toHaveProperty("additional_text");
});

// ── hasNodeNote ───────────────────────────────────────────────────────────────

test("hasNodeNote returns true when node has a non-empty note", () => {
  const passives: PassiveNode[] = [{ id: "42", additional_text: "text" }];
  expect(hasNodeNote("42", passives)).toBe(true);
});

test("hasNodeNote returns false when node has no note", () => {
  const passives: PassiveNode[] = [{ id: "42" }];
  expect(hasNodeNote("42", passives)).toBe(false);
});

test("hasNodeNote returns false for a node not in the array", () => {
  const passives: PassiveNode[] = [{ id: "42", additional_text: "text" }];
  expect(hasNodeNote("99", passives)).toBe(false);
});
