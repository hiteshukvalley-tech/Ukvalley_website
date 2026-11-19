import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// The server connects wherever these settings point, so they must never reach
// this machine or the private network (SSRF): no localhost, no single-label
// names, nothing that is or resolves to a private, loopback or link-local
// address. Outside production (and for the QA scripts' fake SMTP server on
// 127.0.0.1:2525, which run `next start` with QA_ALLOW_LOCAL_SMTP=1) local
// servers are allowed.
const allowLocal = () => process.env.NODE_ENV !== "production" || process.env.QA_ALLOW_LOCAL_SMTP === "1";

export function isPrivateIp(ip: string): boolean {
  const v4 = (ip.toLowerCase().startsWith("::ffff:") ? ip.slice(7) : ip).split(".").map(Number);
  if (isIP(ip) === 4 || (v4.length === 4 && v4.every((n) => Number.isInteger(n)))) {
    const [a, b] = v4;
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 || // this network, private, loopback, multicast/reserved
      (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
      (a === 169 && b === 254) || // link-local (cloud metadata)
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && v4[2] === 0) || // IETF protocol assignments 192.0.0.0/24
      (a === 192 && b === 0 && v4[2] === 2) || // documentation 192.0.2.0/24
      (a === 198 && (b === 18 || b === 19)) || // benchmarking 198.18.0.0/15
      (a === 198 && b === 51 && v4[2] === 100) || // documentation 198.51.100.0/24
      (a === 203 && b === 0 && v4[2] === 113) // documentation 203.0.113.0/24
    );
  }
  const v6 = ip.toLowerCase();
  // unspecified, loopback, IPv4-mapped (hex form), NAT64 64:ff9b::/96 (can reach
  // IPv4 inside), unique-local fc00::/7, link-local fe80::/10, multicast ff00::/8
  return (
    v6 === "::" || v6 === "::1" || v6.startsWith("::ffff:") || v6.startsWith("64:ff9b:") ||
    /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || v6.startsWith("ff")
  );
}

/** Why this host can't be used, or null when it can. Resolves it, so a public name pointing inward is caught too. */
export async function hostProblem(host: string): Promise<string | null> {
  if (allowLocal()) return null;
  if (host === "localhost" || host.endsWith(".localhost") || !host.includes(".")) {
    return "Enter the mail server's full public name, e.g. smtp.gmail.com.";
  }
  if (isIP(host) && isPrivateIp(host)) return "That address is on a private network. Enter a public mail server.";
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    return "Could not find that server. Check the name, e.g. smtp.gmail.com.";
  }
  if (!addresses.length || addresses.some((a) => isPrivateIp(a.address))) {
    return "That server is on a private network. Enter a public mail server.";
  }
  return null;
}

/**
 * The address to connect to for a mail host: the host resolved once and
 * checked, so a name can't point at a public address for the check and at a
 * private one for the connection (DNS rebinding). Throws a message for people
 * when the host isn't allowed. With local servers allowed (dev, QA), the name
 * itself is returned.
 */
export async function publicAddressFor(host: string): Promise<string> {
  const problem = await hostProblem(host);
  if (problem) throw new Error(problem);
  if (allowLocal() || isIP(host)) return host;
  const all = await lookup(host, { all: true });
  if (all.some((a) => isPrivateIp(a.address))) throw new Error("That server is on a private network. Enter a public mail server.");
  // IPv4 first: many hosts (Render among them) have no outbound IPv6 route.
  const first = all.find((a) => a.family === 4) ?? all[0];
  if (!first || isPrivateIp(first.address)) throw new Error("That server is on a private network. Enter a public mail server.");
  return first.address;
}
