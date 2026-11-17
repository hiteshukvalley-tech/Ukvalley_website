// The visitor's IP, for per-IP rate limits. The first X-Forwarded-For entry is
// whatever the visitor sent (Render passes a client's own header through), so
// it can't be trusted; the last one is the address Render's own proxy saw and
// appended. CF-Connecting-IP is only real when every request comes through
// Cloudflare — the service is also reachable directly at *.onrender.com, where
// anyone can send that header — so it is used only with TRUST_CLOUDFLARE=1
// (set it once the origin only accepts traffic from Cloudflare).
export function clientIp(headers: Headers): string {
  if (process.env.TRUST_CLOUDFLARE === "1") {
    const cf = headers.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
  }
  const hops = headers.get("x-forwarded-for")?.split(",").map((h) => h.trim()).filter(Boolean);
  return hops?.length ? hops[hops.length - 1] : "local";
}
