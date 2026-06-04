import { describe, it, expect } from "vitest";
import {
  parseSvgNodes,
  parseSvgConnections,
  defaultCamera,
  applyWheelZoom,
  applyDragPan,
  computeCanvasTransform,
  parseAscendancyTransform,
  selectCanvasNodes,
} from "./canvasTreeRenderer";

// ── defaultCamera ─────────────────────────────────────────────────────────────

describe("defaultCamera", () => {
  it("returns zoom=1 and zero pan", () => {
    expect(defaultCamera()).toEqual({ zoom: 1.0, panX: 0, panY: 0 });
  });

  it("returns a new object each call (not a shared reference)", () => {
    const a = defaultCamera();
    const b = defaultCamera();
    a.zoom = 99;
    expect(b.zoom).toBe(1.0);
  });
});

// ── applyWheelZoom ────────────────────────────────────────────────────────────

describe("applyWheelZoom", () => {
  it("increases zoom when scrolling up (deltaY < 0)", () => {
    const cam = applyWheelZoom(defaultCamera(), -1, 0.5, 0.5);
    expect(cam.zoom).toBeCloseTo(1.3);
  });

  it("decreases zoom when scrolling down (deltaY > 0)", () => {
    const cam = applyWheelZoom(defaultCamera(), 1, 0.5, 0.5);
    expect(cam.zoom).toBeCloseTo(0.7);
  });

  it("clamps zoom to MIN_ZOOM (0.5) when already at minimum", () => {
    const atMin = { zoom: 0.5, panX: 0, panY: 0 };
    const cam = applyWheelZoom(atMin, 1, 0.5, 0.5); // scroll down = zoom out
    expect(cam.zoom).toBe(0.5);
  });

  it("clamps zoom to MAX_ZOOM (10.0) when already at maximum", () => {
    const atMax = { zoom: 10.0, panX: 0, panY: 0 };
    const cam = applyWheelZoom(atMax, -1, 0.5, 0.5); // scroll up = zoom in
    expect(cam.zoom).toBe(10.0);
  });

  it("zooms around the cursor: the tree-space point under cursor is unchanged", () => {
    // At zoom=1, panX=0, panY=0, normX=0, normY=0 the top-left tree point is
    // BASE_VIEW_X + 0*BASE_VIEW_W = -27125. After zooming in from that corner,
    // the pan adjusts so that same tree point stays at the top-left.
    const before = defaultCamera();
    const after = applyWheelZoom(before, -1, 0, 0); // zoom in from top-left corner
    const BASE_VIEW_X = -27125;
    const BASE_VIEW_Y = -26721;
    // The tree point at normX=0,normY=0 before zoom
    const BASE_VIEW_W = 54401;
    const BASE_VIEW_H = 54020;
    const treePtX = BASE_VIEW_X - before.panX + 0 * (BASE_VIEW_W / before.zoom);
    const treePtY = BASE_VIEW_Y - before.panY + 0 * (BASE_VIEW_H / before.zoom);
    // After zoom, the same normalized position should map to the same tree point
    const newWidth = BASE_VIEW_W / after.zoom;
    const newHeight = BASE_VIEW_H / after.zoom;
    const newTreePtX = BASE_VIEW_X - after.panX + 0 * newWidth;
    const newTreePtY = BASE_VIEW_Y - after.panY + 0 * newHeight;
    expect(newTreePtX).toBeCloseTo(treePtX);
    expect(newTreePtY).toBeCloseTo(treePtY);
  });
});

// ── applyDragPan ──────────────────────────────────────────────────────────────

describe("applyDragPan", () => {
  it("pans right when dx is positive", () => {
    const cam = applyDragPan(defaultCamera(), 10, 0);
    expect(cam.panX).toBeGreaterThan(0);
    expect(cam.panY).toBe(0);
  });

  it("pans down when dy is positive", () => {
    const cam = applyDragPan(defaultCamera(), 0, 10);
    expect(cam.panY).toBeGreaterThan(0);
    expect(cam.panX).toBe(0);
  });

  it("preserves zoom", () => {
    const cam = applyDragPan({ zoom: 2.5, panX: 0, panY: 0 }, 10, 10);
    expect(cam.zoom).toBe(2.5);
  });

  it("clamps panX to MAX_PAN (45000) on large drag", () => {
    const cam = applyDragPan(defaultCamera(), 99999, 0);
    expect(cam.panX).toBe(45000);
  });

  it("clamps panX to -MAX_PAN (-45000) on large negative drag", () => {
    const cam = applyDragPan(defaultCamera(), -99999, 0);
    expect(cam.panX).toBe(-45000);
  });

  it("scales pan by PAN_SCALE/zoom so faster pan at lower zoom", () => {
    const zoom1 = applyDragPan({ zoom: 1, panX: 0, panY: 0 }, 1, 0);
    const zoom2 = applyDragPan({ zoom: 2, panX: 0, panY: 0 }, 1, 0);
    expect(zoom1.panX).toBeCloseTo(zoom2.panX * 2);
  });
});

