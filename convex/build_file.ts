export type PassiveNode = {
  id: string;
  weapon_set?: number;
  additional_text?: string;
};

export type BuildFileData = {
  name: string;
  ascendancy: string;
  passives: PassiveNode[];
  skills?: unknown[];
  inventory_slots?: unknown[];
};

export function parseFilename(filename: string): { buildSetName: string; breakpointName: string } {
  const noExt = filename.endsWith(".build") ? filename.slice(0, -6) : filename;
  const tildeIdx = noExt.indexOf("~");
  if (tildeIdx === -1) {
    return { buildSetName: noExt, breakpointName: "" };
  }
  return {
    buildSetName: noExt.slice(0, tildeIdx),
    breakpointName: noExt.slice(tildeIdx + 1),
  };
}

export function parseBuildFile(json: unknown): BuildFileData {
  if (typeof json !== "object" || json === null) {
    throw new Error("Invalid build file: expected an object");
  }
  const obj = json as Record<string, unknown>;
  if (typeof obj.name !== "string") throw new Error("Invalid build file: missing name");
  if (typeof obj.ascendancy !== "string") throw new Error("Invalid build file: missing ascendancy");
  if (!Array.isArray(obj.passives)) throw new Error("Invalid build file: missing passives");

  const passives: PassiveNode[] = obj.passives.map((p, i) => {
    if (typeof p !== "object" || p === null || typeof (p as Record<string, unknown>).id !== "string") {
      throw new Error(`Invalid passive at index ${i}`);
    }
    const node = p as Record<string, unknown>;
    const result: PassiveNode = { id: node.id as string };
    if (typeof node.weapon_set === "number") result.weapon_set = node.weapon_set;
    if (typeof node.additional_text === "string") result.additional_text = node.additional_text;
    return result;
  });

  return {
    name: obj.name,
    ascendancy: obj.ascendancy,
    passives,
    skills: Array.isArray(obj.skills) ? obj.skills : undefined,
    inventory_slots: Array.isArray(obj.inventory_slots) ? obj.inventory_slots : undefined,
  };
}

export function serializeBuildFile(
  breakpoint: { name: string; passives: PassiveNode[]; selectedAscendancy?: string },
  buildSet: { name: string }
): BuildFileData {
  return {
    name: `${buildSet.name}~${breakpoint.name}`,
    ascendancy: breakpoint.selectedAscendancy ?? "",
    passives: breakpoint.passives,
  };
}
