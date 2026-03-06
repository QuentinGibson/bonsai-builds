import { useCallback, useEffect, useMemo, useState } from "react";
import { buildStorage, BuildSet, Breakpoint } from "../../services/buildStorage";
import { useEventBus } from "../../hooks/use-event-bus";
import { kAppPopups, kAppScreens } from "../../config/enums";
import { classNames } from "../../utils";

import "./ScreenBuilder.scss";

// ── Static class / ascendancy data ──────────────────────────────────────────

const CLASSES: { name: string; nodeId: string; ascendancies: string[] }[] = [
  { name: "Warrior",   nodeId: "47175", ascendancies: ["Titan", "Warbringer", "Smith of Kitava"] },
  { name: "Ranger",    nodeId: "50459", ascendancies: ["Deadeye", "Pathfinder"] },
  { name: "Huntress",  nodeId: "50459", ascendancies: ["Amazon", "Ritualist"] },
  { name: "Mercenary", nodeId: "50986", ascendancies: ["Tactician", "Witchhunter", "Gemling Legionnaire"] },
  { name: "Sorceress", nodeId: "54447", ascendancies: ["Stormweaver", "Chronomancer", "Disciple of Varashta"] },
  { name: "Witch",     nodeId: "54447", ascendancies: ["Infernalist", "Blood Mage", "Lich"] },
  { name: "Monk",      nodeId: "44683", ascendancies: ["Invoker", "Acolyte of Chayula"] },
  { name: "Druid",     nodeId: "61525", ascendancies: ["Oracle", "Shaman"] },
];

function getAvailableAscendancies(className: string): string[] {
  return CLASSES.find((c) => c.name === className)?.ascendancies ?? [];
}

// ── Component ────────────────────────────────────────────────────────────────

export type ScreenBuilderProps = { className?: string };

