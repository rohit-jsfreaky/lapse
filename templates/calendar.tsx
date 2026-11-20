/**
 * The renewal calendar: a 1200 × 675 image for the team channel. This month and the next two, each day a certificate
 * expires marked in its state's colour, today ringed, and the hosts under each month.
 */
import { Canvas, Circle, Column, Row, Svg, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { BAD, FONT_FILES, GOOD, INK, INK2, LINE, MONO, MUTED, PAPER, SANS, TONE, VIOLET, WASH, example, fields, headline, nice, severityOf, type Host, type Values } from "./_shared/doc.tsx";

const W = 1200;
const H = 675;
const PAD = 56;
const GAP = 40;
const MONTH_W = Math.floor((W - 2 * PAD - 2 * GAP) / 3);
const CELL = Math.floor(MONTH_W / 7);
const NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Month = { y: number; m: number };
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function MonthGrid({ at, v }: { at: Month; v: Values }) {
  const first = new Date(Date.UTC(at.y, at.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const count = new Date(Date.UTC(at.y, at.m + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [...Array.from({ length: lead }, () => null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const byDay = (d: number) => v.hosts.filter((h) => h.state !== "retired" && h.expires.slice(0, 10) === iso(at.y, at.m, d)).sort((a, b) => severityOf(a) - severityOf(b));
  const mine = v.hosts.filter((h) => h.state !== "retired" && h.expires.slice(0, 7) === iso(at.y, at.m, 1).slice(0, 7)).sort((a, b) => a.expires.localeCompare(b.expires));
  return (
    <Column style={{ width: MONTH_W, gap: 10 }}>
      <Text style={{ width: MONTH_W, fontWeight: 800, fontSize: 24, letterSpacing: -0.4 }}>{`${NAMES[at.m]} ${at.y}`}</Text>
      <Column style={{ width: MONTH_W, gap: 2 }}>
        <Row style={{ width: CELL * 7 }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <Text key={i} style={{ width: CELL, fontFamily: MONO, fontSize: 13, color: MUTED, textAlign: "center" }}>
              {d}
            </Text>
          ))}
        </Row>
        {weeks.map((w, i) => (
          <Row key={i} style={{ width: CELL * 7 }}>
            {w.map((d, j) => {
              if (!d) return <Column key={j} style={{ width: CELL, height: CELL - 8 }} />;
              const hits = byDay(d);
              const today = iso(at.y, at.m, d) === v.date;
              const tone = hits.length ? TONE[hits[0].state] : undefined;
              return (
                <Column key={j} style={{ width: CELL, height: CELL - 8, padding: [2, 3] }}>
                  <Column style={{ width: CELL - 6, height: CELL - 12, padding: [today ? 4 : 6, 0, 0], backgroundColor: tone ?? PAPER, border: today ? `2px solid ${VIOLET}` : undefined, borderRadius: 6 }}>
                    <Text style={{ width: CELL - 10, fontFamily: MONO, fontSize: 15, fontWeight: hits.length || today ? 600 : 400, color: tone ? PAPER : today ? VIOLET : INK2, textAlign: "center" }}>{String(d)}</Text>
                  </Column>
                </Column>
              );
            })}
          </Row>
        ))}
      </Column>
      <Column style={{ width: MONTH_W, gap: 7, padding: [6, 0, 0] }}>
        {mine.length ? (
          mine.slice(0, 3).map((h) => <HostLine key={h.host} h={h} />)
        ) : (
          <Text style={{ width: MONTH_W, fontSize: 15, color: MUTED }}>Nothing expires.</Text>
        )}
        {mine.length > 3 ? <Text style={{ width: MONTH_W, fontSize: 14, color: MUTED }}>{`+${mine.length - 3} more`}</Text> : null}
      </Column>
    </Column>
  );
}

function HostLine({ h }: { h: Host }) {
  return (
    <Row style={{ width: MONTH_W, gap: 8, alignItems: "center" }}>
      <Svg width={10} height={10} title={h.state}>
        <Circle cx={5} cy={5} r={5} style={{ fill: TONE[h.state] }} />
      </Svg>
      <Text style={{ width: 34, fontFamily: MONO, fontSize: 14, color: MUTED }}>{String(Number(h.expires.slice(8, 10)))}</Text>
      <Text fit={{ sizes: [15, 13, 11], maxLines: 1 }} style={{ width: MONTH_W - 60, fontFamily: MONO, color: INK }}>
        {h.host}
      </Text>
    </Row>
  );
}

export default template({
  id: "lapse.Calendar",
  version: "1.0.0",
  label: "Renewal calendar (image)",
  guidance: "Post it in the team channel. Coloured days: a certificate expires; ringed: the day it was checked.",
  root: "Canvas",
  formats: { card: { width: W, height: H, scale: 1 } },
  fields,
  rules: { require: { core: ["image/overflow", "image/glyph", "image/fit"] } },
  example,
  render(input) {
    const v = input as unknown as Values;
    const [y, m] = v.date.split("-").map(Number);
    const months: Month[] = [0, 1, 2].map((k) => ({ y: y + Math.floor((m - 1 + k) / 12), m: (m - 1 + k) % 12 }));
    const end = iso(months[2].y, months[2].m + 1, 1);
    const later = v.hosts.filter((h) => h.state !== "retired" && h.expires.slice(0, 10) >= end).length;
    return (
      <Canvas width={W} height={H} fonts={FONT_FILES} style={{ backgroundColor: WASH, fontFamily: SANS, color: INK, padding: [36, PAD], gap: 22 }}>
        <Row style={{ width: W - 2 * PAD, alignItems: "end", padding: [0, 0, 18], border: { bottom: `2px solid ${INK}` } }}>
          <Column style={{ width: W - 2 * PAD - 300, gap: 6 }}>
            <Text style={{ width: W - 2 * PAD - 300, fontFamily: MONO, fontSize: 15, letterSpacing: 0.6, color: VIOLET }}>{`LAPSE · RENEWAL CALENDAR · ${v.domains.toUpperCase()}`}</Text>
            <Text fit={{ sizes: [40, 34, 28], maxLines: 1 }} style={{ width: W - 2 * PAD - 300, fontWeight: 800, letterSpacing: -1, color: v.attention ? BAD : GOOD }}>
              {headline(v)}
            </Text>
          </Column>
          <Column style={{ width: 300, gap: 6 }}>
            <Row style={{ width: 300, gap: 14, justifyContent: "end" }}>
              {(
                [
                  [BAD, "Act now"],
                  ["#9A6200", "Check"],
                  [GOOD, "OK"],
                ] as const
              ).map(([c, l]) => (
                <Row key={l} style={{ gap: 6, alignItems: "center" }}>
                  <Svg width={12} height={12} title={l}>
                    <Circle cx={6} cy={6} r={6} style={{ fill: c }} />
                  </Svg>
                  <Text style={{ fontSize: 14, color: INK2 }}>{l}</Text>
                </Row>
              ))}
            </Row>
            <Text style={{ width: 300, fontSize: 14, color: MUTED, textAlign: "right" }}>{later ? `${later} more ${later === 1 ? "expires" : "expire"} later` : "Nothing expires later"}</Text>
          </Column>
        </Row>
        <Row style={{ width: W - 2 * PAD, gap: GAP, alignItems: "start" }}>
          {months.map((mo) => (
            <MonthGrid key={`${mo.y}-${mo.m}`} at={mo} v={v} />
          ))}
        </Row>
        <Text style={{ width: W - 2 * PAD, fontSize: 13, color: MUTED, border: { top: `1px solid ${LINE}` }, padding: [10, 0, 0] }}>{`Expiry dates from Certificate Transparency (CertSpotter). Checked ${nice(v.date)}.`}</Text>
      </Canvas>
    );
  },
});
