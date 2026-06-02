/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import * as breakpointsMod from "./breakpoints";
import { parseBuildFile } from "./build_file";
import { resolveAscendancy } from "../src/services/class-ascendancy-map";

const modules = import.meta.glob("./**/*.ts");
const rawBuildFiles = import.meta.glob("../build-examples/*.build", { query: "?raw", import: "default" });

test("buildSets.getAll return shape has no level, selectedClass, or ascendancy", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user2",
    name: "My Build",
  });

  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Early",
    order: 0,
    passives: [{ id: "n1" }],
  });

  const sets = await t.query(api.buildSets.getAll, { userId: "user2" });
  expect(sets).toHaveLength(1);
  const set = sets[0];
  expect(set).not.toHaveProperty("ascendancy");
  expect(set.breakpoints).toHaveLength(1);
  const bp = set.breakpoints[0];
  expect(bp).not.toHaveProperty("level");
  expect(bp).not.toHaveProperty("selectedClass");
});

test("breakpoints.add auto-assigns order as last+1", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user-order",
    name: "Order Test",
  });

  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "First",
    passives: [],
  });
  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Second",
    passives: [],
  });

  const result = await t.query(api.buildSets.get, { id: buildSetId });
  const orders = result!.breakpoints.map((bp) => bp.order).sort((a, b) => a - b);
  expect(orders).toEqual([0, 1]);
});

test("buildSets and breakpoints carry order field", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user3",
    name: "Ordered Build",
    order: 2,
  });

  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Mid",
    order: 5,
    passives: [],
  });

  const sets = await t.query(api.buildSets.getAll, { userId: "user3" });
  expect(sets[0].order).toBe(2);
  expect(sets[0].breakpoints[0].order).toBe(5);
});

test("marketplace.publish stores listing with passives snapshot shape", async () => {
  const t = convexTest(schema, modules);

  const listingId = await t.mutation(api.marketplace.publish, {
    authorId: "user4",
    authorName: "Alice",
    name: "My Build",
    description: "cool build",
    className: "Witch",
    breakpoints: [
      {
        name: "Early",
        order: 0,
        passives: [{ id: "n1", weapon_set: 1 }],
      },
    ],
  });

  const listing = await t.query(api.marketplace.get, { id: listingId });
  expect(listing).not.toBeNull();
  expect(listing!.breakpoints[0].passives).toEqual([{ id: "n1", weapon_set: 1 }]);
  expect(listing!.breakpoints[0]).not.toHaveProperty("level");
  expect(listing!.breakpoints[0]).not.toHaveProperty("selectedClass");
  expect(listing!.breakpoints[0]).not.toHaveProperty("allocatedNodes");
  expect(listing!.breakpoints[0]).not.toHaveProperty("allocatedAscendancyNodes");
});

test("resetAscendancy is not exported from breakpoints module", () => {
  expect("resetAscendancy" in breakpointsMod).toBe(false);
});

test("breakpoints.add accepts passives and buildSets.get returns passives", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user-passives",
    name: "Passives Build",
  });

  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Early",
    order: 0,
    passives: [
      { id: "melee17" },
      { id: "slow_attacks2_", weapon_set: 1 },
      { id: "AscendancyWarrior3Start" },
    ],
  });

  const result = await t.query(api.buildSets.get, { id: buildSetId });
  expect(result).not.toBeNull();
  const bp = result!.breakpoints[0];
  expect(bp.passives).toEqual([
    { id: "melee17" },
    { id: "slow_attacks2_", weapon_set: 1 },
    { id: "AscendancyWarrior3Start" },
  ]);
  expect(bp).not.toHaveProperty("allocatedNodes");
  expect(bp).not.toHaveProperty("allocatedAscendancyNodes");
});

test("marketplace.publish snapshot uses passives", async () => {
  const t = convexTest(schema, modules);

  const listingId = await t.mutation(api.marketplace.publish, {
    authorId: "user5",
    authorName: "Bob",
    name: "Passives Build",
    description: "test",
    className: "Warrior",
    breakpoints: [
      {
        name: "Mid",
        order: 0,
        passives: [{ id: "melee17" }, { id: "AscendancyWarrior3Start" }],
      },
    ],
  });

  const listing = await t.query(api.marketplace.get, { id: listingId });
  expect(listing).not.toBeNull();
  expect(listing!.breakpoints[0].passives).toEqual([
    { id: "melee17" },
    { id: "AscendancyWarrior3Start" },
  ]);
  expect(listing!.breakpoints[0]).not.toHaveProperty("allocatedNodes");
  expect(listing!.breakpoints[0]).not.toHaveProperty("allocatedAscendancyNodes");
});

