/**
 * The Markdown subset the assistant writes, matching the website's
 * ChatMarkdown: `#`–`###` headings, `-`/`*` bullets, `1.`/`1)` numbered
 * items, inline `**bold**`, and paragraphs. No links or HTML.
 */
export type InlineRun = { text: string; bold: boolean };
export type MarkdownBlock =
  | { kind: "heading"; runs: InlineRun[] }
  | { kind: "paragraph"; lines: InlineRun[][] }
  | { kind: "bullets"; items: InlineRun[][] }
  | { kind: "numbers"; items: InlineRun[][]; start: number };

/** Older replies were saved with escaped Markdown; undo that first. */
const unescape = (value: string) =>
  value
    .replace(/\\\*\\\*(.+?)\\\*\\\*/g, "**$1**")
    .replace(/^(\s*)\\([#-])/gm, "$1$2")
    .replace(/^(\s*\d+)\\([.)])/gm, "$1$2");

export function parseInline(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) runs.push({ text: text.slice(last, index), bold: false });
    runs.push({ text: match[1], bold: true });
    last = index + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false });
  return runs.length ? runs : [{ text, bold: false }];
}

export function parseChatMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: InlineRun[][] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", lines: paragraph });
    paragraph = [];
  };
  for (const raw of unescape(source).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = /^#{1,3}\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(line);
    const previous = blocks[blocks.length - 1];
    if (heading) {
      flush();
      blocks.push({ kind: "heading", runs: parseInline(heading[1]) });
    } else if (bullet) {
      flush();
      if (previous?.kind === "bullets")
        previous.items.push(parseInline(bullet[1]));
      else blocks.push({ kind: "bullets", items: [parseInline(bullet[1])] });
    } else if (numbered) {
      flush();
      if (previous?.kind === "numbers")
        previous.items.push(parseInline(numbered[2]));
      else
        blocks.push({
          kind: "numbers",
          items: [parseInline(numbered[2])],
          start: Number(numbered[1]),
        });
    } else {
      paragraph.push(parseInline(line));
    }
  }
  flush();
  return blocks;
}
