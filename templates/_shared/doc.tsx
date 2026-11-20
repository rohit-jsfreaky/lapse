/**
 * What every Lapse template shares: the fields (a domain's hosts, each with its certificate and verdict), the look
 * (an instrument panel: aubergine ink, one violet, three state colours) and the time-left bar.
 */
import { Line, Rect, Svg, defineTheme, prop } from "@hyper-elements/react";
import sample from "./example.ts";

export const STATES = ["expired", "wrong-name", "not-deployed", "overdue", "not-answering", "due", "ok", "retired"] as const;
export type State = (typeof STATES)[number];

export const fields = {
  domains: prop.text({ label: "Domains", required: true, maxLength: 200 }),
  date: prop.date({ label: "Checked on", required: true }),
  owner: prop.text({ label: "Sent to", maxLength: 60, guidance: "Who the alert email greets." }),
  team: prop.text({ label: "Team or client", maxLength: 80 }),
  total: prop.number({ label: "Hosts", required: true, min: 0, integer: true }),
  attention: prop.number({ label: "Hosts that need attention", required: true, min: 0, integer: true }),
  retired: prop.number({ label: "Retired hosts", min: 0, integer: true }),
  nextExpiry: prop.date({ label: "Next expiry" }),
  hostsTotal: prop.number({ label: "Hosts found", min: 0, integer: true, guidance: "When there are more than the list holds." }),
  hosts: prop.list(
    prop.object(
      {
        host: prop.text({ label: "Host", required: true, maxLength: 80, pattern: "^(\\*\\.)?[a-z0-9.-]+$" }),
        state: prop.choice([...STATES], { label: "State", required: true }),
        issuer: prop.text({ label: "Issuer", required: true, maxLength: 40 }),
        issued: prop.date({ label: "Issued", required: true }),
        expires: prop.date({ label: "Expires", required: true }),
        daysLeft: prop.number({ label: "Days left", required: true, integer: true }),
        lifeDays: prop.number({ label: "Lifetime (days)", required: true, min: 1, max: 398, integer: true }),
        renewBy: prop.date({ label: "Renews around", required: true }),
        why: prop.text({ label: "Why", required: true, maxLength: 300 }),
      },
      { label: "Host" },
    ),
    { label: "Hosts", required: true, min: 1, max: 40 },
  ),
};

export type Host = { host: string; state: State; issuer: string; issued: string; expires: string; daysLeft: number; lifeDays: number; renewBy: string; why: string };
export type Values = { domains: string; date: string; owner?: string; team?: string; total: number; attention: number; retired?: number; nextExpiry?: string; hostsTotal?: number; hosts: Host[] };

/** The sample: getrevlio.com, read on 20 Nov 2026. */
export const example = sample as unknown as Values;

/* ---------- look ---------- */

export const INK = "#241534";
export const INK2 = "#4A3D5C";
export const MUTED = "#6E6480";
export const LINE = "#E9E4F0";
export const WASH = "#F7F5FA";
export const PAPER = "#FFFFFF";
export const VIOLET = "#5B34C9";
export const GOOD = "#23815A";
export const WAIT = "#9A6200";
export const BAD = "#C2352B";

export const SANS = "'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'Geist Mono', Menlo, Consolas, monospace";

export const FONT_FILES = [400, 500, 600, 700, 800].map((w) => ({ family: "Schibsted Grotesk", src: `../fonts/SchibstedGrotesk-${w}.woff`, weight: w })).concat([400, 600].map((w) => ({ family: "Geist Mono", src: `../fonts/GeistMono-${w}.woff`, weight: w })));
const CDN = "https://cdn.jsdelivr.net/npm/@fontsource";
export const FONT_URLS = [
  { family: "Schibsted Grotesk", src: `${CDN}/schibsted-grotesk@5.2.8/files/schibsted-grotesk-latin-400-normal.woff2`, weight: 400 },
  { family: "Schibsted Grotesk", src: `${CDN}/schibsted-grotesk@5.2.8/files/schibsted-grotesk-latin-700-normal.woff2`, weight: 700 },
  { family: "Geist Mono", src: `${CDN}/geist-mono@5.2.7/files/geist-mono-latin-400-normal.woff2`, weight: 400 },
];

