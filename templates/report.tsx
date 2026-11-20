/**
 * The certificate report: an A4 PDF. The verdict, every host's certificate as a time-left bar on one shared window,
 * the hosts that need attention with the reason, and what the CA/Browser Forum's shorter lifetimes change.
 * Pages are planned by row counts (a Document page doesn't flow onto the next one by itself).
 */
import { Fragment } from "react";
import { Column, Document, Heading, PageBreak, PageFooter, PageNumber, Row, Text } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { BAD, FONT_FILES, GOOD, INK, INK2, LABEL, LINE, LifeBar, MONO, MUTED, SANS, STATES, TONE, VIOLET, WAIT, WASH, days, example, fields, headline, needsAction, nice, short, windowOf, type Host, type Values } from "./_shared/doc.tsx";

const W = 682; // A4 at 96 px/in (794) less 56 px margins
const HOST_W = 200;
const END_W = 118;
const BAR_W = W - HOST_W - END_W - 16;
// Page plan in px (a Document page doesn't flow by itself). Measured on rendered pages: a one-line row is 35 px,
// each extra line of a long hostname adds 9; a card is 58 px plus 14 per line of its reason.
const FIRST_PAGE = 680; // under the title and the counts
const PAGE = 900;
const SC_SECTION = 190;
const lines = (text: string, perLine: number) => Math.max(1, Math.ceil(text.length / perLine));
const rowCost = (h: Host) => 35 + 9 * (lines(h.host, 40) - 1);
const cardCost = (h: Host) => 58 + 14 * lines(h.why, 135);
const label = { fontFamily: MONO, fontSize: 7.5, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED } as const;

const SC081 = [
  { from: "2026-03-15", days: 200 },
  { from: "2027-03-15", days: 100 },
  { from: "2029-03-15", days: 47 },
];

/** Fill pages up to a height budget; returns the pages and the room left on the last one. */
function paginate<T>(list: T[], cost: (t: T) => number, first: number, rest: number) {
  const pages: T[][] = [[]];
  let room = first;
  for (const t of list) {
    const c = cost(t);
    if (c > room && pages[pages.length - 1].length) {
      pages.push([]);
      room = rest;
    }
    pages[pages.length - 1].push(t);
    room -= c;
  }
  return { pages, room };
}

function Timeline({ rows, v, last }: { rows: Host[]; v: Values; last: boolean }) {
  const win = windowOf(v);
  return (
    <Column style={{ gap: 0 }}>
      <Row style={{ gap: 8, padding: [0, 0, 6] }}>
        <Column style={{ width: HOST_W }}>
          <Text style={label}>Host</Text>
        </Column>
        <Column style={{ width: BAR_W }}>
          <Row>
            <Column>
              <Text style={label}>{short(new Date(win.a).toISOString())}</Text>
            </Column>
            <Column>
              <Text style={{ ...label, textAlign: "right" }}>{short(new Date(win.b).toISOString())}</Text>
            </Column>
          </Row>
        </Column>
        <Column style={{ width: END_W }}>
          <Text style={{ ...label, textAlign: "right" }}>Expires</Text>
        </Column>
      </Row>
      {rows.map((h) => (
        <Row key={h.host} style={{ gap: 8, padding: [5, 0], alignItems: "center", border: { top: `0.5px solid ${LINE}` } }}>
          <Column style={{ width: HOST_W, gap: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 8, color: h.state === "retired" ? MUTED : INK }}>{h.host}</Text>
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: TONE[h.state] }}>{LABEL[h.state]}</Text>
          </Column>
          <Column style={{ width: BAR_W }}>
            <LifeBar h={h} v={v} width={BAR_W} />
          </Column>
          <Column style={{ width: END_W, gap: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 8, textAlign: "right" }}>{nice(h.expires)}</Text>
            <Text style={{ fontSize: 7.5, color: MUTED, textAlign: "right" }}>{h.daysLeft >= 0 ? `${days(h.daysLeft)} left` : `${days(-h.daysLeft)} ago`}</Text>
          </Column>
        </Row>
      ))}
      {last ? (
        <Text style={{ fontSize: 7.5, color: MUTED, padding: [6, 0, 0] }}>
          {`Grey: the part of each certificate's life already used. Colour: what's left. Black tick: where it should renew (at 2/3 of its life, Let's Encrypt's advice). Violet line: today, ${nice(v.date)}.`}
        </Text>
      ) : null}
    </Column>
  );
}

