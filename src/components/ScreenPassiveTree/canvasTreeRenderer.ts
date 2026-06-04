// Canvas-based passive tree renderer.
// Pure functions are exported for testability; the CanvasTreeRenderer class
// owns the stateful canvas setup and draw loop.

export type NodePosition = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

export type Connection = {
  fromId: string;
  toId: string;
};

export type CameraState = {
  zoom: number;
  panX: number;
  panY: number;
};

export type CanvasTransform = {
  scale: number;
  tx: number;
  ty: number;
};

// Tree-space bounding box constants (from SVG viewBox baseline)
const BASE_VIEW_X = -27125;
const BASE_VIEW_Y = -26721;
const BASE_VIEW_W = 54401;
const BASE_VIEW_H = 54020;

const MAX_PAN = 45000;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10.0;
const ZOOM_STEP = 0.3;
const PAN_SCALE = 50;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Parse `translate(dx, dy)` from an ascendancy config transform string. */
export function parseAscendancyTransform(transform: string): { dx: number; dy: number } {
  const m = transform.match(/translate\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)/);
  if (!m) return { dx: 0, dy: 0 };
  return { dx: parseFloat(m[1]), dy: parseFloat(m[2]) };
}

/**
 * Return the subset of nodes to draw on the static canvas layer:
 * - Main tree nodes: not in allAscendancyNodeIds and not in hiddenNodeIds
 * - Active ascendancy nodes: those in activeAscendancyNodeIds, with the ascendancy
 *   transform applied (dx, dy added to x, y) so they appear centred at the tree origin
 */
export function selectCanvasNodes(
  nodes: NodePosition[],
  hiddenNodeIds: Set<string>,
  allAscendancyNodeIds: Set<string>,
  activeAscendancyNodeIds: string[],
  transform: { dx: number; dy: number } | null,
): NodePosition[] {
  const activeSet = new Set(activeAscendancyNodeIds);
  const result: NodePosition[] = [];
  for (const node of nodes) {
    if (hiddenNodeIds.has(node.id)) continue;
    if (allAscendancyNodeIds.has(node.id)) {
      if (!activeSet.has(node.id) || !transform) continue;
      result.push({ ...node, x: node.x + transform.dx, y: node.y + transform.dy });
    } else {
      result.push(node);
    }
  }
  return result;
}

/** Parse `<circle id="n{id}" cx cy r>` elements out of raw SVG text. */
export function parseSvgNodes(svgText: string): NodePosition[] {
  const tagPattern = /<circle\b[^>]*\bid="n([^"]+)"[^>]*>/g;
  const result: NodePosition[] = [];
  for (const match of svgText.matchAll(tagPattern)) {
    const tag = match[0];
    const id = match[1];
    const x = parseFloat(tag.match(/\bcx="([^"]+)"/)?.[1] ?? "0");
    const y = parseFloat(tag.match(/\bcy="([^"]+)"/)?.[1] ?? "0");
    const radius = parseFloat(tag.match(/\br="([^"]+)"/)?.[1] ?? "0");
    result.push({ id, x, y, radius });
  }
  return result;
}

/** Parse `<line id="c…">` and `<path id="c…">` connection elements out of raw SVG text. */
export function parseSvgConnections(svgText: string): Connection[] {
  const tagPattern = /<(?:line|path)\b[^>]*\bid="c([^"]+)"[^>]*>/g;
  const result: Connection[] = [];
  for (const match of svgText.matchAll(tagPattern)) {
    const rawId = match[1]; // e.g. "lightning14-lightning37"
    const dashIdx = rawId.indexOf("-");
    if (dashIdx === -1) continue;
    const fromId = rawId.slice(0, dashIdx);
    const toId = rawId.slice(dashIdx + 1);
    if (fromId && toId) result.push({ fromId, toId });
  }
  return result;
}

/** Initial camera state. */
export function defaultCamera(): CameraState {
  return { zoom: 1.0, panX: 0, panY: 0 };
}

/**
 * Compute new camera after a wheel event.
 * @param deltaY  positive = scroll down = zoom out
 * @param normX   cursor X as fraction of container width  (0..1)
 * @param normY   cursor Y as fraction of container height (0..1)
 */
export function applyWheelZoom(
  camera: CameraState,
  deltaY: number,
  normX: number,
  normY: number,
): CameraState {
  const oldWidth = BASE_VIEW_W / camera.zoom;
  const oldHeight = BASE_VIEW_H / camera.zoom;
  // Tree-space point currently under the cursor
  const svgX = BASE_VIEW_X - camera.panX + normX * oldWidth;
  const svgY = BASE_VIEW_Y - camera.panY + normY * oldHeight;

  const newZoom = clamp(camera.zoom + (deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP), MIN_ZOOM, MAX_ZOOM);

  const newWidth = BASE_VIEW_W / newZoom;
  const newHeight = BASE_VIEW_H / newZoom;
  const panX = clamp(BASE_VIEW_X + normX * newWidth - svgX, -MAX_PAN, MAX_PAN);
  const panY = clamp(BASE_VIEW_Y + normY * newHeight - svgY, -MAX_PAN, MAX_PAN);

  return { zoom: newZoom, panX, panY };
}

/**
 * Compute new camera after dragging by (dx, dy) pixels.
 */
export function applyDragPan(
  camera: CameraState,
  dx: number,
  dy: number,
): CameraState {
  const panX = clamp(camera.panX + (dx * PAN_SCALE) / camera.zoom, -MAX_PAN, MAX_PAN);
  const panY = clamp(camera.panY + (dy * PAN_SCALE) / camera.zoom, -MAX_PAN, MAX_PAN);
  return { zoom: camera.zoom, panX, panY };
}

