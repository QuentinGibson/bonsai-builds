## What to build

Extract `findShortestPath` and `findDisconnectedNodes` out of `PassiveTreeManager` as exported pure functions in a new `passiveBFS.ts` module adjacent to `passiveTreeLogic.ts`. `PassiveTreeManager` delegates to them by passing its own `connectionGraph`, `allocatedNodes`, `allAscendancyNodeIds`, and `startingNodeId` as arguments. The functions have no DOM dependency and no access to instance state.

**Signatures:**

```ts
export function findShortestPath(
  connectionGraph: Map<string, string[]>,
  allocatedNodes: Set<string>,
  allAscendancyNodeIds: Set<string>,
  targetNodeId: string
): string[] | null

export function findDisconnectedNodes(
  connectionGraph: Map<string, string[]>,
  allocatedNodes: Set<string>,
  allAscendancyNodeIds: Set<string>,
  startingNodeId: string,
  removedNodeId: string
): string[]
```

**Tests (`passiveBFS.test.ts`) — synthetic graphs only, no DOM:**

`findShortestPath`:
- Unreachable node → `null`
- Empty `allocatedNodes` → `[]`
- Target already allocated → `[]`
- Linear chain through one intermediate
- Path through multiple unallocated intermediate nodes

`findDisconnectedNodes`:
- Removing a bridge node disconnects a subtree
- Removing a leaf node disconnects nothing
- Single-node allocated set — nothing disconnected

## Acceptance criteria

- [ ] `findShortestPath` and `findDisconnectedNodes` are exported from `passiveBFS.ts`
- [ ] `PassiveTreeManager` private methods delegate to the pure functions; no duplicated BFS logic
- [ ] All 8 BFS unit tests pass (vitest, no DOM)
- [ ] No regression on existing `passiveTreeLogic.test.ts` and `ascendancyConfig.test.ts`

## Blocked by

None — can start immediately
