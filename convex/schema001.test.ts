/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import * as breakpointsMod from "./breakpoints";

const modules = import.meta.glob("./**/*.ts");

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
    allocatedNodes: [{ id: "n1" }],
    allocatedAscendancyNodes: [],
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
    allocatedNodes: [],
    allocatedAscendancyNodes: [],
  });
  await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Second",
    allocatedNodes: [],
    allocatedAscendancyNodes: [],
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
    allocatedNodes: [],
    allocatedAscendancyNodes: [],
  });

  const sets = await t.query(api.buildSets.getAll, { userId: "user3" });
  expect(sets[0].order).toBe(2);
  expect(sets[0].breakpoints[0].order).toBe(5);
});

test("marketplace.publish stores listing with new breakpoint snapshot shape", async () => {
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
        allocatedNodes: [{ id: "n1", weapon_set: 1 }],
        allocatedAscendancyNodes: [],
      },
    ],
  });

  const listing = await t.query(api.marketplace.get, { id: listingId });
  expect(listing).not.toBeNull();
  expect(listing!.breakpoints[0].allocatedNodes).toEqual([{ id: "n1", weapon_set: 1 }]);
  expect(listing!.breakpoints[0]).not.toHaveProperty("level");
  expect(listing!.breakpoints[0]).not.toHaveProperty("selectedClass");
});

test("resetAscendancy is not exported from breakpoints module", () => {
  expect("resetAscendancy" in breakpointsMod).toBe(false);
});

test("breakpoints.add stores allocatedNodes as objects", async () => {
  const t = convexTest(schema, modules);

  const buildSetId = await t.mutation(api.buildSets.create, {
    userId: "user1",
    name: "My Build",
  });

  const bpId = await t.mutation(api.breakpoints.add, {
    buildSetId,
    name: "Early",
    order: 0,
    allocatedNodes: [
      { id: "node-1" },
      { id: "node-2", weapon_set: 1 },
      { id: "node-3", additional_text: "notable" },
    ],
    allocatedAscendancyNodes: [],
  });

  expect(bpId).toBeTruthy();

  const result = await t.query(api.buildSets.get, { id: buildSetId });
  expect(result).not.toBeNull();
  expect(result!.breakpoints[0].allocatedNodes).toEqual([
    { id: "node-1" },
    { id: "node-2", weapon_set: 1 },
    { id: "node-3", additional_text: "notable" },
  ]);
});