export const theme = defineTheme({
  colors: { background: WASH, foreground: INK, primary: VIOLET, primaryForeground: PAPER, muted: MUTED, border: LINE, paper: PAPER },
  fonts: { body: SANS, heading: SANS },
  fontSizes: { body: 16 },
  lineHeights: { body: 1.55 },
  elements: { Heading: { fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15, by: { level: { 1: { fontSize: 28, mobile: { fontSize: 24 } }, 2: { fontSize: 19 } } } } },
  styles: {
    label: { fontFamily: MONO, fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED },
    card: { backgroundColor: PAPER, padding: 28, gap: 16, border: `1px solid ${LINE}` },
  },
});

/* ---------- states ---------- */

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
export const TONE: Record<State, string> = { expired: BAD, "wrong-name": BAD, "not-deployed": BAD, overdue: BAD, "not-answering": WAIT, due: WAIT, ok: GOOD, retired: MUTED };
export const needsAction = (h: Host) => h.state !== "ok" && h.state !== "retired";

/* ---------- helpers ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const t = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
export const nice = (iso: string) => {
  const d = new Date(t(iso));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
export const short = (iso: string) => {
  const d = new Date(t(iso));
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
export const days = (n: number) => `${n} ${Math.abs(n) === 1 ? "day" : "days"}`;
export const headline = (v: Values) =>
  v.attention ? `${v.attention} of ${v.total} ${v.total === 1 ? "host needs" : "hosts need"} attention` : `All ${v.total - (v.retired ?? 0)} live ${v.total - (v.retired ?? 0) === 1 ? "host renews" : "hosts renew"} on time`;

/** The window every bar shares: from the earliest issue date to the latest expiry. */
export function windowOf(v: Values) {
  const a = Math.min(...v.hosts.map((h) => t(h.issued)), t(v.date));
  const b = Math.max(...v.hosts.map((h) => t(h.expires)), t(v.date));
  return { a, b, at: (iso: string) => (t(iso) - a) / Math.max(1, b - a) };
}

/**
 * A certificate's life as a bar on the shared window: the used part in ink, the rest in the state's tone,
 * a tick where it should renew, and today as a line.
 */
export function LifeBar({ h, v, width, height = 12 }: { h: Host; v: Values; width: number; height?: number }) {
  const w = windowOf(v);
  const x0 = w.at(h.issued) * width;
  const x1 = w.at(h.expires) * width;
  const now = Math.min(Math.max(w.at(v.date) * width, x0), x1);
  const renew = w.at(h.renewBy) * width;
  const tone = TONE[h.state];
  const today = w.at(v.date) * width;
  return (
    <Svg width={width} height={height + 6} title={`${h.host}: issued ${nice(h.issued)}, expires ${nice(h.expires)}`}>
      <Rect x={0} y={3} width={width} height={height} rx={2} style={{ fill: WASH }} />
      <Rect x={x0} y={3} width={Math.max(1, now - x0)} height={height} rx={2} style={{ fill: h.state === "retired" ? LINE : "#CFC7DC" }} />
      <Rect x={now} y={3} width={Math.max(0, x1 - now)} height={height} rx={2} style={{ fill: tone }} />
      {renew > x0 && renew < x1 ? <Line x1={renew} y1={1} x2={renew} y2={height + 5} style={{ stroke: INK, strokeWidth: 1.2 }} /> : null}
      <Line x1={today} y1={0} x2={today} y2={height + 6} style={{ stroke: VIOLET, strokeWidth: 1.6 }} />
    </Svg>
  );
}

const SEVERITY: State[] = ["expired", "wrong-name", "not-deployed", "overdue", "not-answering", "due", "ok", "retired"];
export const severityOf = (h: Host) => SEVERITY.indexOf(h.state);
