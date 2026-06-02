import type { PassiveNode } from "../../services/buildStorage";

export function patchNodeNote(
  nodeId: string,
  text: string,
  passives: PassiveNode[],
): PassiveNode[] {
  return passives.map((node) => {
    if (node.id !== nodeId) return node;
    if (!text) {
      const { additional_text: _, ...rest } = node;
      return rest;
    }
    return { ...node, additional_text: text };
  });
}

export function hasNodeNote(nodeId: string, passives: PassiveNode[]): boolean {
  const node = passives.find((n) => n.id === nodeId);
  return Boolean(node?.additional_text);
}
