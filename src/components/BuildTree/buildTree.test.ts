import { expect, test } from "vitest";
import { sortedBuildsForTree } from "./buildTree";

function makeBuild(id: string, order: number, breakpoints: { id: string; order: number }[] = []) {
  return {
    id,
    name: `Build ${id}`,
    className: "",
    order,
    createdAt: 0,
    updatedAt: 0,
    breakpoints: breakpoints.map((bp) => ({
      id: bp.id,
      name: bp.id,
      order: bp.order,
      passives: [],
      skills: [],
      inventory_slots: [],
      selectedAscendancy: null,
      createdAt: 0,
    })),
  };
}

test("builds are sorted by order ascending", () => {
  const builds = [makeBuild("b", 2), makeBuild("a", 0), makeBuild("c", 1)];
  const result = sortedBuildsForTree(builds);
  expect(result.map((b) => b.id)).toEqual(["a", "c", "b"]);
});

test("breakpoints within each build are sorted by order ascending", () => {
  const builds = [
    makeBuild("x", 0, [
      { id: "bp3", order: 2 },
      { id: "bp1", order: 0 },
      { id: "bp2", order: 1 },
    ]),
  ];
  const result = sortedBuildsForTree(builds);
  expect(result[0].breakpoints.map((bp) => bp.id)).toEqual(["bp1", "bp2", "bp3"]);
});

test("does not mutate the input array", () => {
  const builds = [makeBuild("b", 1), makeBuild("a", 0)];
  const copy = [...builds];
  sortedBuildsForTree(builds);
  expect(builds[0].id).toBe(copy[0].id);
});
