/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("marketplace.publish succeeds for a logged-in non-premium user", async () => {
  const t = convexTest(schema, modules);

  await t.mutation(api.users.setPremium, { userId: "user-free", isPremium: false });

  const listingId = await t.mutation(api.marketplace.publish, {
    authorId: "user-free",
    authorName: "Free User",
    name: "My Build",
    description: "A build by a non-premium user",
    className: "Witch",
    breakpoints: [{ name: "Early", order: 0, passives: [] }],
  });

  expect(listingId).toBeTruthy();
  const listing = await t.query(api.marketplace.get, { id: listingId as any });
  expect(listing).not.toBeNull();
  expect(listing!.authorId).toBe("user-free");
});

test("marketplace.publish throws for anonymous user", async () => {
  const t = convexTest(schema, modules);

  await expect(
    t.mutation(api.marketplace.publish, {
      authorId: "anon",
      authorName: "Anonymous",
      name: "My Build",
      description: "",
      className: "Witch",
      breakpoints: [],
    })
  ).rejects.toThrow("Not authorized");
});
