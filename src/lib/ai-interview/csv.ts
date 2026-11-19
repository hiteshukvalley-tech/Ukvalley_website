// CSV for the AI interview export. Pure (no server imports), so tests can load it.

/**
 * One cell. Quoted when it holds a comma, quote or line break. A value that a
 * spreadsheet would run as a formula (=, +, -, @, tab, carriage return at the
 * start) gets a leading apostrophe, so a candidate can't plant one in their
 * name ("CSV injection"). Plain numbers are left as they are.
 */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows to CSV text, with a byte-order mark so Excel reads it as UTF-8 (names in any script). */
export function toCsv(rows: readonly (readonly unknown[])[]): string {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