/**
 * Compute the `ctx.setTransform(scale,0,0,scale,tx,ty)` arguments that map
 * tree-space coordinates onto the canvas, respecting the current camera.
 */
export function computeCanvasTransform(
  camera: CameraState,
  canvasWidth: number,
  canvasHeight: number,
): CanvasTransform {
  // Uniform scale based on width; the tree is nearly square so distortion is minimal
  const scale = (camera.zoom * canvasWidth) / BASE_VIEW_W;
  const tx = (Math.abs(BASE_VIEW_X) + camera.panX) * scale;
  const ty = (Math.abs(BASE_VIEW_Y) + camera.panY) * scale;
  return { scale, tx, ty };
}

// ── CanvasTreeRenderer ────────────────────────────────────────────────────────
// Stateful class; DOM and canvas interactions live here.

export class CanvasTreeRenderer {
  private staticCanvas: HTMLCanvasElement | null = null;
  private dynamicCanvas: HTMLCanvasElement | null = null;
  private camera: CameraState = defaultCamera();
  private rawNodes: NodePosition[] = [];
  private connections: Connection[] = [];
  private hiddenNodeIds = new Set<string>();
  private allAscendancyNodeIds = new Set<string>();
  private activeAscendancyNodeIds: string[] = [];
  private activeAscendancyTransform: { dx: number; dy: number } | null = null;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private dragRafPending = false;

  setup(container: HTMLElement): void {
    // Two stacked canvases: static (nodes+edges) below, dynamic (hover, preview) above
    this.staticCanvas = document.createElement("canvas");
    this.dynamicCanvas = document.createElement("canvas");

    for (const canvas of [this.staticCanvas, this.dynamicCanvas]) {
      canvas.style.position = "absolute";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }
    this.dynamicCanvas.style.pointerEvents = "none";

    container.style.position = "relative";
    container.appendChild(this.staticCanvas);
    container.appendChild(this.dynamicCanvas);

    this.bindEvents(container);
    this.syncCanvasSize();
  }

  private syncCanvasSize(): void {
    if (!this.staticCanvas || !this.dynamicCanvas) return;
    const w = this.staticCanvas.clientWidth || 800;
    const h = this.staticCanvas.clientHeight || 600;
    for (const c of [this.staticCanvas, this.dynamicCanvas]) {
      c.width = w;
      c.height = h;
    }
  }

  getCamera(): CameraState {
    return { ...this.camera };
  }

  setCamera(camera: CameraState): void {
    this.camera = { ...camera };
    this.drawStatic();
    this.dispatchZoomEvent();
  }

  resetCamera(): void {
    this.setCamera(defaultCamera());
  }

  loadTree(
    nodes: NodePosition[],
    connections: Connection[],
    hiddenNodeIds?: Set<string>,
    allAscendancyNodeIds?: Set<string>,
  ): void {
    this.rawNodes = nodes;
    this.connections = connections;
    if (hiddenNodeIds) this.hiddenNodeIds = hiddenNodeIds;
    if (allAscendancyNodeIds) this.allAscendancyNodeIds = allAscendancyNodeIds;
    this.drawStatic();
  }

  setAscendancy(activeNodeIds: string[], transform: { dx: number; dy: number } | null): void {
    this.activeAscendancyNodeIds = activeNodeIds;
    this.activeAscendancyTransform = transform;
    this.drawStatic();
  }

  private drawStatic(): void {
    if (!this.staticCanvas) return;
    const ctx = this.staticCanvas.getContext("2d");
    if (!ctx) return;

    const { scale, tx, ty } = computeCanvasTransform(
      this.camera,
      this.staticCanvas.width,
      this.staticCanvas.height,
    );

    ctx.clearRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);
    ctx.setTransform(scale, 0, 0, scale, tx, ty);

    const nodes = selectCanvasNodes(
      this.rawNodes,
      this.hiddenNodeIds,
      this.allAscendancyNodeIds,
      this.activeAscendancyNodeIds,
      this.activeAscendancyTransform,
    );
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Connections
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 3 / scale;
    for (const conn of this.connections) {
      const a = nodeMap.get(conn.fromId);
      const b = nodeMap.get(conn.toId);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Nodes
    ctx.fillStyle = "#444";
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 2 / scale;
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.resetTransform();
  }

  private bindEvents(container: HTMLElement): void {
    container.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    container.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.camera = applyDragPan(this.camera, dx, dy);
      if (!this.dragRafPending) {
        this.dragRafPending = true;
        requestAnimationFrame(() => {
          this.dragRafPending = false;
          this.drawStatic();
        });
      }
    });
    container.addEventListener("mouseup", () => { this.isDragging = false; });
    container.addEventListener("mouseleave", () => { this.isDragging = false; });
    container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;
      this.camera = applyWheelZoom(this.camera, e.deltaY, normX, normY);
      this.drawStatic();
      this.dispatchZoomEvent();
    }, { passive: false });
  }

  private lastDispatchedZoom = -1;
  private dispatchZoomEvent(): void {
    if (this.camera.zoom === this.lastDispatchedZoom) return;
    this.lastDispatchedZoom = this.camera.zoom;
    document.dispatchEvent(
      new CustomEvent("treezoomchange", { detail: { zoom: this.camera.zoom } }),
    );
  }
}
