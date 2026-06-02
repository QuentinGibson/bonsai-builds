export const STANDARD_SLOTS = [
  "Weapon1", "Weapon2", "BodyArmour1", "Gloves1", "Boots1",
  "Helm1", "Ring1", "Ring2", "Amulet1", "Belt1",
  "Flask1", "Flask2", "Flask3", "Flask4", "Flask5",
] as const;

export type SlotId = typeof STANDARD_SLOTS[number];

interface SlotMeta {
  slot_x: number;
  slot_y: number;
  /** inventory_id used in items.json / PoB .build files */
  inventory_category: string;
}

const SLOT_LOOKUP: Record<string, SlotMeta> = {
  Weapon1:     { slot_x: 0, slot_y: 0, inventory_category: "Weapon" },
  Weapon2:     { slot_x: 4, slot_y: 0, inventory_category: "Weapon2" },
  Helm1:       { slot_x: 2, slot_y: 0, inventory_category: "Helm" },
  Amulet1:     { slot_x: 3, slot_y: 0, inventory_category: "Amulet" },
  BodyArmour1: { slot_x: 2, slot_y: 1, inventory_category: "BodyArmour" },
  Gloves1:     { slot_x: 0, slot_y: 1, inventory_category: "Gloves" },
  Boots1:      { slot_x: 4, slot_y: 1, inventory_category: "Boots" },
  Ring1:       { slot_x: 1, slot_y: 3, inventory_category: "Ring" },
  Ring2:       { slot_x: 3, slot_y: 3, inventory_category: "Ring2" },
  Belt1:       { slot_x: 2, slot_y: 3, inventory_category: "Belt" },
  Flask1:      { slot_x: 0, slot_y: 4, inventory_category: "Flask1" },
  Flask2:      { slot_x: 1, slot_y: 4, inventory_category: "Flask2" },
  Flask3:      { slot_x: 2, slot_y: 4, inventory_category: "Flask3" },
  Flask4:      { slot_x: 3, slot_y: 4, inventory_category: "Flask4" },
  Flask5:      { slot_x: 4, slot_y: 4, inventory_category: "Flask5" },
};

export function getSlotCoords(slotId: string): { slot_x: number; slot_y: number } | null {
  const entry = SLOT_LOOKUP[slotId];
  if (!entry) return null;
  return { slot_x: entry.slot_x, slot_y: entry.slot_y };
}

export function getSlotInventoryCategory(slotId: string): string | null {
  return SLOT_LOOKUP[slotId]?.inventory_category ?? null;
}
