/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { parseBuildFile, serializeBuildFile, parseFilename, type PassiveNode } from "./build_file";

const rawBuildFiles = import.meta.glob("../build-examples/*.build", { query: "?raw", import: "default" });

test("parseFilename splits on first tilde and strips .build extension", () => {
  expect(parseFilename("WarriorBuild~Level30.build")).toEqual({
    buildSetName: "WarriorBuild",
    breakpointName: "Level30",
  });
});

test("parseFilename with no tilde returns full name and empty breakpointName", () => {
  expect(parseFilename("NoBracket.build")).toEqual({
    buildSetName: "NoBracket",
    breakpointName: "",
  });
});

test("parseFilename with multiple tildes splits on first only", () => {
  expect(parseFilename("A~B~C.build")).toEqual({
    buildSetName: "A",
    breakpointName: "B~C",
  });
});

test("round-trip: parseBuildFile(serializeBuildFile(bp, meta)) preserves passives", () => {
  const passives: PassiveNode[] = [
    { id: "melee17" },
    { id: "slow_attacks2_", weapon_set: 1 },
    { id: "AscendancyWarrior3Start" },
    { id: "fire10", additional_text: "notable" },
  ];
  const bp = { name: "Level30", passives, selectedAscendancy: "Warrior3" };
  const meta = { name: "Shield Wall Build" };

  const serialized = serializeBuildFile(bp, meta);
  const roundTripped = parseBuildFile(serialized);

  expect(roundTripped.passives).toEqual(passives);
  expect(roundTripped.ascendancy).toBe("Warrior3");
  expect(roundTripped.name).toBe("Shield Wall Build~Level30");
});

test("parseBuildFile on warrior-shield-build.build returns correct passives count and weapon_set tags", async () => {
  const key = Object.keys(rawBuildFiles).find((k) => k.includes("warrior-shield-build"))!;
  const raw = (await rawBuildFiles[key]()) as string;
  const data = parseBuildFile(JSON.parse(raw));

  expect(data.passives).toHaveLength(70);
  expect(data.passives.filter((p) => p.weapon_set !== undefined)).toHaveLength(18);
});
