import { useState } from "react";
import { BuildSet } from "../../services/buildStorage";
import { sortedBuildsForTree } from "./buildTree";
import "./BuildTree.scss";

type Props = {
  builds: BuildSet[];
  selectedBuildId: string | null;
  onSelectBuild: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onReorderBreakpoints?: (buildSetId: string, fromIndex: number, toIndex: number) => void;
};

export function BuildTree({ builds, selectedBuildId, onSelectBuild, onReorder, onReorderBreakpoints }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dragSrcIndex, setDragSrcIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [bpDrag, setBpDrag] = useState<{ buildSetId: string; srcIndex: number } | null>(null);
  const [bpDragOverIndex, setBpDragOverIndex] = useState<number | null>(null);

  const sorted = sortedBuildsForTree(builds);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (sorted.length === 0) {
    return (
      <div className="build-list-empty">
        No builds yet.<br />Click &ldquo;+ New Build&rdquo; to get started.
      </div>
    );
  }

  return (
    <div className="BuildTree">
      {sorted.map((build, index) => {
        const isActive = build.id === selectedBuildId;
        const isCollapsed = collapsed.has(build.id);
        const hasBreakpoints = build.breakpoints.length > 0;
        const isDragging = dragSrcIndex === index;
        const isDragOver = dragOverIndex === index && dragSrcIndex !== index;

        return (
          <div
            key={build.id}
            className={`tree-build${isDragging ? " dragging" : ""}${isDragOver ? " drag-over" : ""}`}
            draggable
            onDragStart={(e) => {
              setDragSrcIndex(index);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverIndex !== index) setDragOverIndex(index);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverIndex(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragSrcIndex !== null && dragSrcIndex !== index) {
                onReorder?.(dragSrcIndex, index);
              }
              setDragSrcIndex(null);
              setDragOverIndex(null);
            }}
            onDragEnd={() => {
              setDragSrcIndex(null);
              setDragOverIndex(null);
            }}
          >
            <button
              className={`tree-folder-row${isActive ? " active" : ""}`}
              onClick={() => onSelectBuild(build.id)}
            >
              <span className="tree-drag-handle" aria-hidden title="Drag to reorder">⠿</span>
              <span
                className={`tree-toggle${hasBreakpoints ? "" : " hidden"}`}
                role="button"
                aria-label={isCollapsed ? "Expand" : "Collapse"}
                onClick={(e) => hasBreakpoints && toggleCollapse(build.id, e)}
              >
                {isCollapsed ? "▶" : "▼"}
              </span>
              <span className="tree-icon folder-icon" aria-hidden>📁</span>
              <span className="tree-name">{build.name}</span>
              {build.className && (
                <span className="tree-meta">{build.className}</span>
              )}
            </button>

            {!isCollapsed && build.breakpoints.map((bp, bpIndex) => {
              const isBpDragging = bpDrag?.buildSetId === build.id && bpDrag.srcIndex === bpIndex;
              const isBpDragOver = bpDrag?.buildSetId === build.id && bpDragOverIndex === bpIndex && bpDrag.srcIndex !== bpIndex;
              return (
                <div
                  key={bp.id}
                  className={`tree-breakpoint-row${isBpDragging ? " dragging" : ""}${isBpDragOver ? " drag-over" : ""}`}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setBpDrag({ buildSetId: build.id, srcIndex: bpIndex });
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (bpDrag?.buildSetId === build.id) {
                      e.dataTransfer.dropEffect = "move";
                      if (bpDragOverIndex !== bpIndex) setBpDragOverIndex(bpIndex);
                    } else {
                      e.dataTransfer.dropEffect = "none";
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setBpDragOverIndex(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (bpDrag?.buildSetId === build.id && bpDrag.srcIndex !== bpIndex) {
                      onReorderBreakpoints?.(build.id, bpDrag.srcIndex, bpIndex);
                    }
                    setBpDrag(null);
                    setBpDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setBpDrag(null);
                    setBpDragOverIndex(null);
                  }}
                >
                  <span className="tree-drag-handle" aria-hidden title="Drag to reorder">⠿</span>
                  <span className="tree-icon file-icon" aria-hidden>📄</span>
                  <span className="tree-name">{bp.name || "Unnamed"}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