export function ScreenBuilder({ className: cls }: ScreenBuilderProps) {
  const eventBus = useEventBus();
  const [builds, setBuilds] = useState<BuildSet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedBuild = builds.find((b) => b.id === selectedId) ?? null;

  // Pending (unsaved) class / ascendancy values for the selected build
  const [pendingClass, setPendingClass] = useState(selectedBuild?.className ?? "");
  const [pendingAscendancy, setPendingAscendancy] = useState(selectedBuild?.ascendancy ?? "");

  // Sync pending values whenever the selected build changes
  useEffect(() => {
    setPendingClass(selectedBuild?.className ?? "");
    setPendingAscendancy(selectedBuild?.ascendancy ?? "");
  }, [selectedBuild?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const classIsDirty = pendingClass !== (selectedBuild?.className ?? "");
  const ascendancyIsDirty = pendingAscendancy !== (selectedBuild?.ascendancy ?? "");
  const classAscendancyDirty = classIsDirty || ascendancyIsDirty;

  // ── Data loading ──────────────────────────────────────────────────────────

  const refreshBuilds = useCallback(async () => {
    const all = await buildStorage.getAllBuildSets();
    setBuilds(all);
  }, []);

  useEffect(() => {
    buildStorage
      .getAllBuildSets()
      .then((all) => {
        setBuilds(all);
        // Pre-select the last-active build
        const savedId = buildStorage.getCurrentBuildSetId();
        if (savedId && all.find((b) => b.id === savedId)) {
          setSelectedId(savedId);
        }
      });
  }, []);

  // ── Event bus listeners ───────────────────────────────────────────────────

  useEffect(() => {
    // Refresh after any build/step mutation that goes through the event bus
    const onCreateBuild = async (name: string) => {
      const newBuild = await buildStorage.createBuildSet(name);
      await refreshBuilds();
      setSelectedId(newBuild.id);
      buildStorage.setCurrentBuildSetId(newBuild.id);
    };

    const onCreateBreakpoint = async (data: { name: string; level: number }) => {
      if (!selectedId) return;

      // Copy nodes from the nearest step below the new level so the user builds on top of it
      const sorted = [...(selectedBuild?.breakpoints ?? [])].sort((a, b) => a.level - b.level);
      const prevStep = sorted.filter((bp) => bp.level < data.level).at(-1) ?? null;

      await buildStorage.addBreakpoint(selectedId, {
        name: data.name,
        level: data.level,
        allocatedNodes: prevStep?.allocatedNodes ?? [],
        allocatedAscendancyNodes: prevStep?.allocatedAscendancyNodes ?? [],
        selectedClass: selectedBuild?.className
          ? (CLASSES.find((c) => c.name === selectedBuild.className)?.nodeId ?? null)
          : null,
        selectedAscendancy: selectedBuild?.ascendancy ?? null,
      });
      await refreshBuilds();
    };

    const onEditBuild = async (data: { id: string; name: string; ascendancy: string | null }) => {
      await buildStorage.updateBuildSet(data.id, {
        name: data.name,
        ascendancy: data.ascendancy ?? undefined,
      });
      await refreshBuilds();
    };

    eventBus.on({
      createBuildSet: onCreateBuild,
      createBreakpoint: onCreateBreakpoint,
      editBuildSet: onEditBuild,
    });
  }, [eventBus, refreshBuilds, selectedId, selectedBuild]);

  // ── Build selection ───────────────────────────────────────────────────────

  const selectBuild = (id: string) => {
    setSelectedId(id);
    buildStorage.setCurrentBuildSetId(id);
  };

  // ── Class / Ascendancy ────────────────────────────────────────────────────

  const handleClassChange = (newClassName: string) => {
    setPendingClass(newClassName);
    // Changing class resets the ascendancy selection
    setPendingAscendancy("");
  };

  const handleAscendancyChange = (newAscendancy: string) => {
    setPendingAscendancy(newAscendancy);
  };

  const handleSaveClassAscendancy = async () => {
    if (!selectedBuild || !classAscendancyDirty) return;

    if (classIsDirty && selectedBuild.breakpoints.length > 0) {
      const stepWord = selectedBuild.breakpoints.length === 1 ? "step" : "steps";
      const confirmed = window.confirm(
        `Changing the starting class will delete all ${selectedBuild.breakpoints.length} ${stepWord} for this build because the starting point changes.\n\nContinue?`
      );
      if (!confirmed) return;
      await buildStorage.clearBreakpoints(selectedBuild.id);
    }

    if (classIsDirty) {
      await buildStorage.updateBuildSet(selectedBuild.id, {
        className: pendingClass || undefined,
        ascendancy: undefined,
      });
    } else if (ascendancyIsDirty) {
      await buildStorage.updateBuildSet(selectedBuild.id, {
        ascendancy: pendingAscendancy || undefined,
      });
      // Reset ascendancy nodes on every step so the tree shows the new ascendancy
      await buildStorage.resetBreakpointsAscendancy(
        selectedBuild.id,
        pendingAscendancy || null
      );
    }

    await refreshBuilds();
  };

  // ── Steps ─────────────────────────────────────────────────────────────────

  const sortedSteps = useMemo<Breakpoint[]>(() => {
    return (
      selectedBuild?.breakpoints.slice().sort((a, b) => a.level - b.level) ?? []
    );
  }, [selectedBuild]);

  const handleDeleteStep = async (stepId: string) => {
    if (!selectedBuild) return;
    if (!window.confirm("Delete this step?")) return;
    await buildStorage.deleteBreakpoint(selectedBuild.id, stepId);
    await refreshBuilds();
  };

  const handleEditStepTree = (stepId: string) => {
    if (!selectedBuild) return;
    buildStorage.setCurrentBuildSetId(selectedBuild.id);
    buildStorage.setPendingBreakpointId(stepId);
    eventBus.emit("setScreen", kAppScreens.Main);
  };

  // ── Build actions ─────────────────────────────────────────────────────────

  const handleDeleteBuild = async (id: string, name: string) => {
    if (!window.confirm(`Delete build "${name}"? This will also delete all steps.`)) return;
    await buildStorage.deleteBuildSet(id);
    if (selectedId === id) {
      setSelectedId(null);
      buildStorage.setCurrentBuildSetId(null);
    }
    await refreshBuilds();
  };

  const availableAscendancies = getAvailableAscendancies(pendingClass);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={classNames("ScreenBuilder", cls)}>
      {/* ── Left: build list ─────────────────────────────────────────────── */}
      <aside className="builder-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">My Builds</span>
          <button
            className="new-build-btn"
            onClick={() => eventBus.emit("setPopup", kAppPopups.AddBuildSet)}
            title="Create a new build"
          >
            + New Build
          </button>
        </div>

        <div className="build-list">
          {builds.length === 0 && (
            <div className="build-list-empty">No builds yet.<br />Click "+ New Build" to get started.</div>
          )}
          {builds.map((b) => {
            const isActive = b.id === selectedId;
            const stepCount = b.breakpoints.length;
            return (
              <button
                key={b.id}
                className={classNames("build-list-item", { active: isActive })}
                onClick={() => selectBuild(b.id)}
              >
                <span className="item-name">{b.name}</span>
                {(b.className || b.ascendancy) && (
                  <span className="item-class">{b.ascendancy ?? b.className}</span>
                )}
                <span className="item-steps">
                  {stepCount === 0 ? "No steps" : stepCount === 1 ? "1 step" : `${stepCount} steps`}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Right: build detail ───────────────────────────────────────────── */}
      <div className="builder-detail">
        {!selectedBuild ? (
          <div className="detail-empty">
            <span className="detail-empty-icon">✦</span>
            <p>Select a build to configure it,<br />or create a new one.</p>
          </div>
        ) : (
          <>
            {/* Detail header */}
            <div className="detail-header">
              <h2 className="detail-name">{selectedBuild.name}</h2>
              <div className="detail-actions">
                <button
                  className="detail-action-btn"
                  title="Rename build"
                  onClick={() =>
                    eventBus.emit("openEditBuildSet", {
                      id: selectedBuild.id,
                      name: selectedBuild.name,
                      ascendancy: selectedBuild.ascendancy ?? null,
                    })
                  }
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                    <path d="M11.498 2.002a1.5 1.5 0 0 1 2.122 2.12l-8.5 8.501a.5.5 0 0 1-.2.122l-3 1a.5.5 0 0 1-.633-.633l1-3a.5.5 0 0 1 .122-.2l8.5-8.5z"/>
                  </svg>
                  Rename
                </button>
                <button
                  className="detail-action-btn danger"
                  title="Delete this build"
                  onClick={() => handleDeleteBuild(selectedBuild.id, selectedBuild.name)}
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Class & Ascendancy */}
            <section className="detail-section">
              <h3 className="section-label">Class &amp; Ascendancy</h3>
              <div className="class-row">
                <div className="field-group">
                  <label className="field-label" htmlFor="builder-class">Starting Class</label>
                  <select
                    id="builder-class"
                    className={classNames("field-select", { dirty: classIsDirty })}
                    value={pendingClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                  >
                    <option value="">— Select class —</option>
                    {CLASSES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="builder-ascendancy">Ascendancy</label>
                  <select
                    id="builder-ascendancy"
                    className={classNames("field-select", { dirty: ascendancyIsDirty })}
                    value={pendingAscendancy}
                    onChange={(e) => handleAscendancyChange(e.target.value)}
                    disabled={availableAscendancies.length === 0}
                  >
                    <option value="">— None —</option>
                    {availableAscendancies.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {classAscendancyDirty && (
                <div className="class-save-row">
                  {classIsDirty && selectedBuild.breakpoints.length > 0 && (
                    <span className="class-save-warning">
                      ⚠ Changing class will delete all steps
                    </span>
                  )}
                  <button
                    className="class-save-btn"
                    onClick={handleSaveClassAscendancy}
                  >
                    Save
                  </button>
                </div>
              )}
            </section>

            {/* Steps */}
            <section className="detail-section steps-section">
              <div className="steps-header">
                <h3 className="section-label">
                  Steps
                  {sortedSteps.length > 0 && (
                    <span className="steps-count">{sortedSteps.length}</span>
                  )}
                </h3>
                <button
                  className="create-step-btn"
                  onClick={() => eventBus.emit("setPopup", kAppPopups.AddBreakpoint)}
                >
                  + Create Step
                </button>
              </div>

              {sortedSteps.length === 0 ? (
                <div className="steps-empty">
                  No steps yet. Create a step to start tracking your passive tree progression by level.
                </div>
              ) : (
                <div className="steps-list">
                  {sortedSteps.map((step) => (
                    <div key={step.id} className="step-row">
                      <span className="step-level">L{step.level}</span>
                      <span className="step-name">{step.name || "Unnamed"}</span>
                      <span className="step-nodes">
                        {step.allocatedNodes.length > 0
                          ? `${step.allocatedNodes.length} nodes`
                          : "Empty"}
                      </span>
                      <button
                        className="step-edit-tree"
                        title="Edit passive tree for this step"
                        onClick={() => handleEditStepTree(step.id)}
                      >
                        Edit Tree
                      </button>
                      <button
                        className="step-delete"
                        title="Delete step"
                        onClick={() => handleDeleteStep(step.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Footer: open in Tree */}
            <div className="detail-footer">
              <button
                className="open-tree-btn"
                onClick={() => eventBus.emit("setScreen", kAppScreens.Main)}
              >
                Open in Tree →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
