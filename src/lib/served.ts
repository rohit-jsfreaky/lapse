// What a host serves on port 443: connect with TLS (SNI = the host), read the leaf certificate, check its name.
// Used by the /api/served route and by scripts/sample.ts. Node only.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { checkServerIdentity, connect, type PeerCertificate } from "node:tls";
import type { Served } from "../../templates/_shared/certs.ts";

const iso = (s: string) => new Date(s).toISOString();

/** Loopback, private, link-local, CGNAT, unique-local and unspecified addresses: never connect to these. */
export function isPrivate(ip: string) {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivate(v.slice(7));
    return v === "::" || v === "::1" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

export async function served(host: string, timeoutMs = 6000): Promise<Served> {
  let address: string;
  try {
    address = (await lookup(host)).address;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    return { host, ok: false, error: code === "ENOTFOUND" || code === "ENODATA" ? "not in DNS" : `DNS lookup failed (${code})` };
  }
  if (isPrivate(address)) return { host, ok: false, error: "points to a private address" };
  return new Promise((resolve) => {
    let done = false;
    const finish = (s: Served) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(s);
    };
    // rejectUnauthorized off: an expired or wrong certificate is exactly what we want to read, not refuse.
    const socket = connect({ host: address, port: 443, servername: host, rejectUnauthorized: false, timeout: timeoutMs }, () => {
      const c = socket.getPeerCertificate() as PeerCertificate;
      if (!c?.valid_to) return finish({ host, ok: false, error: "no certificate" });
      const names = (c.subjectaltname ?? "").split(", ").filter((n) => n.startsWith("DNS:")).map((n) => n.slice(4).toLowerCase());
      finish({
        host,
        ok: true,
        notBefore: iso(c.valid_from),
        notAfter: iso(c.valid_to),
        issuer: (c.issuer?.O as string) ?? (c.issuer?.CN as string) ?? "Unknown issuer",
        sha256: c.fingerprint256?.replace(/:/g, "").toLowerCase(),
        names,
        nameMismatch: !!checkServerIdentity(host, c),
      });
    });
    socket.on("timeout", () => finish({ host, ok: false, error: "timed out" }));
    socket.on("error", (e: NodeJS.ErrnoException) => finish({ host, ok: false, error: e.code === "ECONNREFUSED" ? "connection refused" : (e.code ?? e.message) }));
  });
}

/** Several hosts, a few at a time. A timeout gets one more try: one slow answer shouldn't read as "down". */
export async function servedAll(hosts: string[], at = 6) {
  const once = async (h: string) => {
    const s = await served(h);
    return s.error === "timed out" ? served(h, 10_000) : s;
  };
  const out: Served[] = [];
  for (let i = 0; i < hosts.length; i += at) out.push(...(await Promise.all(hosts.slice(i, i + at).map(once))));
  return out;
}
