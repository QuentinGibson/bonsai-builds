import { useCallback, useEffect, useRef, useState } from "react";
import { renderMarkup } from "../../utils/renderMarkup";

import "./AdditionalTextEditor.scss";

const TAGS = [
  { label: "Fire",      tag: "af6025" },
  { label: "Cold",      tag: "3d9dce" },
  { label: "Lightning", tag: "ffe566" },
  { label: "Physical",  tag: "c8c8c8" },
  { label: "Chaos",     tag: "d02090" },
  { label: "Magic",     tag: "8888ff" },
];

export type AdditionalTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function AdditionalTextEditor({ value, onChange }: AdditionalTextEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const handleChange = (next: string) => {
    setDraft(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onChange(next), 500);
  };

  const flushSave = (next: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    onChange(next);
  };

  const insertTag = useCallback((hex: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const selected = draft.slice(start, end);
    const before = draft.slice(0, start);
    const after = draft.slice(end);
    const inserted = `[c ${hex}]${selected}[/c]`;
    const next = before + inserted + after;
    handleChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = before.length + inserted.length;
      ta.setSelectionRange(cursor, cursor);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="AdditionalTextEditor">
      <button
        className={`ate-toggle${expanded ? " open" : ""}${draft ? " has-content" : ""}`}
        type="button"
        onClick={() => setExpanded((v) => !v)}
      >
        Notes{draft ? " ●" : ""} {expanded ? "▲" : "▼"}
      </button>

      {expanded && (
        <>
          <div className="ate-toolbar">
            {TAGS.map(({ label, tag }) => (
              <button
                key={tag}
                className="ate-tag-btn"
                style={{ color: `#${tag}` }}
                type="button"
                onClick={() => insertTag(tag)}
                title={`Insert ${label} color tag`}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            className="ate-textarea"
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { focused.current = true; }}
            onBlur={(e) => { focused.current = false; flushSave(e.target.value); }}
            placeholder="Additional notes… Use toolbar buttons to insert color tags."
            rows={3}
          />
          {draft && (
            <div
              className="ate-preview"
              dangerouslySetInnerHTML={{ __html: renderMarkup(draft) }}
            />
          )}
        </>
      )}
    </div>
  );
}