test("breakpoints.add stores passives as objects with weapon_set and additional_text", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user1",
    name: "My Build",
  });

  const bpId = await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Early",
    order: 0,
    passives: [
      { id: "node-1" },
      { id: "node-2", weapon_set: 1 },
      { id: "node-3", additional_text: "notable" },
    ],
  });

  expect(bpId).toBeTruthy();

  const result = await t.query(api.buildSets.get, { id: buildSetId });
  expect(result).not.toBeNull();
  expect(result!.breakpoints[0].passives).toEqual([
    { id: "node-1" },
    { id: "node-2", weapon_set: 1 },
    { id: "node-3", additional_text: "notable" },
  ]);
});

test("marketplace.update snapshot includes skills", async () => {
  const t = convexTest(schema, modules);

  const listingId = await t.mutation(api.marketplace.publish, {
    authorId: "user-mp-upd",
    authorName: "Bob",
    name: "Build",
    description: "test",
    className: "Witch",
    breakpoints: [{ name: "Early", order: 0, passives: [], skills: [] }],
  });

  await t.mutation(api.marketplace.update, {
    id: listingId as any,
    userId: "user-mp-upd",
    name: "Build",
    description: "test",
    className: "Witch",
    breakpoints: [
      {
        name: "Early",
        order: 0,
        passives: [],
        skills: [{ id: "IceNova", level_interval: [1, 20], support_skills: [] }],
      },
    ],
  });

  const listing = await t.query(api.marketplace.get, { id: listingId as any });
  expect(listing!.breakpoints[0].skills).toEqual([
    { id: "IceNova", level_interval: [1, 20], support_skills: [] },
  ]);
});

test("marketplace.publish snapshot includes skills on each breakpoint", async () => {
  const t = convexTest(schema, modules);

  const listingId = await t.mutation(api.marketplace.publish, {
    authorId: "user-mp-skills",
    authorName: "Alice",
    name: "Skill Build",
    description: "test",
    className: "Witch",
    breakpoints: [
      {
        name: "Mid",
        order: 0,
        passives: [],
        skills: [
          {
            id: "IceNova",
            level_interval: [1, 20],
            support_skills: [{ id: "AddedFireDamageSupport", level_interval: [1, 20] }],
          },
        ],
      },
    ],
  });

  const listing = await t.query(api.marketplace.get, { id: listingId });
  expect(listing).not.toBeNull();
  expect(listing!.breakpoints[0].skills).toEqual([
    {
      id: "IceNova",
      level_interval: [1, 20],
      support_skills: [{ id: "AddedFireDamageSupport", level_interval: [1, 20] }],
    },
  ]);
});

test("breakpoints.update replaces skills", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user-skills-update",
    name: "Skills Build",
  });

  const bpId = await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Step",
    passives: [],
    skills: [{ id: "IceNova", level_interval: [1, 10], support_skills: [] }],
  });

  await t.mutation(api.breakpoints.update, {
    id: bpId as any,
    buildSetId,
    skills: [
      { id: "LeapSlam", level_interval: [5, 20], support_skills: [] },
    ],
  });

  const result = await t.query(api.buildSets.get, { id: buildSetId });
  expect(result!.breakpoints[0].skills).toEqual([
    { id: "LeapSlam", level_interval: [5, 20], support_skills: [] },
  ]);
});

test("breakpoints.add accepts skills and buildSets.get returns them", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user-skills",
    name: "Skills Build",
  });

  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Mid Game",
    passives: [],
    skills: [
      {
        id: "IceNova",
        level_interval: [1, 20],
        support_skills: [
          { id: "AddedFireDamageSupport", level_interval: [1, 20] },
        ],
      },
    ],
  });

  const result = await t.query(api.buildSets.get, { id: buildSetId });
  expect(result).not.toBeNull();
  const bp = result!.breakpoints[0];
  expect(bp.skills).toEqual([
    {
      id: "IceNova",
      level_interval: [1, 20],
      support_skills: [
        { id: "AddedFireDamageSupport", level_interval: [1, 20] },
      ],
    },
  ]);
});

