import { useState } from "react";
import type { InventorySlot } from "../../services/buildStorage";
import { STANDARD_SLOTS, getSlotCoords, getSlotInventoryCategory } from "../../services/slotLookup";
import { ItemPicker, type ItemEntry } from "../ItemPicker/ItemPicker";
import { ModPicker, type ModEntry } from "../ModPicker/ModPicker";
import { AdditionalTextEditor } from "../AdditionalTextEditor/AdditionalTextEditor";

import "./InventorySlotsEditor.scss";

export type InventorySlotsEditorProps = {
  slots: InventorySlot[];
  onChange: (slots: InventorySlot[]) => void;
};

function makeSlot(slotId: string): InventorySlot {
  const coords = getSlotCoords(slotId)!;
  return {
    inventory_id: slotId,
    level_interval: [],
    slot_x: coords.slot_x,
    slot_y: coords.slot_y,
    additional_text: "",
  };
}

function getSlot(slots: InventorySlot[], slotId: string): InventorySlot {
  return slots.find((s) => s.inventory_id === slotId) ?? makeSlot(slotId);
}

function updateSlot(slots: InventorySlot[], updated: InventorySlot): InventorySlot[] {
  const existing = slots.find((s) => s.inventory_id === updated.inventory_id);
  if (existing) {
    return slots.map((s) => (s.inventory_id === updated.inventory_id ? updated : s));
  }
  return [...slots, updated];
}

type PickerState =
  | { type: "item"; slotId: string }
  | { type: "mod"; slotId: string };

export function InventorySlotsEditor({ slots, onChange }: InventorySlotsEditorProps) {
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const [modValuePrompt, setModValuePrompt] = useState<{ mod: ModEntry; slotId: string } | null>(null);
  const [modValue, setModValue] = useState("");

  const handleItemPick = (item: ItemEntry) => {
    if (!picker || picker.type !== "item") return;
    const slot = getSlot(slots, picker.slotId);
    const firstLine = item.name;
    const rest = slot.additional_text.split("\n").slice(1).join("\n");
    const updated = { ...slot, additional_text: rest ? `${firstLine}\n${rest}` : firstLine };
    onChange(updateSlot(slots, updated));
    setPicker(null);
  };

  const handleModPick = (mod: ModEntry) => {
    if (!picker || picker.type !== "mod") return;
    setPicker(null);
    setModValuePrompt({ mod, slotId: picker.slotId });
    setModValue("");
  };

  const handleModValueConfirm = () => {
    if (!modValuePrompt) return;
    const { mod, slotId } = modValuePrompt;
    const slot = getSlot(slots, slotId);
    const formattedMod = mod.name.replace(/#/g, modValue || "?");
    const existing = slot.additional_text;
    const updated = { ...slot, additional_text: existing ? `${existing}\n${formattedMod}` : formattedMod };
    onChange(updateSlot(slots, updated));
    setModValuePrompt(null);
    setModValue("");
  };

  const handleAdditionalTextChange = (slotId: string, value: string) => {
    const slot = getSlot(slots, slotId);
    onChange(updateSlot(slots, { ...slot, additional_text: value }));
  };

  const handleLevelIntervalChange = (slotId: string, index: 0 | 1, value: string) => {
    const slot = getSlot(slots, slotId);
    const parsed = parseInt(value, 10);
    const next = [...(slot.level_interval.length >= 2 ? slot.level_interval : [0, 0])];
    next[index] = isNaN(parsed) ? 0 : parsed;
    onChange(updateSlot(slots, { ...slot, level_interval: next }));
  };

  return (
    <div className="InventorySlotsEditor">
      {STANDARD_SLOTS.map((slotId) => {
        const slot = getSlot(slots, slotId);
        const isExpanded = expandedSlotId === slotId;
        const hasData = slot.additional_text || slot.level_interval.length > 0;
        const firstLine = slot.additional_text.split("\n")[0] || "";

        return (
          <div key={slotId} className={`ise-slot-row${isExpanded ? " expanded" : ""}`}>
            <button
              className={`ise-slot-header${hasData ? " has-data" : ""}`}
              onClick={() => setExpandedSlotId(isExpanded ? null : slotId)}
            >
              <span className="ise-slot-name">{slotId}</span>
              {firstLine && <span className="ise-slot-preview">{firstLine}</span>}
              <span className="ise-slot-chevron">{isExpanded ? "▲" : "▼"}</span>
            </button>

            {isExpanded && (
              <div className="ise-slot-body">
                <div className="ise-actions-row">
                  <button
                    className="ise-btn"
                    onClick={() => setPicker({ type: "item", slotId })}
                  >
                    Pick Item Base
                  </button>
                  <button
                    className="ise-btn"
                    onClick={() => setPicker({ type: "mod", slotId })}
                  >
                    + Add Mod
                  </button>
                </div>

                <div className="ise-level-row">
                  <label className="ise-level-label">Level range</label>
                  <input
                    className="ise-level-input"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="from"
                    value={slot.level_interval[0] ?? ""}
                    onChange={(e) => handleLevelIntervalChange(slotId, 0, e.target.value)}
                  />
                  <span className="ise-level-sep">–</span>
                  <input
                    className="ise-level-input"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="to"
                    value={slot.level_interval[1] ?? ""}
                    onChange={(e) => handleLevelIntervalChange(slotId, 1, e.target.value)}
                  />
                </div>

                <AdditionalTextEditor
                  value={slot.additional_text}
                  onChange={(v) => handleAdditionalTextChange(slotId, v)}
                />
              </div>
            )}
          </div>
        );
      })}

      {picker?.type === "item" && (
        <ItemPicker
          inventoryId={getSlotInventoryCategory(picker.slotId) ?? picker.slotId}
          onPick={handleItemPick}
          onClose={() => setPicker(null)}
        />
      )}

      {picker?.type === "mod" && (
        <ModPicker
          onPick={handleModPick}
          onClose={() => setPicker(null)}
        />
      )}

      {modValuePrompt && (
        <div className="ise-mod-value-overlay" onClick={() => setModValuePrompt(null)}>
          <div className="ise-mod-value-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="ise-mod-value-title">Enter value for:</div>
            <div className="ise-mod-value-name">{modValuePrompt.mod.name}</div>
            <input
              className="ise-mod-value-input"
              type="text"
              placeholder="e.g. 100"
              value={modValue}
              onChange={(e) => setModValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleModValueConfirm();
                if (e.key === "Escape") setModValuePrompt(null);
              }}
              autoFocus
            />
            <div className="ise-mod-value-actions">
              <button className="ise-btn primary" onClick={handleModValueConfirm}>Add</button>
              <button className="ise-btn" onClick={() => setModValuePrompt(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
