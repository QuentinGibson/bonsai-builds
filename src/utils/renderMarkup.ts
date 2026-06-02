const KNOWN: Record<string, string> = {
  af6025: "mu-fire",
  "3d9dce": "mu-cold",
  ffe566: "mu-lightning",
  c8c8c8: "mu-physical",
  d02090: "mu-chaos",
  "8888ff": "mu-magic",
};

export function renderMarkup(raw: string): string {
  return raw
    .replace(/\[c ([0-9a-fA-F]{6})\]([\s\S]*?)\[\/c\]/g, (_, hex, text) => {
      const cls = KNOWN[hex.toLowerCase()];
      return cls
        ? `<span class="${cls}">${text}</span>`
        : `<span class="mu-custom" data-c="${hex}">${text}</span>`;
    })
    .replace(/\n/g, "<br />");
}
