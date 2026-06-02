import { describe, expect, it } from "vitest";
import { getSlotCoords, STANDARD_SLOTS } from "./slotLookup";

describe("getSlotCoords", () => {
  it("returns coords for Weapon1", () => {
    expect(getSlotCoords("Weapon1")).toEqual({ slot_x: 0, slot_y: 0 });
  });

  it("returns coords for Weapon2", () => {
    expect(getSlotCoords("Weapon2")).toEqual({ slot_x: 4, slot_y: 0 });
  });

  it("returns coords for BodyArmour1", () => {
    expect(getSlotCoords("BodyArmour1")).toEqual({ slot_x: 2, slot_y: 1 });
  });

  it("returns coords for all 14 standard slots", () => {
    const allSlotIds = [
      "Weapon1", "Weapon2", "BodyArmour1", "Gloves1", "Boots1",
      "Helm1", "Ring1", "Ring2", "Amulet1", "Belt1",
      "Flask1", "Flask2", "Flask3", "Flask4", "Flask5",
    ];
    for (const id of allSlotIds) {
      const coords = getSlotCoords(id);
      expect(coords, `${id} should have coords`).not.toBeNull();
      expect(typeof coords!.slot_x).toBe("number");
      expect(typeof coords!.slot_y).toBe("number");
    }
  });

  it("returns null for unknown slot", () => {
    expect(getSlotCoords("Unknown99")).toBeNull();
  });

  it("STANDARD_SLOTS covers all 14 slot IDs", () => {
    expect(STANDARD_SLOTS).toHaveLength(15);
    expect(STANDARD_SLOTS[0]).toBe("Weapon1");
  });
});
