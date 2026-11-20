// Where a check comes from: live (CertSpotter from the browser, then /api/served for what each host sends), or the
// frozen sample. Both end in the same shape, judged by templates/_shared/certs.ts.
import { fromCertSpotter, hostnames, type Issuance, type Served } from "../../templates/_shared/certs.ts";

export type Loaded = { domains: string[]; date: string; certs: Issuance[]; served: Served[]; source: string };

const today = () => new Date().toISOString().slice(0, 10);
const MAX_PAGES = 8; // pages vary in size; CertSpotter says to read until an empty one

async function issuances(domain: string, key?: string) {
  const all: unknown[] = [];
  let after = "";
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names&expand=issuer${after ? `&after=${after}` : ""}`;
    const res = await fetch(url, key ? { headers: { Authorization: `Bearer ${key}` } } : undefined);
    if (res.status === 429) throw new Error("CertSpotter's free hourly limit is used up. Add your CertSpotter API key, or try again within the hour.");
    if (res.status === 401) throw new Error("CertSpotter didn't accept that API key.");
    if (!res.ok) throw new Error(`CertSpotter answered ${res.status} for ${domain}.`);
    const list = (await res.json()) as Array<{ id: string }>;
    if (!list.length) break;
    all.push(...list);
    after = list[list.length - 1].id;
  }
  return fromCertSpotter(all);
}

export async function live(domains: string[], key?: string): Promise<Loaded> {
  const certs: Issuance[] = [];
  for (const d of domains) for (const c of await issuances(d, key)) if (!certs.some((x) => x.id === c.id)) certs.push(c);
  if (!certs.length) throw new Error(`No unexpired certificates in the logs for ${domains.join(", ")}.`);
  const hosts = [...new Set(domains.flatMap((d) => hostnames(certs, d)))].filter((h) => !h.startsWith("*.")).slice(0, 60);
  const res = await fetch("/api/served", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hosts }) });
  const served = res.ok ? ((await res.json()) as Served[]) : [];
  return { domains, date: today(), certs, served, source: `${domains.join(", ")} · live${res.ok ? "" : " · logs only (run it yourself for the server check)"}` };
}

export const SNAPSHOT = "/samples/getrevlio.json";
export async function snapshot(): Promise<Loaded> {
  const s = await fetch(SNAPSHOT).then((r) => r.json());
  return { domains: s.domains, date: s.date, certs: fromCertSpotter(s.certspotter), served: s.served, source: `${s.domains.join(", ")} · frozen ${s.date}` };
}
