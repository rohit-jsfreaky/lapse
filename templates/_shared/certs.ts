/**
 * Reading a domain's certificates: Certificate Transparency (CertSpotter's issuances API), what each host serves,
 * and whether it is still in DNS. Pure functions, no imports: the app, the sample script and the tests share them.
 */

export type Issuance = { id: string; names: string[]; issuer: string; notBefore: string; notAfter: string; sha256: string };
/** What a host served on port 443, read with Node's tls (see src/app/api/served). */
export type Served = { host: string; ok: boolean; notBefore?: string; notAfter?: string; issuer?: string; sha256?: string; names?: string[]; error?: string; nameMismatch?: boolean };
export type State = "expired" | "wrong-name" | "not-deployed" | "overdue" | "not-answering" | "due" | "ok" | "retired";
export type Host = {
  host: string;
  state: State;
  issuer: string;
  notBefore: string;
  notAfter: string;
  daysLeft: number;
  lifeDays: number;
  renewBy: string;
  certs: number;
  served?: Served;
  why: string;
};

const DAY = 86_400_000;
const day = (iso: string) => Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
export const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** 5 Nov 2026 (UTC). */
export const nice = (t: number | string) => {
  const d = new Date(typeof t === "string" ? day(t) : t);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/** CertSpotter `/v1/issuances?…&expand=dns_names&expand=issuer` → issuances. */
export function fromCertSpotter(json: unknown): Issuance[] {
  if (!Array.isArray(json)) throw new Error("CertSpotter answered with something that isn't a list.");
  return json.map((c: Record<string, unknown>) => {
    const issuer = c.issuer as { friendly_name?: string; name?: string } | undefined;
    return {
      id: String(c.id),
      names: ((c.dns_names as string[]) ?? []).map((n) => n.toLowerCase()),
      issuer: issuer?.friendly_name || issuer?.name?.match(/O=([^,]+)/)?.[1] || "Unknown issuer",
      notBefore: String(c.not_before),
      notAfter: String(c.not_after),
      sha256: String(c.cert_sha256 ?? ""),
    };
  });
}

/** The longest certificate a public CA may issue on a date (CA/Browser Forum Ballot SC-081v3). */
export function maxLifeOn(iso: string) {
  const t = day(iso);
  if (t < day("2026-03-15")) return 398;
  if (t < day("2027-03-15")) return 200;
  if (t < day("2029-03-15")) return 100;
  return 47;
}

/** Let's Encrypt: "renewing 90 day certificates every 60 days and six day certificates every three days". */
export function renewAt(notBefore: string, notAfter: string) {
  const a = day(notBefore);
  const life = day(notAfter) - a;
  return a + (life <= 10 * DAY ? life / 2 : (life * 2) / 3);
}

/** Every hostname named in the certificates, the apex and www first. Wildcards stay as names but aren't connected to. */
export function hostnames(certs: Issuance[], domain: string) {
  const all = [...new Set(certs.flatMap((c) => c.names))].filter((n) => n === domain || n.endsWith(`.${domain}`));
  const rank = (n: string) => (n === domain ? 0 : n === `www.${domain}` ? 1 : n.startsWith("*.") ? 3 : 2);
  return all.sort((a, b) => rank(a) - rank(b) || a.split(".").reverse().join(".").localeCompare(b.split(".").reverse().join(".")));
}

const ORDER: State[] = ["expired", "wrong-name", "not-deployed", "overdue", "not-answering", "due", "ok", "retired"];
export const severity = (s: State) => ORDER.indexOf(s);

/**
 * One host's verdict. `served` undefined = not checked (wildcards, or no server); `inDns` undefined = not checked.
 */
export function judge(host: string, certs: Issuance[], today: string, served?: Served, inDns?: boolean): Host {
  const mine = certs.filter((c) => c.names.includes(host)).sort((a, b) => day(b.notBefore) - day(a.notBefore));
  const latest = mine[0];
  // What's live: the logged certificate the server sends (CDNs often hold several, from more than one CA), else the newest.
  const current = (served?.sha256 && mine.find((c) => c.sha256 === served.sha256)) || latest;
  const now = day(today);
  const left = Math.floor((day(current.notAfter) - now) / DAY);
  const life = Math.round((day(current.notAfter) - day(current.notBefore)) / DAY);
  const due = renewAt(current.notBefore, current.notAfter);
  const base = { host, issuer: current.issuer, notBefore: current.notBefore, notAfter: current.notAfter, daysLeft: left, lifeDays: life, renewBy: ymd(due), certs: mine.length, served };
  const at = (state: State, why: string): Host => ({ ...base, state, why });
  // A real renewal: a certificate at least a week newer than what's served, while the served one is past its renewal point.
  const renewed = current !== latest && day(latest.notBefore) - day(current.notBefore) > 7 * DAY && now > due;

  if (inDns === false) return at("retired", "No DNS record any more. The certificate will simply run out.");
  if (served && !served.ok) {
    const stalled = now > due ? ` Its certificate was due to renew on ${nice(due)} and hasn't.` : "";
    return at("not-answering", `In DNS, but nothing answered with a certificate on port 443 (${served.error ?? "no answer"}).${stalled} Retired? Remove the DNS record. If not, the server is down.`);
  }
  if (served?.ok && served.notAfter && day(served.notAfter) < now) return at("expired", `The server is serving a certificate that expired on ${nice(served.notAfter)}.`);
  if (served?.ok && served.nameMismatch) return at("wrong-name", `The server answers with a certificate for ${served.names?.slice(0, 2).join(", ") ?? "another name"}, not ${host}.`);
  if (renewed) return at("not-deployed", `A newer certificate was issued on ${nice(latest.notBefore)}, but the server still serves the one from ${nice(current.notBefore)}. Reload or redeploy it.`);
  if (left <= 7 || now > due + 7 * DAY) return at("overdue", `Past its renewal date (${nice(due)}) with no newer certificate in the logs. ${left} ${left === 1 ? "day" : "days"} left.`);
  if (now > due) return at("due", `Renewal was due on ${nice(due)}. An automated renewal usually lands within a few days.`);
  return at("ok", `Renews around ${nice(due)}.`);
}

/** All hosts of all domains, worst first. */
export function judgeAll(domains: string[], certs: Issuance[], today: string, served: Served[] = []) {
  const out: Host[] = [];
  for (const d of domains) {
    for (const h of hostnames(certs, d)) {
      if (out.some((o) => o.host === h)) continue;
      const s = served.find((x) => x.host === h);
      out.push(judge(h, certs, today, s, s ? s.error !== "not in DNS" : undefined));
    }
  }
  return out.sort((a, b) => severity(a.state) - severity(b.state) || a.daysLeft - b.daysLeft);
}

/** What SC-081 means for the renewals of these hosts: the most renewals a year each cert will need. */
export function outlook(today: string) {
  return [
    { from: "2026-03-15", days: 200 },
    { from: "2027-03-15", days: 100 },
    { from: "2029-03-15", days: 47 },
  ].map((s) => ({ ...s, perYear: Math.ceil(365 / s.days), current: maxLifeOn(today) === s.days }));
}

export const LABEL: Record<State, string> = {
  expired: "Expired",
  "wrong-name": "Wrong certificate",
  "not-deployed": "Renewed, not deployed",
  overdue: "Renewal overdue",
  "not-answering": "Not answering",
  due: "Renewal due",
  ok: "OK",
  retired: "Retired",
};

/** Clean what people paste: URLs, mixed case, trailing dots, commas or new lines between domains. */
export function cleanDomains(input: string) {
  return [
    ...new Set(
      input
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/\.$/, "").replace(/^\*\./, ""))
        .filter((s) => /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(s)),
    ),
  ];
}

