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
//   src/app/opengraph-image.png      link preview (1200×630)
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

// Link preview: the logo banner cropped to 1200×630 (edges stretched to fit).
const banner = await sharp(`${SRC}/ukvalley_rect.png`)
  .extract({ left: 60, top: 0, width: 1480, height: 680 })
  .extend({ top: 49, bottom: 49, extendWith: "copy" })
  .toBuffer();
await sharp(banner).resize(1200, 630).png({ compressionLevel: 9 }).toFile("src/app/opengraph-image.png");
writeFileSync("src/app/opengraph-image.alt.txt", "Ukvalley Technologies");

console.log("Brand assets written.");
