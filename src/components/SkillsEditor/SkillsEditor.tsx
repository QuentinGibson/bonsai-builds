import { useState } from "react";
import type { Skill, SupportSkill } from "../../services/buildStorage";
import { GemPicker, type GemEntry } from "../GemPicker/GemPicker";
import { AdditionalTextEditor } from "../AdditionalTextEditor/AdditionalTextEditor";

import "./SkillsEditor.scss";

type GemPickerTarget =
  | { type: "skill" }
  | { type: "support"; skillIndex: number };

export type SkillsEditorProps = {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
};

export function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const [pickerTarget, setPickerTarget] = useState<GemPickerTarget | null>(null);

  const handlePickGem = (gem: GemEntry) => {
    if (!pickerTarget) return;
    if (pickerTarget.type === "skill") {
      onChange([
        ...skills,
        { id: gem.id, level_interval: [], support_skills: [] },
      ]);
    } else {
      const next = skills.map((s, i) => {
        if (i !== pickerTarget.skillIndex) return s;
        return {
          ...s,
          support_skills: [
            ...s.support_skills,
            { id: gem.id, level_interval: [] },
          ],
        };
      });
      onChange(next);
    }
    setPickerTarget(null);
  };

  const updateSkill = (index: number, partial: Partial<Skill>) => {
    onChange(skills.map((s, i) => (i === index ? { ...s, ...partial } : s)));
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const updateSupport = (
    skillIndex: number,
    supIndex: number,
    partial: Partial<SupportSkill>
  ) => {
    updateSkill(skillIndex, {
      support_skills: skills[skillIndex].support_skills.map((s, i) =>
        i === supIndex ? { ...s, ...partial } : s
      ),
    });
  };

  const removeSupport = (skillIndex: number, supIndex: number) => {
    updateSkill(skillIndex, {
      support_skills: skills[skillIndex].support_skills.filter(
        (_, i) => i !== supIndex
      ),
    });
  };

  return (
    <div className="SkillsEditor">
      {skills.map((skill, si) => (
        <div key={si} className="se-skill-row">
          <div className="se-skill-header">
            <span className="se-skill-name">{skill.id}</span>
            <button
              className="se-remove"
              title="Remove skill"
              onClick={() => removeSkill(si)}
            >
              ×
            </button>
          </div>

          <div className="se-skill-body">
            <AdditionalTextEditor
              value={skill.additional_text ?? ""}
              onChange={(v) => updateSkill(si, { additional_text: v || undefined })}
            />

            {skill.support_skills.map((sup, spi) => (
              <div key={spi} className="se-support-row">
                <span className="se-support-dot">└</span>
                <span className="se-support-name">{sup.id}</span>
                <AdditionalTextEditor
                  value={sup.additional_text ?? ""}
                  onChange={(v) =>
                    updateSupport(si, spi, { additional_text: v || undefined })
                  }
                />
                <button
                  className="se-remove"
                  title="Remove support"
                  onClick={() => removeSupport(si, spi)}
                >
                  ×
                </button>
              </div>
            ))}

            <button
              className="se-add-support"
              onClick={() => setPickerTarget({ type: "support", skillIndex: si })}
            >
              + Add Support
            </button>
          </div>
        </div>
      ))}

      <button
        className="se-add-skill"
        onClick={() => setPickerTarget({ type: "skill" })}
      >
        + Add Skill
      </button>

      {pickerTarget && (
        <GemPicker
          filter={pickerTarget.type === "support" ? "support" : "skill"}
          onPick={handlePickGem}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}

