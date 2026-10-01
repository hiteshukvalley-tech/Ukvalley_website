// `npm run dev:mobile` — dev server for testing on real phones.
//
// Phones often open the LAN address over HTTPS (typed https://, Chrome's
// "Always use secure connections", iOS Safari's automatic upgrade). The
// normal `next dev` only speaks plain HTTP, so the phone shows
// "This site can't provide a secure connection".
//
// This script:
//   1. finds every LAN IPv4 address of this PC (Wi-Fi, Mobile Hotspot…);
//   2. makes a certificate covering localhost + all of them with mkcert
//      (the same tool `next dev --experimental-https` uses), regenerating
//      it whenever the PC's addresses change;
//   3. starts `next dev` over HTTPS on all interfaces and prints the exact
//      addresses to open on the phone.
//
// The certificate is self-signed, so the phone shows a one-time "not
// private" warning — tap Advanced → Proceed (Android) or Show Details →
// visit this website (iPhone). Nothing is installed into Windows' trust
// store, so no admin/security prompt appears on the PC.
import { X509Certificate } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CERT_DIR = path.join(ROOT, "certificates");
const KEY = path.join(CERT_DIR, "localhost-key.pem");
const CERT = path.join(CERT_DIR, "localhost.pem");
const PORT = process.env.PORT ?? "3000";
const MKCERT_VERSION = "v1.4.4"; // same version Next.js pins

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
}

function mkcertBinaryName() {
  const arch = process.arch === "arm64" ? "arm64" : "amd64";
  if (process.platform === "win32") return `mkcert-${MKCERT_VERSION}-windows-${arch}.exe`;
  if (process.platform === "darwin") return `mkcert-${MKCERT_VERSION}-darwin-${arch}`;
  return `mkcert-${MKCERT_VERSION}-linux-${arch}`;
}

async function mkcertBinary() {
  const base = process.env.LOCALAPPDATA ?? path.join(os.homedir(), ".cache");
  const dir = path.join(base, "mkcert");
  const bin = path.join(dir, mkcertBinaryName());
  if (fs.existsSync(bin)) return bin;
  console.log("Downloading mkcert (one time)…");
  const res = await fetch(`https://github.com/FiloSottile/mkcert/releases/download/${MKCERT_VERSION}/${mkcertBinaryName()}`);
  if (!res.ok) throw new Error(`mkcert download failed: HTTP ${res.status}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(bin, Buffer.from(await res.arrayBuffer()));
  fs.chmodSync(bin, 0o755);
  return bin;
}

function certCovers(hosts) {
  if (!fs.existsSync(KEY) || !fs.existsSync(CERT)) return false;
  const cert = new X509Certificate(fs.readFileSync(CERT));
  if (new Date(cert.validTo) < new Date()) return false;
  return hosts.every((h) => (/^[\d.]+$/.test(h) ? cert.checkIP(h) : cert.checkHost(h)));
}

const ips = lanAddresses();
const hosts = ["localhost", "127.0.0.1", ...ips];

if (!certCovers(hosts)) {
  const bin = await mkcertBinary();
  fs.mkdirSync(CERT_DIR, { recursive: true });
  // No `-install`: only the phone needs to accept the certificate.
  execFileSync(bin, ["-key-file", KEY, "-cert-file", CERT, ...hosts, "::1"], { stdio: "ignore" });
  console.log(`Certificate created for: ${hosts.join(", ")}`);
}

console.log("\n  Open on your phone (same Wi-Fi / hotspot as this PC):");
for (const ip of ips) console.log(`    https://${ip}:${PORT}`);
console.log("  First visit: tap Advanced → Proceed (Android) or Show Details → visit this website (iPhone).");
console.log("  \"Can't be reached\"? The phone must be on the SAME Wi-Fi as this PC (not mobile data).");
console.log("  Guest/office Wi-Fi often blocks devices from seeing each other — use a home Wi-Fi or this");
console.log("  PC's Mobile Hotspot instead (then open the 192.168.137.x address above).\n");

const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const child = spawn(
  process.execPath,
  [nextBin, "dev", "-H", "0.0.0.0", "-p", PORT, "--experimental-https", "--experimental-https-key", KEY, "--experimental-https-cert", CERT],
  { cwd: ROOT, stdio: "inherit" }
);
child.on("exit", (code) => {
  if (code) {
    console.log("\nIf Next said another dev server is already running: stop `npm run dev`");
    console.log("(Ctrl+C in its terminal) — only one can run per project — then run `npm run dev:mobile` again.");
  }
  process.exit(code ?? 0);
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