test("build file import: className set on BuildSet and selectedAscendancy set on Breakpoint", async () => {
  const key = Object.keys(rawBuildFiles).find((k) => k.includes("warrior-shield-build"))!;
  const raw = (await rawBuildFiles[key]()) as string;

  // Mirrors what handleImportFile does: parse → resolve
  const data = parseBuildFile(JSON.parse(raw));
  const resolved = resolveAscendancy(data.ascendancy);

  expect(resolved).not.toBeNull();
  const { className, ascendancy } = resolved!;

  // Mirrors what handleConfirmImport does: create with className, then add breakpoint
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user-import",
    name: "Warrior Shield Build",
    className,
  });

  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Step 1",
    passives: data.passives,
    ...(ascendancy ? { selectedAscendancy: ascendancy } : {}),
  });

  // Verify via buildSets.get (what refreshBuilds → getBuildSet uses)
  const byId = await t.query(api.buildSets.get, { id: buildSetId });
  expect(byId).not.toBeNull();
  expect(byId!.className).toBe("Warrior");
  expect(byId!.breakpoints[0].selectedAscendancy).toBe(ascendancy);
  expect(byId!.breakpoints[0].passives).toHaveLength(70);

  // Verify via buildSets.getAll (what refreshBuilds → getAllBuildSets uses)
  const all = await t.query(api.buildSets.getAll, { userId: "user-import" });
  const imported = all.find((s) => s.id === (buildSetId as string));
  expect(imported).toBeDefined();
  expect(imported!.className).toBe("Warrior");
  expect(imported!.breakpoints[0].selectedAscendancy).toBe(ascendancy);
});

test("breakpoints.add accepts inventory_slots and buildSets.get returns them", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user-inv-slots",
    name: "Inventory Build",
  });

  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Early",
    passives: [],
    inventory_slots: [
      {
        inventory_id: "Weapon1",
        level_interval: [1, 40],
        slot_x: 0,
        slot_y: 0,
        additional_text: "",
      },
    ],
  });

  const result = await t.query(api.buildSets.get, { id: buildSetId });
  expect(result).not.toBeNull();
  const bp = result!.breakpoints[0];
  expect(bp.inventory_slots).toEqual([
    {
      inventory_id: "Weapon1",
      level_interval: [1, 40],
      slot_x: 0,
      slot_y: 0,
      additional_text: "",
    },
  ]);
});

test("breakpoints.update replaces inventory_slots", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user-inv-update",
    name: "Inv Update Build",
  });

  const bpId = await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Step",
    passives: [],
    inventory_slots: [
      { inventory_id: "Helm1", level_interval: [1, 20], slot_x: 2, slot_y: 0, additional_text: "" },
    ],
  });

  await t.mutation(api.breakpoints.update, {
    id: bpId as any,
    buildSetId,
    inventory_slots: [
      { inventory_id: "BodyArmour1", level_interval: [20, 60], slot_x: 2, slot_y: 1, additional_text: "Good armor" },
    ],
  });

  const result = await t.query(api.buildSets.get, { id: buildSetId });
  expect(result!.breakpoints[0].inventory_slots).toEqual([
    { inventory_id: "BodyArmour1", level_interval: [20, 60], slot_x: 2, slot_y: 1, additional_text: "Good armor" },
  ]);
});

test("marketplace.publish snapshot includes inventory_slots", async () => {
  const t = convexTest(schema, modules);

  const listingId = await t.mutation(api.marketplace.publish, {
    authorId: "user-mp-inv",
    authorName: "Alice",
    name: "Inv Build",
    description: "test",
    className: "Warrior",
    breakpoints: [
      {
        name: "Mid",
        order: 0,
        passives: [],
        inventory_slots: [
          { inventory_id: "Weapon1", level_interval: [1, 40], slot_x: 0, slot_y: 0, additional_text: "" },
        ],
      },
    ],
  });

  const listing = await t.query(api.marketplace.get, { id: listingId });
  expect(listing).not.toBeNull();
  expect(listing!.breakpoints[0].inventory_slots).toEqual([
    { inventory_id: "Weapon1", level_interval: [1, 40], slot_x: 0, slot_y: 0, additional_text: "" },
  ]);
});

test("marketplace.update snapshot includes inventory_slots", async () => {
  const t = convexTest(schema, modules);

  const listingId = await t.mutation(api.marketplace.publish, {
    authorId: "user-mp-inv-upd",
    authorName: "Bob",
    name: "Build",
    description: "test",
    className: "Witch",
    breakpoints: [{ name: "Early", order: 0, passives: [], inventory_slots: [] }],
  });

  await t.mutation(api.marketplace.update, {
    id: listingId as any,
    userId: "user-mp-inv-upd",
    name: "Build",
    description: "test",
    className: "Witch",
    breakpoints: [
      {
        name: "Early",
        order: 0,
        passives: [],
        inventory_slots: [
          { inventory_id: "Ring1", level_interval: [30, 70], slot_x: 1, slot_y: 3, additional_text: "Coral Ring" },
        ],
      },
    ],
  });

  const listing = await t.query(api.marketplace.get, { id: listingId as any });
  expect(listing!.breakpoints[0].inventory_slots).toEqual([
    { inventory_id: "Ring1", level_interval: [30, 70], slot_x: 1, slot_y: 3, additional_text: "Coral Ring" },
  ]);
});
