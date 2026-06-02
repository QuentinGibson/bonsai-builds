import { useEffect, useMemo, useRef, useState } from "react";

import "./GemPicker.scss";

export interface GemEntry {
  id: string;
  name: string;
  isSupport: boolean;
}

export type GemPickerProps = {
  filter: "skill" | "support";
  onPick: (gem: GemEntry) => void;
  onClose: () => void;
};

let cachedGems: GemEntry[] | null = null;

async function loadGems(): Promise<GemEntry[]> {
  if (cachedGems) return cachedGems;
  const res = await fetch("/assets-static/gems.json");
  cachedGems = await res.json();
  return cachedGems!;
}

export function GemPicker({ filter, onPick, onClose }: GemPickerProps) {
  const [gems, setGems] = useState<GemEntry[]>([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGems().then(setGems);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [gems.length]);

  const filtered = useMemo(() => {
    const isSupport = filter === "support";
    const q = query.toLowerCase();
    return gems
      .filter((g) => g.isSupport === isSupport)
      .filter((g) => !q || g.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [gems, filter, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="GemPicker-overlay" onClick={onClose}>
      <div className="GemPicker" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="gp-header">
          <span className="gp-title">{filter === "support" ? "Add Support Gem" : "Add Skill Gem"}</span>
          <button className="gp-close" onClick={onClose}>✕</button>
        </div>
        <input
          ref={inputRef}
          className="gp-search"
          type="text"
          placeholder="Search gems…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="gp-list">
          {filtered.length === 0 && <div className="gp-empty">No gems found</div>}
          {filtered.map((gem) => (
            <button
              key={gem.id}
              className="gp-item"
              onClick={() => onPick(gem)}
            >
              {gem.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
