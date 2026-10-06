// Builds the site's logo files from the official Ukvalley artwork (as used on
// the old ukvalley.com). Re-run after replacing a source file:
//   node scripts/build-brand-assets.mjs
// Sources (scripts/brand-src/):
//   uk_header.webp      full logo, blue on transparent (1080×373)
//   uk2.png             round "UK" mark (500×500)
//   ukvalley_rect.png   full logo on the blue gradient (1600×680)
// Outputs:
//   public/brand/ukvalley-logo.png   header & footer logo (trimmed)
//   src/app/icon.png, apple-icon.png, favicon.ico   browser / phone icons
//   public/brand/share-image.png     link preview for every page (1200×630)
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SRC = "scripts/brand-src";
mkdirSync("public/brand", { recursive: true });

// Header / footer logo: trim the empty margin, 2× the 40 px display height.
await sharp(`${SRC}/uk_header.webp`).trim().resize({ height: 120 }).png({ compressionLevel: 9 }).toFile("public/brand/ukvalley-logo.png");

// Icons from the round mark.
const mark = sharp(`${SRC}/uk2.png`).trim();
await mark.clone().resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile("src/app/icon.png");
// iOS shows transparency as black: put the mark on white.
await mark.clone().resize(160, 160, { fit: "contain", background: "#ffffff" })
  .extend({ top: 10, bottom: 10, left: 10, right: 10, background: "#ffffff" }).flatten({ background: "#ffffff" })
  .png().toFile("src/app/apple-icon.png");

// favicon.ico holding 16, 32 and 48 px PNGs (the ICO format allows PNG entries).
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => mark.clone().resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4); // colour planes
  header.writeUInt16LE(32, e + 6); // bits per pixel
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...pngs]));

// Link preview (1200×630, used by every page — see SHARE_IMAGE in
// src/lib/site-origin.ts). Centred composition: the round mark with the name
// under it, all inside the middle 630×630 square, because WhatsApp and some
// chat apps show a square thumbnail cut from the centre of the image.
const W = 1200, H = 630;
const background = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9edff"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect y="${H - 14}" width="${W}" height="14" fill="#2b7fff"/>
  </svg>`
);
const markPx = 290;
const shareMark = await sharp(`${SRC}/uk2.png`).trim()
  .resize(markPx, markPx, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
// The wordmark: the text half of the full logo (right of the round mark).
const full = await sharp(`${SRC}/uk_header.webp`).metadata();
// (two steps: sharp runs trim before extract when they are chained)
const textHalf = await sharp(`${SRC}/uk_header.webp`)
  .extract({ left: 360, top: 0, width: full.width - 360, height: full.height }).png().toBuffer();
const wordmark = await sharp(await sharp(textHalf).trim().png().toBuffer()).resize({ width: 520 }).png().toBuffer();
const wm = await sharp(wordmark).metadata();
const gap = 34;
const top = Math.round((H - 14 - (markPx + gap + wm.height)) / 2);
await sharp(background)
  .composite([
    { input: shareMark, left: Math.round((W - markPx) / 2), top },
    { input: wordmark, left: Math.round((W - wm.width) / 2), top: top + markPx + gap },
  ])
  .png({ compressionLevel: 9 })
  .toFile("public/brand/share-image.png");

console.log("Brand assets written.");
