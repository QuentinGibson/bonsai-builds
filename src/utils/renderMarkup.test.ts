import { describe, expect, it } from "vitest";
import { renderMarkup } from "./renderMarkup";

describe("renderMarkup", () => {
  it("renders known color tag as a named class span", () => {
    const result = renderMarkup("[c af6025]Fire Damage[/c]");
    expect(result).toBe('<span class="mu-fire">Fire Damage</span>');
  });

  it("renders unknown hex color tag as a data-attribute span", () => {
    const result = renderMarkup("[c 123abc]text[/c]");
    expect(result).toBe('<span class="mu-custom" data-c="123abc">text</span>');
  });

  it("renders \\n as a line break", () => {
    const result = renderMarkup("line one\nline two");
    expect(result).toBe("line one<br />line two");
  });

  it("passes through unknown tags unchanged", () => {
    const result = renderMarkup("[boldtext]hello[/boldtext]");
    expect(result).toBe("[boldtext]hello[/boldtext]");
  });
});
