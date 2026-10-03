import fs from "fs";
const files = process.argv.slice(2);
for (const f of files) {
  const s = fs.readFileSync(f, "utf8").replace(/\r/g, "");
  console.log("==", f);
  for (const m of s.matchAll(/>([^<>{}=;]*[A-Za-z]{3,}[^<>{}]*)</g)) {
    const t = m[1].replace(/\s+/g, " ").trim();
    if (!t || /^(=>|&&|\|\||\?|:)/.test(t)) continue;
    if (/[(){}]|=>|&&|\bconst\b|\breturn\b|\bimport\b|\bextends\b/.test(t)) continue;
    const line = s.slice(0, m.index).split("\n").length;
    const lineText = s.split("\n")[line - 1];
    if (/^\s*\/\//.test(lineText) || /^\s*\*/.test(lineText)) continue;
    console.log(line + ": " + t.slice(0, 90));
  }
}
