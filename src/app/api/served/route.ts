// POST { hosts: string[] } -> Served[]: the certificate each host serves on port 443, read with Node's tls.
// Only public hostnames are connected to (no IPs, no localhost, no internal names), at most 60.
import { servedAll } from "@/lib/served";

const HOST = /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/;
const INTERNAL = /(^|\.)(localhost|local|internal|intranet|lan|home|corp|test|example|invalid)$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { hosts?: unknown } | null;
  const hosts = Array.isArray(body?.hosts) ? [...new Set(body.hosts.filter((h): h is string => typeof h === "string").map((h) => h.toLowerCase()))] : [];
  const ok = hosts.filter((h) => HOST.test(h) && !INTERNAL.test(h)).slice(0, 60);
  if (!ok.length) return Response.json({ error: "Send { hosts: [public hostnames] }" }, { status: 400 });
  return Response.json(await servedAll(ok));
}
