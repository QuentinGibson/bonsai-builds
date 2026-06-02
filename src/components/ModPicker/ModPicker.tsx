import { useEffect, useMemo, useRef, useState } from "react";

import "./ModPicker.scss";

export interface ModEntry {
  id: string;
  name: string;
}

export type ModPickerProps = {
  onPick: (mod: ModEntry) => void;
  onClose: () => void;
};

let cachedMods: ModEntry[] | null = null;

async function loadMods(): Promise<ModEntry[]> {
  if (cachedMods) return cachedMods;
  const res = await fetch("/assets-static/mods.json");
  cachedMods = await res.json();
  return cachedMods!;
}

export function ModPicker({ onPick, onClose }: ModPickerProps) {
  const [mods, setMods] = useState<ModEntry[]>([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMods().then(setMods);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mods.length]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return mods
      .filter((m) => !q || m.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [mods, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="ModPicker-overlay" onClick={onClose}>
      <div className="ModPicker" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="mp-header">
          <span className="mp-title">Add Mod</span>
          <button className="mp-close" onClick={onClose}>✕</button>
        </div>
        <input
          ref={inputRef}
          className="mp-search"
          type="text"
          placeholder="Search mods…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mp-list">
          {filtered.length === 0 && <div className="mp-empty">No mods found</div>}
          {filtered.map((mod) => (
            <button
              key={mod.id}
              className="mp-item"
              onClick={() => onPick(mod)}
            >
              {mod.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
