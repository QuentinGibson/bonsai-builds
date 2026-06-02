// Maps .build file ascendancy IDs to { className, ascendancy } pairs.
// Numbers are 1-indexed positions in each class's ascendancy list.
export const ASCENDANCY_MAP: Record<string, { className: string; ascendancy: string }> = {
  Warrior1: { className: "Warrior", ascendancy: "Titan" },
  Warrior2: { className: "Warrior", ascendancy: "Warbringer" },
  Warrior3: { className: "Warrior", ascendancy: "Smith of Kitava" },
  Ranger1:  { className: "Ranger",    ascendancy: "Deadeye" },
  Ranger2:  { className: "Ranger",    ascendancy: "Pathfinder" },
  Huntress1: { className: "Huntress", ascendancy: "Amazon" },
  Huntress2: { className: "Huntress", ascendancy: "Ritualist" },
  Mercenary1: { className: "Mercenary", ascendancy: "Tactician" },
  Mercenary2: { className: "Mercenary", ascendancy: "Witchhunter" },
  Mercenary3: { className: "Mercenary", ascendancy: "Gemling Legionnaire" },
  Sorceress1: { className: "Sorceress", ascendancy: "Stormweaver" },
  Sorceress2: { className: "Sorceress", ascendancy: "Chronomancer" },
  Sorceress3: { className: "Sorceress", ascendancy: "Disciple of Varashta" },
  Witch1: { className: "Witch", ascendancy: "Infernalist" },
  Witch2: { className: "Witch", ascendancy: "Blood Mage" },
  Witch3: { className: "Witch", ascendancy: "Lich" },
  Monk1: { className: "Monk", ascendancy: "Invoker" },
  Monk2: { className: "Monk", ascendancy: "Acolyte of Chayula" },
  Druid1: { className: "Druid", ascendancy: "Oracle" },
  Druid2: { className: "Druid", ascendancy: "Shaman" },
};

const KNOWN_CLASSES = new Set([
  "Warrior", "Ranger", "Huntress", "Mercenary",
  "Sorceress", "Witch", "Monk", "Druid",
]);

export function resolveAscendancy(gameId: string): { className: string; ascendancy: string } | null {
  if (gameId in ASCENDANCY_MAP) return ASCENDANCY_MAP[gameId];
  if (KNOWN_CLASSES.has(gameId)) return { className: gameId, ascendancy: "" };
  return null;
}