export default template({
  id: "lapse.Report",
  version: "1.0.0",
  label: "Certificate report (PDF)",
  guidance: "A snapshot of the date shown: Certificate Transparency logs plus what each host served then. Check again before acting on an old one.",
  root: "Document",
  formats: { a4: { size: "A4", orientation: "portrait" } },
  fields,
  example,
  render(input) {
    const v = input as unknown as Values;
    const act = v.hosts.filter(needsAction);
    const counts = STATES.map((s) => [s, v.hosts.filter((h) => h.state === s).length] as const).filter(([, n]) => n);
    const longest = Math.max(...v.hosts.map((h) => h.lifeDays));
    const shown = v.hostsTotal && v.hostsTotal > v.hosts.length ? ` Listed: the ${v.hosts.length} that matter most, of ${v.hostsTotal}.` : "";
    const rowPages = paginate(v.hosts, rowCost, FIRST_PAGE, PAGE).pages;
    const cards = paginate(act, cardCost, PAGE, PAGE);
    const cardPages = cards.pages;
    const scOwnPage = (act.length ? cards.room : PAGE - 80) < SC_SECTION;
    const countW = Math.min(112, Math.floor((W - 8 * (counts.length - 1)) / counts.length));
    return (
      <Document size="A4" margin={56} title={`Certificates for ${v.domains}`} lang="en" fonts={FONT_FILES} style={{ fontFamily: SANS, fontSize: 10, color: INK, gap: 16 }}>
        <Row style={{ alignItems: "end", padding: [0, 0, 8], border: { bottom: `1.5px solid ${INK}` } }}>
          <Column>
            <Text style={{ ...label, color: VIOLET }}>Lapse · certificate report</Text>
          </Column>
          <Column>
            <Text style={{ ...label, textAlign: "right" }}>
              {v.team ? `${v.team} · ` : ""}checked {nice(v.date)}
            </Text>
          </Column>
        </Row>

        <Column style={{ gap: 6 }}>
          <Text style={{ fontFamily: MONO, fontSize: 12, color: INK2 }}>{v.domains}</Text>
          <Heading level={1} style={{ fontWeight: 800, fontSize: 30, lineHeight: 1.08, letterSpacing: -0.7, color: v.attention ? BAD : GOOD }}>
            {headline(v)}
          </Heading>
          <Text style={{ color: INK2, lineHeight: 1.55 }}>
            {`${v.total} ${v.total === 1 ? "hostname has" : "hostnames have"} an unexpired certificate in the public Certificate Transparency logs.${v.nextExpiry ? ` The next one to expire: ${nice(v.nextExpiry)}.` : ""} Each live host was asked for its certificate on port 443.${shown}`}
          </Text>
        </Column>

        <Row style={{ gap: 8 }}>
          {counts.map(([s, n]) => (
            <Column key={s} style={{ width: countW, backgroundColor: WASH, padding: [8, 10], gap: 2, border: { left: `3px solid ${TONE[s]}` } }}>
              <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: 16, color: TONE[s] }}>{String(n)}</Text>
              <Text style={{ fontSize: 8.5, color: INK2 }}>{LABEL[s]}</Text>
            </Column>
          ))}
        </Row>

        {rowPages.map((rows, i) => (
          <Fragment key={`rows${i}`}>
            {i ? <PageBreak /> : null}
            <Timeline rows={rows} v={v} last={i === rowPages.length - 1} />
          </Fragment>
        ))}

        {cardPages.map((cards, i) => (
          <Fragment key={`cards${i}`}>
            <PageBreak />
            {act.length ? (
              <Column style={{ gap: 8 }}>
                <Text style={{ ...label, color: BAD }}>{i ? "Needs attention, continued" : "Needs attention"}</Text>
                {cards.map((h) => (
                  <Column key={h.host} style={{ gap: 3, padding: [9, 12], backgroundColor: WASH, border: { left: `3px solid ${TONE[h.state]}` } }}>
                    <Row style={{ alignItems: "center" }}>
                      <Column>
                        <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600 }}>{h.host}</Text>
                      </Column>
                      <Column style={{ width: 150 }}>
                        <Text style={{ fontSize: 8.5, fontWeight: 700, color: TONE[h.state], textAlign: "right" }}>{LABEL[h.state]}</Text>
                      </Column>
                    </Row>
                    <Text style={{ fontSize: 9, color: INK2, lineHeight: 1.5 }}>{h.why}</Text>
                    <Text style={{ fontSize: 7.5, color: MUTED }}>{`${h.issuer} · issued ${nice(h.issued)} · ${h.lifeDays}-day certificate · expires ${nice(h.expires)}`}</Text>
                  </Column>
                ))}
              </Column>
            ) : (
              <Column style={{ gap: 4, padding: [10, 12], backgroundColor: WASH, border: { left: `3px solid ${GOOD}` } }}>
                <Text style={{ fontWeight: 700, color: GOOD }}>Nothing needs attention</Text>
                <Text style={{ fontSize: 9, color: INK2 }}>Every live host serves its newest certificate, and none is past its renewal point.</Text>
              </Column>
            )}
          </Fragment>
        ))}

        {scOwnPage ? <PageBreak /> : null}
        <Column style={{ gap: 8 }}>
          <Text style={{ ...label, color: VIOLET }}>Shorter certificates are coming</Text>
          <Text style={{ fontSize: 9.5, color: INK2, lineHeight: 1.5 }}>
            {`The CA/Browser Forum's Ballot SC-081v3 caps how long a public TLS certificate may last. The longest one here lasts ${longest} days. ${longest <= 47 ? "That already fits every step below." : longest <= 100 ? "It fits until 15 March 2029; after that, 47 days means renewing about every month. Make sure every renewal is automated." : "Manual renewals will need to happen far more often. Automate them before the next step."}`}
          </Text>
          <Row style={{ gap: 8 }}>
            {SC081.map((s) => (
              <Column key={s.from} style={{ padding: [8, 10], gap: 2, border: `0.75px solid ${s.days < longest ? WAIT : LINE}` }}>
                <Text style={{ fontSize: 8, color: MUTED }}>From {nice(s.from)}</Text>
                <Text style={{ fontFamily: MONO, fontWeight: 600, fontSize: 14 }}>{`${s.days} days`}</Text>
                <Text style={{ fontSize: 8, color: INK2 }}>{`at least ${Math.ceil(365 / s.days)} renewals a year`}</Text>
              </Column>
            ))}
          </Row>
          <Text style={{ fontSize: 7.5, color: MUTED }}>Source: cabforum.org, Ballot SC081v3 (April 2025). Certificates issued before each date keep their own length.</Text>
        </Column>

        <PageFooter style={{ padding: [10, 0, 0], border: { top: `0.75px solid ${LINE}` } }}>
          <Row>
            <Column>
              <Text style={{ fontSize: 7, color: MUTED }}>Certificate Transparency via CertSpotter (SSLMate) · served certificates read on port 443 · {nice(v.date)}</Text>
            </Column>
            <Column style={{ width: 80 }}>
              <Text style={{ fontSize: 7, color: MUTED, textAlign: "right" }}>
                Page <PageNumber /> of <PageNumber total />
              </Text>
            </Column>
          </Row>
        </PageFooter>
      </Document>
    );
  },
});
