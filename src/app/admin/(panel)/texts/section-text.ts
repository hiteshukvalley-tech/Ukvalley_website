// One editable box per page section (Admin → Pages & text): the section's text
// is shown one line per line on the page, and an edited box is mapped back to
// the individual texts the site stores. Pure functions, used by the editor.

/** What this needs from an editor row (see TextRow in texts-editor.tsx). */
export type LineRow = {
  id: string;
  role: string;
  /** the text as written in the page code (what an edit is stored against) */
  original: string;
  /** what the page shows now */
  current: string;
  /** places on the page that show this text */
  count: number;
  /** rows with the same non-zero id are pieces of one sentence */
  blockId: number;
  /** the whole sentence, for a piece of one */
  context: string;
};

/** One line of the box: a whole line of text, or a sentence written in several pieces. */
export type SectionLine = { rows: LineRow[]; text: string; role: string };

export const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const edge = (o: string) => ({ lead: /^\s*/.exec(o)![0], trail: /\s*$/.exec(o)![0] });

/** The section's text rows as lines, in page order. */
export function buildSectionLines(rows: LineRow[]): SectionLine[] {
  const lines: SectionLine[] = [];
  for (let i = 0; i < rows.length; ) {
    const r = rows[i];
    let j = i + 1;
    if (r.blockId) while (j < rows.length && rows[j].blockId === r.blockId) j++;
    const parts = rows.slice(i, j);
    lines.push(
      parts.length > 1
        ? { rows: parts, text: norm(parts[0].context) || norm(parts.map((p) => p.current).join(" ")), role: r.role }
        : { rows: parts, text: norm(r.current), role: r.role }
    );
    i = j;
  }
  return lines;
}

/** The box's text for these lines: one text per paragraph, with an empty line between them. */
export const linesText = (lines: SectionLine[]) => lines.map((l) => l.text).join("\n\n");

/**
 * The texts in a box, split at empty lines. Line breaks inside one text are
 * just wrapping (the page shows it as one line), so they become spaces.
 */
export const splitBox = (box: string) =>
  box
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n[ \t]*\n(?:[ \t]*\n)*/)
    .map(norm);

/** A piece of a sentence that is also shown elsewhere on the page (e.g. a service name): it must stay in the line. */
const isLocked = (r: LineRow) => r.count > 1;

export type RowEdit = { row: LineRow; typed: string };

/**
 * Splits an edited sentence back into its pieces. Pieces shown elsewhere on
 * the page stay as they are and must still be in the line; the words around
 * them go to the other pieces (kept in place where their old text is still
 * there, otherwise to the first piece of that stretch).
 */
function splitSentence(line: SectionLine, edited: string): { values: string[] } | { error: string } {
  const pieces = line.rows.map((r) => norm(r.current));
  const values: string[] = new Array(pieces.length).fill("");
  let cursor = 0;
  let free: number[] = [];
  /**
   * Shares out the words between two locked pieces. Pieces whose old text is
   * still there (in order) keep it; each stretch of new words goes to the
   * changed piece(s) in that place — the first of them gets it, the others
   * become empty. New words next to unchanged pieces only are added to the
   * piece before them.
   */
  const fillGap = (gap: string) => {
    if (!free.length) return;
    const g = gap.trim();
    const found = new Map<number, number>(); // piece -> where its unchanged text starts
    let from = 0;
    for (const k of free) {
      const p = pieces[k] ? g.indexOf(pieces[k], from) : -1;
      if (p >= 0) {
        found.set(k, p);
        from = p + pieces[k].length;
      }
    }
    let at = 0; // start of the stretch not yet given to a piece
    let pending: number[] = []; // changed pieces waiting for the next stretch
    let lastKept = -1;
    const give = (end: number) => {
      const words = g.slice(at, end).trim();
      if (pending.length) pending.forEach((k, n) => (values[k] = n === 0 ? words : ""));
      else if (words && lastKept >= 0) values[lastKept] = `${values[lastKept]} ${words}`;
      else if (words) values[free[0]] = `${words} ${values[free[0]]}`.trim();
      pending = [];
    };
    for (const k of free) {
      const p = found.get(k);
      if (p === undefined) {
        pending.push(k);
        continue;
      }
      give(p);
      values[k] = pieces[k];
      lastKept = k;
      at = p + pieces[k].length;
    }
    give(g.length);
    free = [];
  };
  for (let k = 0; k < pieces.length; k++) {
    if (!isLocked(line.rows[k]) || !pieces[k]) {
      free.push(k);
      continue;
    }
    const p = edited.indexOf(pieces[k], cursor);
    if (p < 0) return { error: `keep “${pieces[k]}” in this text (it is shown elsewhere on the page too, so it is edited where it comes from)` };
    fillGap(edited.slice(cursor, p));
    values[k] = pieces[k];
    cursor = p + pieces[k].length;
  }
  fillGap(edited.slice(cursor));
  return { values };
}

/**
 * The texts that changed when the box now reads `edited`. Errors when a line
 * was added or removed, or a locked piece was taken out of its sentence.
 */
export function sectionChanges(lines: SectionLine[], edited: string): { edits: RowEdit[] } | { error: string } {
  const now = edited.trim() ? splitBox(edited) : [];
  if (now.length !== lines.length) {
    return {
      error: `This section has ${lines.length} text${lines.length === 1 ? "" : "s"}, the box now has ${now.length}. Keep one empty line between texts and don't add or remove texts — just edit the words.`,
    };
  }
  const edits: RowEdit[] = [];
  const typedFor = (row: LineRow, value: string) => {
    if (norm(value) === norm(row.current)) return;
    const { lead, trail } = edge(row.original);
    edits.push({ row, typed: value ? lead + value + trail : "" });
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const value = norm(now[i]);
    if (value === line.text) continue;
    if (line.rows.length === 1) {
      typedFor(line.rows[0], value);
      continue;
    }
    const split = splitSentence(line, value);
    if ("error" in split) return { error: `Text ${i + 1}: ${split.error}.` };
    line.rows.forEach((r, k) => typedFor(r, split.values[k]));
  }
  return { edits };
}