/** The values the three templates take. */
export function toValues(hosts: Host[], meta: { domains: string[]; date: string; owner?: string; team?: string }) {
  const count = (s: State) => hosts.filter((h) => h.state === s).length;
  const act = hosts.filter((h) => ["expired", "wrong-name", "not-deployed", "overdue", "not-answering", "due"].includes(h.state));
  return {
    domains: meta.domains.join(", ").slice(0, 200),
    date: meta.date,
    owner: meta.owner?.trim().slice(0, 60) || undefined,
    team: meta.team?.trim().slice(0, 80) || undefined,
    total: hosts.length,
    attention: act.length,
    retired: count("retired"),
    nextExpiry: hosts.filter((h) => h.state !== "retired").sort((a, b) => a.daysLeft - b.daysLeft)[0]?.notAfter.slice(0, 10),
    hosts: hosts.slice(0, 40).map((h) => ({
      host: h.host.slice(0, 80),
      state: h.state,
      issuer: h.issuer.slice(0, 40),
      issued: h.notBefore.slice(0, 10),
      expires: h.notAfter.slice(0, 10),
      daysLeft: h.daysLeft,
      lifeDays: h.lifeDays,
      renewBy: h.renewBy,
      why: h.why.slice(0, 300),
    })),
    hostsTotal: hosts.length,
  };
}
