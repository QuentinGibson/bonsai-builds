import { describe, it, expect } from 'vitest';
import { findShortestPath, findDisconnectedNodes } from './passiveBFS';

describe('findDisconnectedNodes', () => {
  it('returns [] when only the removed node was allocated', () => {
    const graph = new Map([['A', ['B']], ['B', ['A']]]);
    const allocated = new Set(['A']);
    const result = findDisconnectedNodes(graph, allocated, new Set(), 'A', 'A');
    expect(result).toEqual([]);
  });

  it('returns [] when removing a leaf node', () => {
    // Start=A, allocated A-B-C chain, remove C (leaf)
    const graph = new Map([
      ['A', ['B']], ['B', ['A', 'C']], ['C', ['B']],
    ]);
    const allocated = new Set(['A', 'B', 'C']);
    const result = findDisconnectedNodes(graph, allocated, new Set(), 'A', 'C');
    expect(result).toEqual([]);
  });

  it('returns the disconnected subtree when removing a bridge node', () => {
    // A-B-C-D, all allocated, start=A, remove B (bridge)
    // C and D become disconnected
    const graph = new Map([
      ['A', ['B']], ['B', ['A', 'C']], ['C', ['B', 'D']], ['D', ['C']],
    ]);
    const allocated = new Set(['A', 'B', 'C', 'D']);
    const result = findDisconnectedNodes(graph, allocated, new Set(), 'A', 'B');
    expect(result).toEqual(expect.arrayContaining(['C', 'D']));
    expect(result).toHaveLength(2);
  });
});

describe('findShortestPath', () => {
  it('returns [] when allocatedNodes is empty', () => {
    const graph = new Map([['A', ['B']], ['B', ['A', 'C']], ['C', ['B']]]);
    const result = findShortestPath(graph, new Set(), new Set(), 'C');
    expect(result).toEqual([]);
  });

  it('returns [] when target is already allocated', () => {
    const graph = new Map([['A', ['B']], ['B', ['A']]]);
    const allocated = new Set(['A', 'B']);
    const result = findShortestPath(graph, allocated, new Set(), 'B');
    expect(result).toEqual([]);
  });

  it('returns null when target is unreachable', () => {
    // A-B disconnected from C-D
    const graph = new Map([
      ['A', ['B']], ['B', ['A']],
      ['C', ['D']], ['D', ['C']],
    ]);
    const allocated = new Set(['A']);
    const result = findShortestPath(graph, allocated, new Set(), 'D');
    expect(result).toBeNull();
  });

  it('returns intermediate nodes and target for a linear chain', () => {
    // allocated: A; target: C; BFS from C finds A via B
    // path reconstruction walks A→B→C, returning unallocated nodes [B, C]
    const graph = new Map([
      ['A', ['B']], ['B', ['A', 'C']], ['C', ['B']],
    ]);
    const allocated = new Set(['A']);
    const result = findShortestPath(graph, allocated, new Set(), 'C');
    expect(result).toEqual(['B', 'C']);
  });

  it('skips ascendancy nodes and returns path through unallocated intermediates', () => {
    // A-B-C-D-E, A allocated, E target, C is ascendancy (blocked)
    // Only path via D: A-B... but C blocks the B-C-D route; need direct B-D edge
    // Graph: A-B, B-D, D-E (C is ascendancy, disconnected from normal path)
    const graph = new Map([
      ['A', ['B']], ['B', ['A', 'D']], ['D', ['B', 'E']], ['E', ['D']],
    ]);
    const allocated = new Set(['A']);
    const ascendancy = new Set(['C']);
    const result = findShortestPath(graph, allocated, ascendancy, 'E');
    // Reconstruction walks A→B→D→E, collecting unallocated: B, D, E
    expect(result).toEqual(['B', 'D', 'E']);
  });
});