// ── computeCanvasTransform ────────────────────────────────────────────────────

describe("computeCanvasTransform", () => {
  const BASE_VIEW_W = 54401;
  const BASE_VIEW_X = -27125;
  const BASE_VIEW_Y = -26721;

  it("at default camera, tree top-left corner maps to canvas (0, 0)", () => {
    const cam = defaultCamera();
    const { scale, tx, ty } = computeCanvasTransform(cam, BASE_VIEW_W, 54020);
    // Tree point (BASE_VIEW_X, BASE_VIEW_Y) should map to canvas (0, 0)
    const canvasX = BASE_VIEW_X * scale + tx;
    const canvasY = BASE_VIEW_Y * scale + ty;
    expect(canvasX).toBeCloseTo(0);
    expect(canvasY).toBeCloseTo(0);
  });

  it("at zoom=2, scale is doubled", () => {
    const cam1 = defaultCamera();
    const cam2 = { zoom: 2, panX: 0, panY: 0 };
    const t1 = computeCanvasTransform(cam1, BASE_VIEW_W, 54020);
    const t2 = computeCanvasTransform(cam2, BASE_VIEW_W, 54020);
    expect(t2.scale).toBeCloseTo(t1.scale * 2);
  });

  it("positive panX shifts tree content to the right on canvas", () => {
    const cam0 = defaultCamera();
    const camPanned = { zoom: 1, panX: 1000, panY: 0 };
    const t0 = computeCanvasTransform(cam0, BASE_VIEW_W, 54020);
    const tP = computeCanvasTransform(camPanned, BASE_VIEW_W, 54020);
    // tx increases when panX is positive — same tree node appears further right
    expect(tP.tx).toBeGreaterThan(t0.tx);
  });

  it("positive panY shifts tree content downward on canvas", () => {
    const cam0 = defaultCamera();
    const camPanned = { zoom: 1, panX: 0, panY: 1000 };
    const t0 = computeCanvasTransform(cam0, BASE_VIEW_W, 54020);
    const tP = computeCanvasTransform(camPanned, BASE_VIEW_W, 54020);
    expect(tP.ty).toBeGreaterThan(t0.ty);
  });
});

// ── parseSvgConnections ───────────────────────────────────────────────────────

describe("parseSvgConnections", () => {
  it("extracts fromId and toId from a line element", () => {
    const svg = `<svg><line x1="9748" y1="13658" x2="10538" y2="14256" id="clightning14-lightning37"></line></svg>`;
    const conns = parseSvgConnections(svg);
    expect(conns).toHaveLength(1);
    expect(conns[0]).toEqual({ fromId: "lightning14", toId: "lightning37" });
  });

  it("extracts connections from path elements (ascendancy arcs)", () => {
    const svg = `<svg><path d="M 1 2 A 3 3 0 0 0 4 5" id="cAscendancyRanger3Notable6-AscendancyRanger3Small6"></path></svg>`;
    const conns = parseSvgConnections(svg);
    expect(conns).toHaveLength(1);
    expect(conns[0]).toEqual({ fromId: "AscendancyRanger3Notable6", toId: "AscendancyRanger3Small6" });
  });

  it("handles node ids with underscores", () => {
    const svg = `<svg><line x1="0" y1="0" x2="1" y2="1" id="cpassive_keystone_zealots_oath-strength44"></line></svg>`;
    const conns = parseSvgConnections(svg);
    expect(conns[0]).toEqual({ fromId: "passive_keystone_zealots_oath", toId: "strength44" });
  });

  it("ignores elements with non-c-prefixed ids", () => {
    const svg = `<svg>
      <line id="background-line" x1="0" y1="0" x2="1" y2="1"></line>
      <line id="clightning14-lightning37" x1="0" y1="0" x2="1" y2="1"></line>
    </svg>`;
    const conns = parseSvgConnections(svg);
    expect(conns).toHaveLength(1);
  });

  it("extracts multiple connections", () => {
    const svg = `<svg>
      <line id="clightning14-lightning37"></line>
      <path id="cblind2-blind9"></path>
    </svg>`;
    const conns = parseSvgConnections(svg);
    expect(conns).toHaveLength(2);
    expect(conns.map((c) => c.fromId)).toEqual(["lightning14", "blind2"]);
  });
});

// ── parseAscendancyTransform ──────────────────────────────────────────────────

describe("parseAscendancyTransform", () => {
  it("parses negative dx and dy", () => {
    expect(parseAscendancyTransform("translate(-16049.53, -1939.79)")).toEqual({
      dx: -16049.53,
      dy: -1939.79,
    });
  });

  it("parses positive dy (e.g. Stormweaver)", () => {
    expect(parseAscendancyTransform("translate(0.00, 16231.57)")).toEqual({
      dx: 0,
      dy: 16231.57,
    });
  });

  it("parses mixed signs", () => {
    expect(parseAscendancyTransform("translate(11977.82, -10636.82)")).toEqual({
      dx: 11977.82,
      dy: -10636.82,
    });
  });
});

