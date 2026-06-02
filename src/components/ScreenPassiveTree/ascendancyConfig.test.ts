import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import {
	ascendancyData,
	ascendancyNames,
	ascendancyStartNodes,
	classAscendancies,
} from "./ascendancyConfig";

// ── 0.5 new ascendancies ──────────────────────────────────────────────────────

test("Witch has 4 ascendancies including Abyssal Lich", () => {
	expect(classAscendancies.Witch).toEqual([
		"Infernalist",
		"Blood Mage",
		"Lich",
		"Abyssal Lich",
	]);
});

test("Monk has Martial Artist", () => {
	expect(classAscendancies.Monk).toContain("Martial Artist");
});

test("Huntress has Spirit Walker", () => {
	expect(classAscendancies.Huntress).toContain("Spirit Walker");
});

// ── Config completeness ───────────────────────────────────────────────────────

describe("every ascendancy in classAscendancies has complete config", () => {
	const allAscendancies = Object.values(classAscendancies).flat();

	for (const name of allAscendancies) {
		test(`${name} has ascendancyData entry with nodes and transform`, () => {
			expect(ascendancyData[name]).toBeDefined();
			expect(ascendancyData[name].nodes.length).toBeGreaterThan(0);
			expect(ascendancyData[name].transform).toMatch(/^translate\(/);
		});

		test(`${name} has ascendancyNames entry`, () => {
			expect(ascendancyNames[name]).toBe(name);
		});

		test(`${name} has ascendancyStartNodes entry`, () => {
			expect(ascendancyStartNodes[name]).toBeDefined();
			expect(ascendancyStartNodes[name]).toMatch(/^\d+$/);
		});
	}
});

// ── Data integrity: all node IDs must exist in data_us.json ──────────────────

test("all ascendancy node IDs in ascendancyData exist in data_us.json", () => {
	const dataPath = resolve(__dirname, "../../../public/data_us.json");
	const treeData = JSON.parse(readFileSync(dataPath, "utf-8")) as {
		nodes: Record<string, unknown>;
	};
	const knownIds = new Set(Object.keys(treeData.nodes));

	const missing: string[] = [];
	for (const [ascName, { nodes }] of Object.entries(ascendancyData)) {
		for (const id of nodes) {
			if (!knownIds.has(id)) {
				missing.push(`${ascName}:${id}`);
			}
		}
	}
	expect(missing).toEqual([]);
});

// ── Start nodes are within their ascendancy's node list ──────────────────────

test("each ascendancy start node is in that ascendancy's node list", () => {
	const mismatches: string[] = [];
	for (const [name, startId] of Object.entries(ascendancyStartNodes)) {
		const entry = ascendancyData[name];
		if (!entry) continue; // caught by completeness tests above
		if (!entry.nodes.includes(startId)) {
			mismatches.push(`${name}: start ${startId} not in nodes list`);
		}
	}
	expect(mismatches).toEqual([]);
});
