import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildStorage, BuildSet, Breakpoint, type Skill } from "../../services/buildStorage";
import { useEventBus } from "../../hooks/use-event-bus";
import { kAppPopups, kAppScreens } from "../../config/enums";
import { classNames } from "../../utils";
import { BuildTree } from "../BuildTree/BuildTree";
import { SkillsEditor } from "../SkillsEditor/SkillsEditor";
import { parseBuildFile, serializeBuildFile, parseFilename, type BuildFileData } from "../../../convex/build_file";
import { resolveAscendancy } from "../../services/class-ascendancy-map";

import "./ScreenBuilder.scss";

// ── Import dialog state ───────────────────────────────────────────────────────

type ImportDialogState = {
  data: BuildFileData;
  buildSetName: string;
  breakpointName: string;
  inferredClassName: string;
  inferredAscendancy: string;
  mode: "create" | "append";
  targetBuildSetId: string;
};

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

  // Refs so event handlers always see current values without re-registering listeners
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const selectedBuildRef = useRef(selectedBuild);
  selectedBuildRef.current = selectedBuild;

  // Pending (unsaved) class / ascendancy values for the selected build
  const [pendingClass, setPendingClass] = useState(selectedBuild?.className ?? "");
  const [pendingAscendancy, setPendingAscendancy] = useState(
    selectedBuild?.breakpoints.slice().sort((a, b) => a.order - b.order)[0]?.selectedAscendancy ?? ""
  );

  // Sync pending values whenever the selected build changes
  useEffect(() => {
    setPendingClass(selectedBuild?.className ?? "");
    setPendingAscendancy(
      selectedBuild?.breakpoints.slice().sort((a, b) => a.order - b.order)[0]?.selectedAscendancy ?? ""
    );
  }, [selectedBuild?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const classIsDirty = pendingClass !== (selectedBuild?.className ?? "");
  const currentAscendancy =
    selectedBuild?.breakpoints.slice().sort((a, b) => a.order - b.order)[0]?.selectedAscendancy ?? "";
  const ascendancyIsDirty = pendingAscendancy !== currentAscendancy;
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
    const onCreateBreakpoint = async (data: { name: string }) => {
      const currentId = selectedIdRef.current;
      const currentBuild = selectedBuildRef.current;
      if (!currentId) return;

      // Copy nodes from the last step so the user builds on top of it
      const sorted = [...(currentBuild?.breakpoints ?? [])].sort((a, b) => a.order - b.order);
      const lastStep = sorted.at(-1) ?? null;

      await buildStorage.addBreakpoint(currentId, {
        name: data.name,
        passives: lastStep?.passives ?? [],
        selectedAscendancy: lastStep?.selectedAscendancy ?? null,
      });
      await refreshBuilds();
    };

    const onEditBuild = async (data: { id: string; name: string }) => {
      await buildStorage.updateBuildSet(data.id, {
        name: data.name,
      });
      await refreshBuilds();
    };

    const ref = {};
    eventBus.on({
      createBreakpoint: onCreateBreakpoint,
      editBuildSet: onEditBuild,
    }, ref);

    return () => {
      eventBus.off(['createBreakpoint', 'editBuildSet'], ref);
    };
  }, [eventBus, refreshBuilds]);

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
      });
    } else if (ascendancyIsDirty) {
      // Update selectedAscendancy on every breakpoint
      for (const bp of selectedBuild.breakpoints) {
        await buildStorage.updateBreakpoint(selectedBuild.id, bp.id, {
          selectedAscendancy: pendingAscendancy || null,
        });
      }
    }

    await refreshBuilds();
  };

  // ── Steps ─────────────────────────────────────────────────────────────────

  const sortedSteps = useMemo<Breakpoint[]>(() => {
    return (
      selectedBuild?.breakpoints.slice().sort((a, b) => a.order - b.order) ?? []
    );
  }, [selectedBuild]);

  const [showNewBuildForm, setShowNewBuildForm] = useState(false);
  const [newBuildName, setNewBuildName] = useState('');

  const submitNewBuild = async () => {
    const name = newBuildName.trim();
    if (!name) return;
    setShowNewBuildForm(false);
    setNewBuildName('');
    const newBuild = await buildStorage.createBuildSet(name);
    await refreshBuilds();
    setSelectedId(newBuild.id);
    buildStorage.setCurrentBuildSetId(newBuild.id);
  };

  // ── Import / Export ───────────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importState, setImportState] = useState<ImportDialogState | null>(null);

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const data = parseBuildFile(json);
        const { buildSetName, breakpointName } = parseFilename(file.name);
        const resolved = resolveAscendancy(data.ascendancy);
        const inferredClassName = resolved?.className ?? "";
        const matchingBuild = builds.find((b) => b.className === inferredClassName);
        setImportState({
          data,
          buildSetName: buildSetName || data.name || "Imported Build",
          breakpointName: breakpointName || "Step 1",
          inferredClassName,
          inferredAscendancy: resolved?.ascendancy ?? "",
          mode: "create",
          targetBuildSetId: matchingBuild?.id ?? builds[0]?.id ?? "",
        });
      } catch (err) {
        alert(`Failed to parse build file: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importState) return;
    const { data, buildSetName, breakpointName, inferredClassName, inferredAscendancy, mode, targetBuildSetId } = importState;

    let targetId: string;
    if (mode === "create") {
      const newBuild = await buildStorage.createBuildSet(
        buildSetName.trim() || "Imported Build",
        { className: inferredClassName || undefined },
      );
      targetId = newBuild.id;
    } else {
      targetId = targetBuildSetId;
    }

    await buildStorage.addBreakpoint(targetId, {
      name: breakpointName.trim() || "Step 1",
      passives: data.passives,
      selectedAscendancy: inferredAscendancy || null,
    });

    setImportState(null);
    await refreshBuilds();
    setSelectedId(targetId);
    buildStorage.setCurrentBuildSetId(targetId);

    // Directly sync the UI selects — the useEffect only fires when the
    // selected build's ID changes, which doesn't cover the "append to
    // currently-selected build" case, and may lag in "create" mode.
    if (mode === "create") {
      setPendingClass(inferredClassName);
      setPendingAscendancy(inferredAscendancy);
    }
  };

  const handleExportStep = (step: Breakpoint) => {
    if (!selectedBuild) return;
    const fileData = serializeBuildFile(
      { ...step, selectedAscendancy: step.selectedAscendancy ?? undefined },
      selectedBuild,
    );
    const json = JSON.stringify(fileData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedBuild.name}~${step.name}.build`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepName, setEditStepName] = useState("");
  const [editStepOrder, setEditStepOrder] = useState<number>(0);

  const [expandedSkillsStepId, setExpandedSkillsStepId] = useState<string | null>(null);

  const handleSkillsChange = async (step: Breakpoint, skills: Skill[]) => {
    if (!selectedBuild) return;
    await buildStorage.updateBreakpoint(selectedBuild.id, step.id, { skills });
    await refreshBuilds();
  };

  const startEditStep = (step: Breakpoint) => {
    setEditingStepId(step.id);
    setEditStepName(step.name ?? "");
    setEditStepOrder(step.order);
  };

  const cancelEditStep = () => setEditingStepId(null);

  const saveEditStep = async () => {
    if (!selectedBuild || !editingStepId) return;
    await buildStorage.updateBreakpoint(selectedBuild.id, editingStepId, {
      name: editStepName,
      order: editStepOrder,
    });
    setEditingStepId(null);
    await refreshBuilds();
  };

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
          <div className="sidebar-header-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".build"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
            <button
              className="import-build-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Import a .build file"
            >
              Import
            </button>
            <button
              className="new-build-btn"
              onClick={() => { setShowNewBuildForm(true); setNewBuildName(''); }}
              title="Create a new build"
            >
              + New
            </button>
          </div>
        </div>

        {showNewBuildForm && (
          <div className="new-build-inline">
            <input
              className="new-build-input"
              type="text"
              placeholder="Build name"
              value={newBuildName}
              onChange={(e) => setNewBuildName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewBuild();
                if (e.key === 'Escape') setShowNewBuildForm(false);
              }}
              autoFocus
            />
            <button
              className="new-build-confirm"
              onClick={submitNewBuild}
              disabled={!newBuildName.trim()}
            >Create</button>
            <button
              className="new-build-cancel"
              onClick={() => setShowNewBuildForm(false)}
            >✕</button>
          </div>
        )}

        <div
          className={classNames("build-list", { "drag-over": isDragOver })}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleImportFile(file);
          }}
        >
          <BuildTree
            builds={builds}
            selectedBuildId={selectedId}
            onSelectBuild={selectBuild}
          />
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
                  {sortedSteps.map((step) => {
                    const isEditing = editingStepId === step.id;
                    return (
                      <div key={step.id} className={`step-row${isEditing ? " editing" : ""}`}>
                        {isEditing ? (
                          <>
                            <input
                              className="step-edit-level"
                              type="number"
                              min={0}
                              value={editStepOrder}
                              onChange={(e) => setEditStepOrder(Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditStep();
                                if (e.key === "Escape") cancelEditStep();
                              }}
                            />
                            <input
                              className="step-edit-name"
                              type="text"
                              placeholder="Step name"
                              value={editStepName}
                              onChange={(e) => setEditStepName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditStep();
                                if (e.key === "Escape") cancelEditStep();
                              }}
                              autoFocus
                            />
                            <button className="step-save-edit" onClick={saveEditStep}>Save</button>
                            <button className="step-cancel-edit" onClick={cancelEditStep}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <div className="step-main-row">
                              <span className="step-name">{step.name || "Unnamed"}</span>
                              <span className="step-nodes">
                                {step.passives.length > 0
                                  ? `${step.passives.length} nodes`
                                  : "Empty"}
                              </span>
                              <button
                                className={classNames("step-skills-toggle", {
                                  active: expandedSkillsStepId === step.id,
                                })}
                                title="Edit skills for this step"
                                onClick={() =>
                                  setExpandedSkillsStepId(
                                    expandedSkillsStepId === step.id ? null : step.id
                                  )
                                }
                              >
                                Skills {step.skills.length > 0 && `(${step.skills.length})`}
                              </button>
                              <button
                                className="step-rename"
                                title="Edit step name and level"
                                onClick={() => startEditStep(step)}
                              >
                                Edit
                              </button>
                              <button
                                className="step-edit-tree"
                                title="Edit passive tree for this step"
                                onClick={() => handleEditStepTree(step.id)}
                              >
                                Edit Tree
                              </button>
                              <button
                                className="step-export"
                                title="Export to .build file"
                                onClick={() => handleExportStep(step)}
                              >
                                Export
                              </button>
                              <button
                                className="step-delete"
                                title="Delete step"
                                onClick={() => handleDeleteStep(step.id)}
                              >
                                ×
                              </button>
                            </div>
                            {expandedSkillsStepId === step.id && (
                              <div className="step-skills-panel">
                                <SkillsEditor
                                  skills={step.skills}
                                  onChange={(skills) => handleSkillsChange(step, skills)}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
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

      {/* ── Import dialog ────────────────────────────────────────────────── */}
      {importState && (() => {
        const appendBuilds = importState.inferredClassName
          ? builds.filter((b) => b.className === importState.inferredClassName)
          : builds;
        const targetBuilds = appendBuilds.length > 0 ? appendBuilds : builds;
        return (
          <div className="import-dialog-overlay" onClick={() => setImportState(null)}>
            <div className="import-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="import-dialog-title">Import Build File</div>

              {importState.inferredClassName && (
                <div className="import-info">
                  Detected: <strong>{importState.inferredClassName}</strong>
                  {importState.inferredAscendancy && (
                    <> &mdash; <strong>{importState.inferredAscendancy}</strong></>
                  )}
                </div>
              )}

              <div className="import-mode-tabs">
                <button
                  className={classNames("import-mode-tab", { active: importState.mode === "create" })}
                  onClick={() => setImportState((s) => s && { ...s, mode: "create" })}
                >
                  Create New Build
                </button>
                <button
                  className={classNames("import-mode-tab", { active: importState.mode === "append" })}
                  onClick={() => setImportState((s) => s && { ...s, mode: "append" })}
                  disabled={builds.length === 0}
                >
                  Add to Existing
                </button>
              </div>

              {importState.mode === "create" ? (
                <div className="import-field-group">
                  <label className="field-label">Build Set Name</label>
                  <input
                    className="import-field-input"
                    value={importState.buildSetName}
                    onChange={(e) => setImportState((s) => s && { ...s, buildSetName: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") handleConfirmImport(); }}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="import-field-group">
                  <label className="field-label">Target Build Set</label>
                  <select
                    className="field-select"
                    value={importState.targetBuildSetId}
                    onChange={(e) => setImportState((s) => s && { ...s, targetBuildSetId: e.target.value })}
                  >
                    {targetBuilds.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="import-field-group">
                <label className="field-label">Step Name</label>
                <input
                  className="import-field-input"
                  value={importState.breakpointName}
                  onChange={(e) => setImportState((s) => s && { ...s, breakpointName: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") handleConfirmImport(); }}
                />
              </div>

              <div className="import-node-count">
                {importState.data.passives.length} passive nodes
              </div>

              <div className="import-actions">
                <button className="import-cancel" onClick={() => setImportState(null)}>Cancel</button>
                <button className="import-confirm" onClick={handleConfirmImport}>Import</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
