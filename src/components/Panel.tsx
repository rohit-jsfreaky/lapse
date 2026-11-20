"use client";

import { renderLocal } from "@/lib/render-local";
import NextLink from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, CalendarDate, ChevronDown, Download01, FileCheck02, Mail01, XClose } from "@untitledui/icons";
import { LABEL, cleanDomains, judgeAll, maxLifeOn, nice, outlook, toValues, type Host, type State } from "../../templates/_shared/certs.ts";
import { live, snapshot, type Loaded } from "@/lib/load";
import { Mark } from "./Mark";

type Out = "report" | "alert" | "calendar";
const OUTS: Array<{ key: Out; label: string; icon: ReactNode; file: string }> = [
  { key: "report", label: "Report", icon: <FileCheck02 size={16} />, file: "certificate-report.pdf" },
  { key: "alert", label: "Alert email", icon: <Mail01 size={16} />, file: "certificate-alert.html" },
  { key: "calendar", label: "Calendar", icon: <CalendarDate size={16} />, file: "renewal-calendar.png" },
];
const TONE: Record<State, { text: string; bg: string; bar: string }> = {
  expired: { text: "text-bad", bg: "bg-bad-soft", bar: "bg-bad" },
  "wrong-name": { text: "text-bad", bg: "bg-bad-soft", bar: "bg-bad" },
  "not-deployed": { text: "text-bad", bg: "bg-bad-soft", bar: "bg-bad" },
  overdue: { text: "text-bad", bg: "bg-bad-soft", bar: "bg-bad" },
  "not-answering": { text: "text-wait", bg: "bg-wait-soft", bar: "bg-wait" },
  due: { text: "text-wait", bg: "bg-wait-soft", bar: "bg-wait" },
  ok: { text: "text-good", bg: "bg-good-soft", bar: "bg-good" },
  retired: { text: "text-muted", bg: "bg-wash", bar: "bg-rule" },
};
const ORDER: State[] = ["expired", "wrong-name", "not-deployed", "overdue", "not-answering", "due", "ok", "retired"];
const t = (iso: string) => Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);

