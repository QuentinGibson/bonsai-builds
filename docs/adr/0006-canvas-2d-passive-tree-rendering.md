# Passive tree rendering migrated from SVG to Canvas 2D

The passive tree rendering layer is rewritten from SVG to Canvas 2D. The SVG implementation (~4,700 nodes as DOM elements) produced two hard problems in the Overwolf overlay context: slow initial load from DOM insertion and sluggish pan/drag from paint cost competing with game resources. All reference passive tree planners (pathofexile2.com, maxroll, poeplanner) use canvas for the same reason.

## Architecture

**Two stacked canvas layers.** A static layer holds nodes and connections and is only redrawn when allocation state changes. A dynamic layer holds hover previews and cursor effects and is redrawn on every mousemove/drag. This makes pan/drag — the primary complaint — cheap: only the nearly-empty dynamic layer redraws per frame.

**Grid spatial index for hit detection.** Canvas has no per-element events, so clicks require finding which node sits at the pointer coordinates. Nodes are mapped into a grid at load time; a click checks only nodes in the relevant cell. The alternative (offscreen color-picking canvas with `getImageData`) adds a hidden canvas and an expensive pixel read on every mousemove, which is worse in an overlay context.

## Considered Options

**Further SVG optimization** — virtualization (render only visible nodes), lazy insertion, or OffscreenCanvas rasterization of the SVG. Rejected because the root cost is DOM size: any approach that keeps 4,700 elements in the document pays the insertion and paint cost on load and on any reflow. Virtualization would require rebuilding the element cache and event delegation architecture for minimal gain at this node count.
