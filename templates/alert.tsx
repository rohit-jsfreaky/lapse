/**
 * The alert: an email to the site owner or team. The certificates that need attention, each with the reason and the
 * date, then the next ones to expire. The reminder Let's Encrypt stopped sending, with more in it.
 */
import { Column, Email, Heading, Section, Text } from "@hyper-elements/react";
import { lint } from "@hyper-elements/lint";
import { template } from "@hyper-elements/react/template";
import { FONT_URLS, GOOD, INK2, LABEL, MONO, MUTED, TONE, VIOLET, days, example, fields, needsAction, nice, theme, type Values } from "./_shared/doc.tsx";

const label = { fontFamily: MONO, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED } as const;

export default template({
  id: "lapse.Alert",
  version: "1.0.0",
  label: "Certificate alert (email)",
  guidance: "Send it when something needs attention, or weekly. Attach the report for the full picture.",
  root: "Email",
  fields,
  rules: { plugins: { lint: lint() }, require: { lint: ["lang", "contrast", "link-text"] }, root: { previewText: true } },
  example,
  render(input) {
    const v = input as unknown as Values;
    const act = v.hosts.filter(needsAction);
    const next = v.hosts.filter((h) => h.state === "ok").sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);
    const title = act.length ? `${act.length} ${act.length === 1 ? "certificate needs" : "certificates need"} attention` : "Every certificate renews on time";
    return (
      <Email theme={theme} lang="en" width={600} fonts={FONT_URLS} title={`${title} · ${v.domains}`} previewText={act.length ? `${act.map((h) => h.host).slice(0, 3).join(", ")}${act.length > 3 ? " and more" : ""}: what's wrong and by when.` : `${v.domains}: ${v.total} hosts checked, nothing to do.`} style={{ gap: 0 }}>
        <Section style={{ padding: [28, 24, 14] }}>
          <Text style={{ ...label, color: VIOLET }}>
            Lapse · {v.domains}
            {v.team && v.team !== v.domains ? ` · ${v.team}` : ""}
          </Text>
        </Section>
        <Column style={{ apply: ["card"] }}>
          <Heading level={1}>{title}</Heading>
          <Text>{v.owner ? `Hi ${v.owner},` : "Hello,"}</Text>
          <Text>
            {`We checked ${v.total} ${v.total === 1 ? "hostname" : "hostnames"} on ${nice(v.date)}: every unexpired certificate in the public Certificate Transparency logs, and what each server actually sends.${act.length ? " These need a look:" : " Nothing needs a look."}`}
          </Text>
          {act.map((h) => (
            <Column key={h.host} style={{ gap: 4, padding: [12, 14], backgroundColor: "#F7F5FA", border: { left: `4px solid ${TONE[h.state]}` } }}>
              <Text style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600 }}>{h.host}</Text>
              <Text style={{ fontSize: 14, fontWeight: 700, color: TONE[h.state] }}>{`${LABEL[h.state]} · expires ${nice(h.expires)} (${h.daysLeft >= 0 ? `${days(h.daysLeft)} left` : `${days(-h.daysLeft)} ago`})`}</Text>
              <Text style={{ fontSize: 14, color: INK2, lineHeight: 1.5 }}>{h.why}</Text>
            </Column>
          ))}
          {next.length ? (
            <Column style={{ gap: 6 }}>
              <Text style={{ ...label, color: GOOD }}>Next to renew</Text>
              {next.map((h) => (
                <Text key={h.host} style={{ fontSize: 14, color: INK2 }}>{`${h.host}: renews around ${nice(h.renewBy)}, expires ${nice(h.expires)}`}</Text>
              ))}
            </Column>
          ) : null}
          <Text style={{ fontSize: 14, color: MUTED }}>The attached report has every host on one timeline, and what the shorter certificate lifetimes coming in 2027 and 2029 mean for you.</Text>
        </Column>
        <Section style={{ padding: [16, 24, 28] }}>
          <Text style={{ fontSize: 13, color: MUTED }}>{`Checked ${nice(v.date)} with Certificate Transparency (CertSpotter) and a TLS connection to each host.`}</Text>
        </Section>
      </Email>
    );
  },
});