// ── selectCanvasNodes ─────────────────────────────────────────────────────────

describe("selectCanvasNodes", () => {
  const mainNode = { id: "strength1", x: 100, y: 200, radius: 100 };
  const masteryNode = { id: "mastery_placeholder", x: 0, y: 0, radius: 0 };
  const deadeye1 = { id: "AscendancyRanger1Notable3", x: 15055, y: 2394, radius: 140 };
  const deadeye2 = { id: "AscendancyRanger1Small3", x: 16069, y: 2512, radius: 100 };
  const pathfinder1 = { id: "AscendancyRanger3Notable1_", x: 14000, y: 5000, radius: 140 };

  const allAscendancyIds = new Set([deadeye1.id, deadeye2.id, pathfinder1.id]);
  const deadeyeIds = [deadeye1.id, deadeye2.id];
  const deadeyeTransform = { dx: -16049.53, dy: -1939.79 };

  it("excludes nodes in hiddenNodeIds (mastery placeholders)", () => {
    const result = selectCanvasNodes(
      [mainNode, masteryNode],
      new Set([masteryNode.id]),
      new Set(),
      [],
      null,
    );
    expect(result.map((n) => n.id)).toEqual([mainNode.id]);
  });

  it("includes main tree nodes that are not hidden", () => {
    const result = selectCanvasNodes(
      [mainNode],
      new Set(),
      new Set(),
      [],
      null,
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mainNode.id);
  });

  it("excludes nodes from non-active ascendancy groups", () => {
    const result = selectCanvasNodes(
      [mainNode, pathfinder1],
      new Set(),
      allAscendancyIds,
      deadeyeIds,
      deadeyeTransform,
    );
    expect(result.map((n) => n.id)).not.toContain(pathfinder1.id);
    expect(result.map((n) => n.id)).toContain(mainNode.id);
  });

  it("includes active ascendancy nodes with transform applied", () => {
    const result = selectCanvasNodes(
      [mainNode, deadeye1, deadeye2],
      new Set(),
      allAscendancyIds,
      deadeyeIds,
      deadeyeTransform,
    );
    const d1 = result.find((n) => n.id === deadeye1.id)!;
    expect(d1).toBeDefined();
    expect(d1.x).toBeCloseTo(deadeye1.x + deadeyeTransform.dx);
    expect(d1.y).toBeCloseTo(deadeye1.y + deadeyeTransform.dy);
  });

  it("excludes all ascendancy nodes when activeAscendancyNodeIds is empty", () => {
    const result = selectCanvasNodes(
      [mainNode, deadeye1, pathfinder1],
      new Set(),
      allAscendancyIds,
      [],
      null,
    );
    expect(result.map((n) => n.id)).toEqual([mainNode.id]);
  });
});

// ── parseSvgNodes ─────────────────────────────────────────────────────────────

describe("parseSvgNodes", () => {
  it("extracts id, x, y, and radius from a single circle", () => {
    const svg = `<svg><circle cx="9748" cy="13658" r="100" class="normal" id="nlightning14"></circle></svg>`;
    const nodes = parseSvgNodes(svg);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual({ id: "lightning14", x: 9748, y: 13658, radius: 100 });
  });

  it("handles id attribute appearing before cx/cy/r", () => {
    const svg = `<svg><circle id="nlightning14" cx="9748" cy="13658" r="100"></circle></svg>`;
    const nodes = parseSvgNodes(svg);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual({ id: "lightning14", x: 9748, y: 13658, radius: 100 });
  });

  it("extracts multiple nodes from a snippet", () => {
    const svg = `<svg>
      <circle cx="9748" cy="13658" r="100" id="nlightning14"></circle>
      <circle cx="15885" cy="4853" r="140" id="nAscendancyRanger3Small6"></circle>
    </svg>`;
    const nodes = parseSvgNodes(svg);
    expect(nodes).toHaveLength(2);
    expect(nodes.map((n) => n.id)).toEqual(["lightning14", "AscendancyRanger3Small6"]);
  });

  it("ignores circles without an n-prefixed id", () => {
    const svg = `<svg>
      <circle cx="0" cy="0" r="10" id="background-circle"></circle>
      <circle cx="9748" cy="13658" r="100" id="nlightning14"></circle>
    </svg>`;
    const nodes = parseSvgNodes(svg);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe("lightning14");
  });

  it("handles negative coordinates", () => {
    const svg = `<svg><circle cx="-26047" cy="-13830" r="200" id="npassive_keystone_zealots_oath"></circle></svg>`;
    const nodes = parseSvgNodes(svg);
    expect(nodes[0]).toEqual({ id: "passive_keystone_zealots_oath", x: -26047, y: -13830, radius: 200 });
  });
});