export function Panel() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [meta, setMeta] = useState({ owner: "", team: "" });
  const [only, setOnly] = useState<State | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Out | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(get: () => Promise<Loaded>, label: string, sample = false) {
    setBusy(label);
    setError(null);
    try {
      const l = await get();
      setLoaded(l);
      setOnly("all");
      setOpen(null);
      setMeta((m) => (sample ? { owner: m.owner || "Rohit", team: m.team || "getrevlio.com" } : { owner: m.owner, team: m.team || l.domains.join(", ") }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const hosts = useMemo(() => (loaded ? judgeAll(loaded.domains, loaded.certs, loaded.date, loaded.served) : []), [loaded]);
  const values = useMemo(() => (loaded ? toValues(hosts, { domains: loaded.domains, date: loaded.date, owner: meta.owner, team: meta.team }) : null), [hosts, loaded, meta]);

  if (!loaded || !values) return <Start busy={busy} error={error} start={start} />;
  const counts = ORDER.map((s) => [s, hosts.filter((h) => h.state === s).length] as const).filter(([, n]) => n);
  const shown = hosts.filter((h) => only === "all" || h.state === only);
  const win = { a: Math.min(...hosts.map((h) => t(h.notBefore)), t(loaded.date)), b: Math.max(...hosts.map((h) => t(h.notAfter)), t(loaded.date)) };
  const at = (iso: string) => ((t(iso) - win.a) / Math.max(1, win.b - win.a)) * 100;
  const longest = Math.max(...hosts.map((h) => h.lifeDays));

  return (
    <div className="min-h-dvh flex flex-col bg-wash">
      <header className="h-14 shrink-0 bg-paper border-b border-line flex items-center gap-3 px-4 md:px-6">
        <NextLink href="/" className="flex items-center gap-2 font-extrabold text-[19px] tracking-tight" aria-label="Lapse home">
          <Mark /> <span className="max-[400px]:hidden">Lapse</span>
        </NextLink>
        <span className="hidden md:inline font-mono text-[12px] text-muted truncate">{loaded.source}</span>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {OUTS.map((o) => (
            <button key={o.key} className={`btn !py-1.5 max-lg:!px-2.5 ${o.key === "report" ? "btn-violet" : "btn-line"}`} onClick={() => setSheet(o.key)} aria-label={o.label}>
              {o.icon} <span className="hidden lg:inline">{o.label}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-line !py-1.5 max-sm:!px-2.5" onClick={() => setLoaded(null)} aria-label="Check other domains">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Other domains</span>
        </button>
      </header>

      <div className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-6 py-6 grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <main className="min-w-0 space-y-4">
          <section className="bg-paper border border-line rounded-2xl p-5 md:p-6">
            <p className="font-mono text-[13px] text-ink-2">{loaded.domains.join(", ")}</p>
            <h1 className={`mt-1 font-extrabold text-[28px] md:text-[38px] leading-[1.05] tracking-[-0.02em] ${values.attention ? "text-bad" : "text-good"}`}>
              {values.attention ? `${values.attention} of ${values.total} hosts need attention` : `All ${values.total - values.retired} live hosts renew on time`}
            </h1>
            <p className="mt-2 text-[14.5px] text-ink-2 max-w-[720px]">
              {`${hosts.length} hostnames with an unexpired certificate in Certificate Transparency, ${loaded.served.length ? "each asked for its certificate on port 443" : "judged from the logs alone (the server check runs when you run Lapse yourself)"}${values.nextExpiry ? `. Next expiry: ${nice(values.nextExpiry)}` : ""}. Checked ${nice(loaded.date)}.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip on={only === "all"} onClick={() => setOnly("all")} label="All" n={hosts.length} />
              {counts.map(([s, n]) => (
                <Chip key={s} on={only === s} onClick={() => setOnly(only === s ? "all" : s)} label={LABEL[s]} n={n} tone={TONE[s].text} />
              ))}
            </div>
          </section>

          <section className="bg-paper border border-line rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,260px)_1fr_120px] gap-4 px-5 py-2.5 border-b border-line">
              <span className="label">Host</span>
              <span className="label flex justify-between">
                <span>{nice(new Date(win.a).toISOString()).slice(0, -5)}</span>
                <span>{nice(new Date(win.b).toISOString()).slice(0, -5)}</span>
              </span>
              <span className="label text-right">Expires</span>
            </div>
            {shown.map((h) => (
              <HostRow key={h.host} h={h} at={at} today={loaded.date} open={open === h.host} toggle={() => setOpen(open === h.host ? null : h.host)} />
            ))}
            <p className="px-5 py-3 text-[12px] text-muted border-t border-line">Grey: life used. Colour: life left. Black tick: renewal point (2/3 of its life). Violet line: today.</p>
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="bg-paper border border-line rounded-2xl p-5">
            <p className="label !text-violet">Shorter certificates are coming</p>
            <p className="mt-1.5 text-[13.5px] text-ink-2">
              The longest certificate here lasts <span className="font-bold">{longest} days</span>. Today a new one may last at most {maxLifeOn(loaded.date)}.
            </p>
            <ol className="mt-3 space-y-1.5">
              {outlook(loaded.date).map((s) => (
                <li key={s.from} className={`flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 ${s.current ? "bg-violet-soft" : s.days < longest ? "bg-wait-soft" : "bg-wash"}`}>
                  <span className="text-[12.5px] text-ink-2">From {nice(s.from)}</span>
                  <span className="font-mono text-[13px] font-semibold">{s.days} days</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[11.5px] text-muted">CA/Browser Forum Ballot SC-081v3.</p>
          </section>
          <section className="bg-paper border border-line rounded-2xl p-5 space-y-2.5">
            <p className="label">The alert goes to</p>
            <Field label="Name" value={meta.owner} onChange={(v) => setMeta({ ...meta, owner: v })} placeholder="Who reads it" />
            <Field label="Team or client" value={meta.team} onChange={(v) => setMeta({ ...meta, team: v })} placeholder="Shown on the report" />
          </section>
        </aside>
      </div>

      {sheet ? <Sheet out={sheet} setOut={setSheet} values={values} onClose={() => setSheet(null)} /> : null}
    </div>
  );
}

/* ---------- start ---------- */

function Start({ busy, error, start }: { busy: string | null; error: string | null; start: (get: () => Promise<Loaded>, label: string, sample?: boolean) => void }) {
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const domains = cleanDomains(text);
  return (
    <div className="min-h-dvh grid place-items-center p-4 md:p-8 bg-wash">
      <div className="w-full max-w-[620px] bg-paper border border-line rounded-3xl overflow-hidden shadow-[0_30px_60px_-34px_rgb(36_21_52/0.35)]">
        <div className="p-6 md:p-8 border-b border-line">
          <NextLink href="/" className="flex items-center gap-2 font-extrabold text-[19px]">
            <Mark /> Lapse
          </NextLink>
          <h1 className="mt-6 font-extrabold text-[32px] md:text-[38px] leading-[1.06] tracking-tight">Which domains should we check?</h1>
          <p className="mt-2 text-[15px] text-muted leading-relaxed">Every subdomain with a certificate is found for you, from the public Certificate Transparency logs.</p>
        </div>
        <form
          className="p-6 md:p-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (domains.length) start(() => live(domains.slice(0, 5), key.trim() || undefined), domains.join(", "));
          }}
        >
          <label className="block">
            <span className="text-[13px] font-bold text-ink-2">Domains (up to 5)</span>
            <input className="input mt-1 font-mono !text-[14px]" placeholder="example.com, example.org" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center gap-1 text-[13px] font-bold text-ink-2">
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" /> CertSpotter API key (optional)
            </summary>
            <input className="input mt-2 font-mono !text-[13px]" placeholder="Raises the hourly limit; stays in your browser" value={key} onChange={(e) => setKey(e.target.value)} type="password" autoComplete="off" />
          </details>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-violet" disabled={!domains.length || !!busy}>
              Check {domains.length > 1 ? `${domains.length} domains` : "certificates"}
            </button>
            <button type="button" className="btn btn-line" disabled={!!busy} onClick={() => start(snapshot, "the sample", true)}>
              Sample: getrevlio.com
            </button>
          </div>
          <p className="text-[12.5px] text-muted">Your browser asks CertSpotter for the logs. The server only opens a TLS connection to each public host to read its certificate.</p>
          {busy ? <p className="text-[13px] text-muted font-mono">Checking {busy}…</p> : null}
          {error ? (
            <p className="text-[13px] text-bad flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

/* ---------- rows ---------- */

function HostRow({ h, at, today, open, toggle }: { h: Host; at: (iso: string) => number; today: string; open: boolean; toggle: () => void }) {
  const tone = TONE[h.state];
  const x0 = at(h.notBefore);
  const x1 = at(h.notAfter);
  const now = Math.min(Math.max(at(today), x0), x1);
  const s = h.served;
  return (
    <div className="border-b border-line last:border-0">
      <button onClick={toggle} aria-expanded={open} className="w-full text-left grid md:grid-cols-[minmax(0,260px)_1fr_120px] gap-x-4 gap-y-2 px-5 py-3 hover:bg-wash/60 items-center">
        <span className="min-w-0">
          <span className={`block font-mono text-[13px] truncate ${h.state === "retired" ? "text-muted" : ""}`}>{h.host}</span>
          <span className={`text-[12px] font-bold ${tone.text}`}>{LABEL[h.state]}</span>
        </span>
        <span className="relative h-3.5 rounded bg-wash" aria-hidden="true">
          <span className="absolute inset-y-0 rounded-l bg-used" style={{ left: `${x0}%`, width: `${now - x0}%` }} />
          <span className={`absolute inset-y-0 rounded-r ${tone.bar}`} style={{ left: `${now}%`, width: `${x1 - now}%` }} />
          <span className="absolute -inset-y-1 w-[1.5px] bg-ink" style={{ left: `${at(h.renewBy)}%` }} />
          <span className="absolute -inset-y-1.5 w-[2px] bg-violet" style={{ left: `${at(today)}%` }} />
        </span>
        <span className="md:text-right">
          <span className="font-mono text-[12.5px]">{nice(h.notAfter)}</span>
          <span className="block text-[11.5px] text-muted">{h.daysLeft >= 0 ? `${h.daysLeft} days left` : `${-h.daysLeft} days ago`}</span>
        </span>
      </button>
      {open ? (
        <div className={`mx-5 mb-4 rounded-xl p-4 ${tone.bg}`}>
          <p className="text-[14px] text-ink">{h.why}</p>
          <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px]">
            <Def k="In the logs" v={`${h.issuer}, ${h.lifeDays} days: ${nice(h.notBefore)} to ${nice(h.notAfter)}`} />
            <Def k="Renews around" v={nice(h.renewBy)} />
            <Def k="Served now" v={!s ? (h.host.startsWith("*.") ? "Not checked (wildcard)" : "Not checked here") : s.ok ? `${s.issuer}, ${nice(s.notBefore!)} to ${nice(s.notAfter!)}${s.nameMismatch ? ", wrong name" : ""}` : s.error ?? "No answer"} />
            <Def k="Certificates in the logs" v={String(h.certs)} />
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function Def({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{k}</dt>
      <dd className="font-mono text-[12px] text-ink break-words">{v}</dd>
    </div>
  );
}

function Chip({ on, onClick, label, n, tone = "" }: { on: boolean; onClick: () => void; label: string; n: number; tone?: string }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`rounded-full border px-3 py-1 text-[13px] font-bold flex items-center gap-2 ${on ? "border-ink bg-ink text-white" : "border-rule bg-paper hover:border-ink"}`}>
      <span className={on ? "" : tone}>{label}</span>
      <span className={`font-mono text-[12px] ${on ? "text-white/70" : "text-muted"}`}>{n}</span>
    </button>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-ink-2">{label}</span>
      <input className="input mt-1 !py-1.5 !text-[13.5px]" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ---------- outputs ---------- */

function Sheet({ out, setOut, values, onClose }: { out: Out; setOut: (o: Out) => void; values: ReturnType<typeof toValues>; onClose: () => void }) {
  const [view, setView] = useState<{ url?: string; html?: string; issues?: string[] } | null>(null);
  const key = JSON.stringify(values);
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
      const type = res.headers.get("Content-Type") ?? "";
      const next = type.includes("json")
        ? await res.json().then((j) => (res.ok ? { html: j.html as string } : { issues: (j.diagnostics ?? [{ message: j.error }]).map((d: { message: string; path?: string }) => `${d.path ? `${d.path.replace(/^values\./, "")}: ` : ""}${d.message}`) }))
        : { url: URL.createObjectURL(await res.blob()) };
      if (!alive) return;
      setView((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return next;
      });
    }, 150);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out, key]);

  async function download() {
    const res = await renderLocal({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ output: out, values }) });
    if (!res.ok) return;
    const a = document.createElement("a");
    a.href = out === "alert" ? URL.createObjectURL(new Blob([(await res.json()).html], { type: "text/html" })) : URL.createObjectURL(await res.blob());
    a.download = `${values.domains.split(",")[0].replace(/[^a-z0-9]+/gi, "-")}-${OUTS.find((o) => o.key === out)!.file}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/35" onClick={onClose}>
      <div className="w-full md:w-[min(1040px,94vw)] h-full bg-paper flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-14 shrink-0 border-b border-line flex items-center gap-1 sm:gap-2 px-3 sm:px-5">
          {OUTS.map((o) => (
            <button key={o.key} onClick={() => o.key !== out && (setOut(o.key), setView(null))} className={`px-3 py-1.5 rounded-lg text-[13.5px] font-bold ${out === o.key ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
              {o.label}
            </button>
          ))}
          <div className="flex-1" />
          <button className="btn btn-violet" onClick={() => void download()} aria-label="Download">
            <Download01 size={16} /> <span className="hidden sm:inline">Download</span>
          </button>
          <button className="text-muted hover:text-ink ml-1" onClick={onClose} aria-label="Close">
            <XClose size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-wash flex">
          {view?.issues ? (
            <div className="m-6 rounded-xl bg-wait-soft p-4 space-y-1 self-start">
              <p className="font-bold text-wait text-[14px]">The template refused these values</p>
              {view.issues.map((m) => (
                <p key={m} className="text-[13px]">
                  {m}
                </p>
              ))}
            </div>
          ) : view?.url && out === "report" ? (
            <iframe title="Certificate report" src={view.url} className="flex-1" />
          ) : view?.url ? (
            <div className="flex-1 grid place-items-center p-6 overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={view.url} alt="Renewal calendar" className="max-h-full max-w-full border border-line rounded-lg shadow-lg" />
            </div>
          ) : view?.html ? (
            <iframe title="Alert email" srcDoc={view.html} className="flex-1 bg-white" />
          ) : (
            <p className="m-auto text-[14px] text-muted">Rendering with Hyper Elements…</p>
          )}
        </div>
      </div>
    </div>
  );
}
