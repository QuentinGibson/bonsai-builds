import { useCallback, useEffect, useRef, useState } from "react";
import { buildStorage, BuildSet, SkillGemEntry, SupportGemSlot } from "../../services/buildStorage";
import gemsData from "../../data/gems.json";

import "./SkillsPanel.scss";

// ── Gem data types ────────────────────────────────────────────────────────────

interface GemDef {
  key: string;
  name: string;
  color: number;
  support: boolean;
  maxLevel: number;
  description: string;
  castTime: number;
  iconUrl: string;
}

const ALL_GEMS = gemsData as GemDef[];
const ACTIVE_GEMS = ALL_GEMS.filter((g) => !g.support);
const SUPPORT_GEMS = ALL_GEMS.filter((g) => g.support);

function gemColor(color: number): string {
  if (color === 1) return "red";
  if (color === 2) return "green";
  if (color === 3) return "blue";
  return "white";
}

function makeEmptySupports(): (SupportGemSlot | null)[] {
  return [null, null, null, null, null, null];
}

// ── Sub-components ────────────────────────────────────────────────────────────

type GemPickerProps = {
  gems: GemDef[];
  onSelect: (gem: GemDef) => void;
  onClose: () => void;
  placeholder?: string;
};

function GemPicker({ gems, onSelect, onClose, placeholder }: GemPickerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim()
    ? gems.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
    : gems;

  return (
    <div className="gem-picker-overlay" onMouseDown={onClose}>
      <div className="gem-picker" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="gem-picker-search"
          placeholder={placeholder ?? "Search gems…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="gem-picker-list">
          {filtered.slice(0, 60).map((g) => (
            <button
              key={g.key}
              className={`gem-picker-item color-${gemColor(g.color)}`}
              onClick={() => onSelect(g)}
            >
              <span className="gem-picker-dot" />
              {g.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="gem-picker-empty">No gems found</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export type SkillsPanelProps = {
  build: BuildSet;
  onRefresh: () => Promise<void>;
};

export function SkillsPanel({ build, onRefresh }: SkillsPanelProps) {
  const sortedSteps = [...build.breakpoints].sort((a, b) => a.level - b.level);
  const [activeStepId, setActiveStepId] = useState<string | null>(
    sortedSteps[0]?.id ?? null
  );

  // Keep activeStepId valid when steps change
  useEffect(() => {
    const sorted = [...build.breakpoints].sort((a, b) => a.level - b.level);
    if (!activeStepId || !sorted.find((s) => s.id === activeStepId)) {
      setActiveStepId(sorted[0]?.id ?? null);
    }
  }, [build.breakpoints, activeStepId]);

  const activeStep = build.breakpoints.find((bp) => bp.id === activeStepId) ?? null;
  const skills = activeStep?.skills ?? [];

  // Picker state
  const [addingSkill, setAddingSkill] = useState(false);
  const [addingSupportFor, setAddingSupportFor] = useState<{ skillId: string; slot: number } | null>(null);
  // Which filled socket has its popover open: "skillId:slotIndex"
  const [openSocket, setOpenSocket] = useState<string | null>(null);

  const toggleSocket = (skillId: string, slot: number) => {
    const key = `${skillId}:${slot}`;
    setOpenSocket((prev) => (prev === key ? null : key));
  };

  // ── Drag-to-reorder ──────────────────────────────────────────────────────
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (dropIndex: number) => {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    const reordered = [...skills];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    dragIndexRef.current = null;
    setDragOverIndex(null);
    await saveSkills(reordered);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  // ── Skill mutations ──────────────────────────────────────────────────────

  const saveSkills = useCallback(async (newSkills: SkillGemEntry[]) => {
    if (!activeStep) return;
    await buildStorage.updateBreakpoint(build.id, activeStep.id, { skills: newSkills });
    await onRefresh();
  }, [build.id, activeStep, onRefresh]);

  const handleAddSkill = async (gem: GemDef) => {
    setAddingSkill(false);
    const entry: SkillGemEntry = {
      id: Math.random().toString(36).slice(2),
      name: gem.name,
      color: gem.color as 1 | 2 | 3,
      iconUrl: gem.iconUrl || undefined,
      supports: makeEmptySupports(),
    };
    await saveSkills([...skills, entry]);
  };

  const handleRemoveSkill = async (skillId: string) => {
    await saveSkills(skills.filter((s) => s.id !== skillId));
  };

  const handleAddSupport = async (gem: GemDef) => {
    if (!addingSupportFor) return;
    const { skillId, slot } = addingSupportFor;
    setAddingSupportFor(null);
    const support: SupportGemSlot = {
      name: gem.name,
      color: gem.color as 1 | 2 | 3,
      iconUrl: gem.iconUrl || undefined,
    };
    await saveSkills(
      skills.map((s) => {
        if (s.id !== skillId) return s;
        const newSupports = [...s.supports];
        newSupports[slot] = support;
        return { ...s, supports: newSupports };
      })
    );
  };

  const handleRemoveSupport = async (skillId: string, slot: number) => {
    await saveSkills(
      skills.map((s) => {
        if (s.id !== skillId) return s;
        const newSupports = [...s.supports];
        newSupports[slot] = null;
        return { ...s, supports: newSupports };
      })
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="SkillsPanel">
      <div className="skills-header">
        <span className="skills-title">Skill Gems</span>
        {activeStep && (
          <button className="add-skill-btn" onClick={() => setAddingSkill(true)}>
            + Add Skill
          </button>
        )}
      </div>

      {/* Step tabs */}
      {sortedSteps.length > 0 && (
        <div className="skills-step-tabs">
          {sortedSteps.map((step) => (
            <button
              key={step.id}
              className={`skills-step-tab${activeStepId === step.id ? " active" : ""}`}
              onClick={() => setActiveStepId(step.id)}
            >
              <span className="tab-level">L{step.level}</span>
              <span className="tab-name">{step.name || "Unnamed"}</span>
            </button>
          ))}
        </div>
      )}

      {/* No steps */}
      {sortedSteps.length === 0 && (
        <div className="skills-empty">Create a step above to add skill gems.</div>
      )}

      {/* Skill gem rows */}
      {activeStep && (
        <div className="skills-list" onClick={(e) => {
          // close open socket popover if clicking outside a socket-wrapper-inner
          if (!(e.target as HTMLElement).closest('.socket-wrapper-inner')) {
            setOpenSocket(null);
          }
        }}>
          {skills.length === 0 && (
            <div className="skills-empty">No skill gems yet — click "+ Add Skill".</div>
          )}

          {skills.map((skill, index) => (
            <div
              key={skill.id}
              className={`skill-row color-${gemColor(skill.color)}${dragOverIndex === index ? " drag-over" : ""}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              {/* Drag handle */}
              <div className="drag-handle" title="Drag to reorder">
                <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor">
                  <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
                  <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
                  <circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/>
                </svg>
              </div>
              {/* Main gem */}
              <div className="skill-gem">
                <div className={`gem-circle color-${gemColor(skill.color)}`}>
                  {skill.iconUrl
                    ? <img src={skill.iconUrl} alt={skill.name} className="gem-icon" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'; }} />
                    : null}
                  <span className="gem-initial" style={skill.iconUrl ? { display: 'none' } : {}}>{skill.name[0]}</span>
                </div>
                <div className="skill-gem-info">
                  <span className="skill-gem-name">{skill.name}</span>
                </div>
              </div>

              {/* Support sockets */}
              <div className="support-sockets">
                {skill.supports.map((sup, i) => (
                  <div key={i} className="socket-wrapper">
                    {sup ? (
                      <div className="socket-wrapper-inner">
                        <div
                          className={`socket filled color-${gemColor(sup.color)}`}
                          onClick={() => toggleSocket(skill.id, i)}
                        >
                          {sup.iconUrl
                            ? <img src={sup.iconUrl} alt={sup.name} className="socket-icon" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'; }} />
                            : null}
                          <span className="socket-initial" style={sup.iconUrl ? { display: 'none' } : {}}>{sup.name[0]}</span>
                        </div>
                        {openSocket === `${skill.id}:${i}` && (
                          <div className="socket-tooltip">
                            <div className="socket-tooltip-name">{sup.name}</div>
                            <button
                              className="socket-remove"
                              onClick={() => {
                                setOpenSocket(null);
                                handleRemoveSupport(skill.id, i);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        className="socket empty"
                        title="Add support gem"
                        onClick={() => setAddingSupportFor({ skillId: skill.id, slot: i })}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Remove skill */}
              <button
                className="skill-remove"
                title="Remove skill"
                onClick={() => handleRemoveSkill(skill.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pickers */}
      {addingSkill && (
        <GemPicker
          gems={ACTIVE_GEMS}
          placeholder="Search active gems…"
          onSelect={handleAddSkill}
          onClose={() => setAddingSkill(false)}
        />
      )}
      {addingSupportFor && (
        <GemPicker
          gems={SUPPORT_GEMS}
          placeholder="Search support gems…"
          onSelect={handleAddSupport}
          onClose={() => setAddingSupportFor(null)}
        />
      )}
    </section>
  );
}
