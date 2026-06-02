import { useEffect, useMemo, useRef, useState } from "react";

import "./ItemPicker.scss";

export interface ItemEntry {
  id: string;
  name: string;
  inventory_id: string;
}

export type ItemPickerProps = {
  inventoryId: string;
  onPick: (item: ItemEntry) => void;
  onClose: () => void;
};

let cachedItems: ItemEntry[] | null = null;

async function loadItems(): Promise<ItemEntry[]> {
  if (cachedItems) return cachedItems;
  const res = await fetch("/assets-static/items.json");
  cachedItems = await res.json();
  return cachedItems!;
}

export function ItemPicker({ inventoryId, onPick, onClose }: ItemPickerProps) {
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadItems().then(setItems);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [items.length]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items
      .filter((i) => i.inventory_id === inventoryId)
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [items, inventoryId, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="ItemPicker-overlay" onClick={onClose}>
      <div className="ItemPicker" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="ip-header">
          <span className="ip-title">Select Base Item</span>
          <button className="ip-close" onClick={onClose}>✕</button>
        </div>
        <input
          ref={inputRef}
          className="ip-search"
          type="text"
          placeholder="Search items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="ip-list">
          {filtered.length === 0 && <div className="ip-empty">No items found</div>}
          {filtered.map((item) => (
            <button
              key={item.id}
              className="ip-item"
              onClick={() => onPick(item)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
