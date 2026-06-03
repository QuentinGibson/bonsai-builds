export function findShortestPath(
  connectionGraph: Map<string, string[]>,
  allocatedNodes: Set<string>,
  allAscendancyNodeIds: Set<string>,
  targetNodeId: string
): string[] | null {
  if (allocatedNodes.size === 0) return [];

  const queue: string[] = [targetNodeId];
  const visited = new Set<string>([targetNodeId]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (allocatedNodes.has(currentId)) {
      const path: string[] = [];
      let node = currentId;
      while (parent.has(node)) {
        node = parent.get(node)!;
        if (!allocatedNodes.has(node)) {
          path.push(node);
        }
      }
      return path;
    }

    for (const neighborId of connectionGraph.get(currentId) || []) {
      if (!visited.has(neighborId) && !allAscendancyNodeIds.has(neighborId)) {
        visited.add(neighborId);
        parent.set(neighborId, currentId);
        queue.push(neighborId);
      }
    }
  }

  return null;
}

export function findDisconnectedNodes(
  connectionGraph: Map<string, string[]>,
  allocatedNodes: Set<string>,
  allAscendancyNodeIds: Set<string>,
  startingNodeId: string,
  removedNodeId: string
): string[] {
  const reachable = new Set<string>([startingNodeId]);
  const queue = [startingNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const neighborId of connectionGraph.get(currentId) || []) {
      if (
        !reachable.has(neighborId) &&
        neighborId !== removedNodeId &&
        allocatedNodes.has(neighborId) &&
        !allAscendancyNodeIds.has(neighborId)
      ) {
        reachable.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  const disconnected: string[] = [];
  allocatedNodes.forEach((nodeId) => {
    if (nodeId !== removedNodeId && !reachable.has(nodeId)) {
      disconnected.push(nodeId);
    }
  });
  return disconnected;
}
