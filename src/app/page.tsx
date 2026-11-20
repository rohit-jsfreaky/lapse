import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, CalendarDate, FileCheck02, Mail01 } from "@untitledui/icons";
import { Mark } from "@/components/Mark";

const WRAP = "mx-auto max-w-[1200px] px-6";

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <Nav />
      <Hero />
      <Why />
      <Example />
      <How />
      <Outputs />
      <States />
      <Faq />
      <Close />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line">
      <div className={`${WRAP} h-16 flex items-center gap-4 md:gap-8`}>
        <Link href="/" className="flex items-center gap-2 font-extrabold text-[20px] tracking-tight">
          <Mark /> Lapse
        </Link>
        <nav className="hidden md:flex gap-6 text-[14px] font-medium text-muted">
          <a href="#why" className="hover:text-ink">Why</a>
          <a href="#example" className="hover:text-ink">Example</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#outputs" className="hover:text-ink">What you get</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex-1" />
        <Link href="/check" className="btn btn-violet">
          <span className="hidden sm:inline">Check a domain</span>
          <span className="sm:hidden">Start</span> <ArrowRight size={16} />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-line">
      <div className={`${WRAP} pt-16 md:pt-24`}>
        <p className="label">For anyone whose expiry reminder emails stopped</p>
        <h1 className="mt-5 font-extrabold text-[46px] md:text-[82px] leading-[0.98] tracking-[-0.035em] max-w-[1050px]">
          Every certificate on your domain. <span className="text-violet">And the ones that won&apos;t renew.</span>
        </h1>
        <div className="mt-8 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <p className="text-[18px] md:text-[19px] leading-relaxed text-ink-2 max-w-[640px]">
            Type a domain. Lapse finds every subdomain with a certificate in the public Certificate Transparency logs, asks each host what it really serves, and tells you which renewals are stuck, which never got deployed, and which hosts stopped answering.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/check" className="btn btn-violet !px-5 !py-3 !text-[15px]">
              Check a domain <ArrowRight size={17} />
            </Link>
            <a href="/landing/getrevlio-report.pdf" className="btn btn-line !px-5 !py-3 !text-[15px]">
              Sample report (PDF)
            </a>
          </div>
        </div>
        <figure className="mt-12 rounded-t-3xl border border-b-0 border-rule bg-wash p-2.5 pb-0 shadow-[0_-24px_60px_-34px_rgb(36_21_52/0.4)]">
          <Image src="/landing/panel.png" alt="Lapse checking getrevlio.com: 3 of 11 hosts need attention, each certificate shown as a time-left bar" width={1440} height={900} priority className="w-full h-auto rounded-t-2xl border border-b-0 border-line" />
        </figure>
      </div>
    </section>
  );
}

const STEPS = [
  ["Before 15 Mar 2026", "398 days"],
  ["From 15 Mar 2026", "200 days"],
  ["From 15 Mar 2027", "100 days"],
  ["From 15 Mar 2029", "47 days"],
];

function Why() {
  return (
    <section id="why" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-2 gap-12 items-start`}>
        <div>
          <Head n="01" eyebrow="Why" title="The reminder emails are gone. Certificates keep getting shorter." />
          <div className="mt-8 bg-paper border border-line rounded-2xl p-6">
            <p className="label">The longest certificate a public CA may issue</p>
            <ul className="mt-3 divide-y divide-line">
              {STEPS.map(([d, n]) => (
                <li key={d} className="flex justify-between py-2.5 text-[15px]">
                  <span className="text-ink-2">{d}</span>
                  <span className="font-mono font-semibold">{n}</span>
                </li>
              ))}
            </ul>
            <a className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-violet underline underline-offset-2" href="https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/">
              CA/Browser Forum Ballot SC-081v3 <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
        <div className="md:pt-24 space-y-10">
          <blockquote className="border-l-4 border-violet pl-6">
            <p className="font-bold text-[22px] md:text-[26px] leading-snug tracking-tight">&ldquo;We will be ending this service on June 4, 2025… For those who would like to continue receiving expiration notifications, we recommend using a third party service.&rdquo;</p>
            <footer className="mt-3 text-[14px] text-muted">
              Let&apos;s Encrypt,{" "}
              <a className="underline underline-offset-2 hover:text-ink" href="https://letsencrypt.org/2025/01/22/ending-expiration-emails">
                &ldquo;Ending Support for Expiration Notification Emails&rdquo;
              </a>
              , 22 January 2025.
            </footer>
          </blockquote>
          <blockquote className="border-l-4 border-rule pl-6">
            <p className="text-[18px] leading-snug text-ink-2">&ldquo;We monitor all our certificates, including LE certs, to ensure that they are renewing properly before expiration. Every shop I&apos;ve worked for has done this in one way or another.&rdquo;</p>
            <footer className="mt-3 text-[14px] text-muted">
              A reply on{" "}
              <a className="underline underline-offset-2 hover:text-ink" href="https://old.reddit.com/r/sysadmin/comments/1ii6qlm/">
                r/sysadmin
              </a>
              , February 2025.
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

const FOUND = [
  ["api.tieout.getrevlio.com", "Not answering", "text-wait", "Its certificate was due to renew on 5 Nov and hasn't. Nothing answers on port 443."],
  ["api.monitoring.getrevlio.com", "Not answering", "text-wait", "Due to renew on 17 Nov; connection refused."],
  ["api.pinpoint.getrevlio.com", "Not answering", "text-wait", "Valid until 14 Jan 2027, but nothing answers on port 443."],
  ["monitoring.getrevlio.com", "OK, renewal point today", "text-good", "Issued 21 Sep: 60 of its 90 days used, the point where Let's Encrypt advises renewing."],
];

function Example() {
  return (
    <section id="example" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="02" eyebrow="A real example" title="getrevlio.com, checked on 20 November 2026.">
          The author&apos;s own domain. 15 unexpired certificates across 11 hostnames, all from Let&apos;s Encrypt. Eight renew on time. Three are API hosts that still have DNS records, but nothing answers on port 443 any more.
        </Head>
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          {FOUND.map(([h, s, tone, d]) => (
            <div key={h} className="border border-line rounded-2xl p-6">
              <p className="font-mono text-[16px] break-all">{h}</p>
              <p className={`mt-1 text-[13.5px] font-bold ${tone}`}>{s}</p>
              <p className="mt-3 text-[14.5px] text-ink-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function How() {
  const steps = [
    ["Type the domains", "Up to five. No account. Your browser asks CertSpotter's Certificate Transparency search for every unexpired certificate, subdomains included."],
    ["Every host is asked", "The server opens a TLS connection to each public host and reads the certificate it really sends: dates, issuer, and whether the name matches."],
    ["Read the verdicts", "Each certificate as a time-left bar on one timeline, worst first, with the reason in plain words."],
    ["Send the paperwork", "The report for the record, the alert email for whoever fixes it, and a calendar for the team channel."],
  ];
  return (
    <section id="how" className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="03" eyebrow="How it works" title="A domain in, every renewal out." />
        <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="bg-paper border border-line rounded-2xl p-6">
              <span className="font-mono text-[14px] text-violet">0{i + 1}</span>
              <div className="mt-3 h-1.5 rounded-full bg-wash overflow-hidden">
                <div className="h-full bg-violet" style={{ width: `${(i + 1) * 25}%` }} />
              </div>
              <h3 className="mt-4 font-extrabold text-[21px] tracking-tight">{t}</h3>
              <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Outputs() {
  return (
    <section id="outputs" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="04" eyebrow="What you get" title="The report, the alert, the calendar.">
          Rendered by shared Hyper Elements templates, in the app or from the command line.
        </Head>
        <div className="mt-12 grid md:grid-cols-12 gap-4">
          <Tile className="md:col-span-5 md:row-span-2" icon={<FileCheck02 size={17} />} name="The report" note="A4 PDF · every host on one timeline, what needs attention, what 2027 changes">
            <Image src="/landing/report.png" alt="Certificate report for getrevlio.com: 3 of 11 hosts need attention, with a time-left bar per host" width={1241} height={1754} className="w-full h-auto rounded-xl border border-line" />
          </Tile>
          <Tile className="md:col-span-7" icon={<Mail01 size={17} />} name="The alert email" note="To whoever fixes it: each host, what's wrong, by when">
            <div className="h-[330px] overflow-hidden rounded-xl border border-line bg-wash">
              <Image src="/landing/alert.png" alt="Email: 3 certificates need attention, each host with its state, expiry date and reason" width={745} height={986} className="w-full h-auto" />
            </div>
          </Tile>
          <Tile className="md:col-span-7" icon={<CalendarDate size={17} />} name="The calendar" note="1200 × 675 PNG · this month and the next two">
            <Image src="/landing/calendar.png" alt="Renewal calendar: November to January, each expiry day coloured by state" width={1200} height={675} className="w-full h-auto rounded-xl border border-line" />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({ className = "", icon, name, note, children }: { className?: string; icon: ReactNode; name: string; note: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 border border-line rounded-3xl p-5 md:p-6 flex flex-col gap-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center size-10 rounded-xl bg-violet text-white">{icon}</span>
        <div>
          <p className="font-extrabold text-[18px] leading-tight">{name}</p>
          <p className="text-[12.5px] text-muted">{note}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const STATES = [
  ["Renewed, not deployed", "text-bad", "A newer certificate is in the logs, but the server still sends the old one. The renewal worked; the reload didn't."],
  ["Renewal overdue", "text-bad", "More than a week past its renewal point (2/3 of its life) with no newer certificate, or a week or less left."],
  ["Wrong certificate", "text-bad", "The host answers with a certificate for a different name."],
  ["Expired", "text-bad", "The host still serves a certificate past its end date."],
  ["Not answering", "text-wait", "In DNS, but nothing on port 443. Retired hosts should lose their DNS record; live ones are down."],
  ["Renewal due", "text-wait", "Past its renewal point, within the week an automated renewal usually takes."],
];

function States() {
  return (
    <section className="border-b border-line bg-wash">
      <div className={`${WRAP} py-20 md:py-28`}>
        <Head n="05" eyebrow="What it catches" title="Not just the expiry date." />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATES.map(([t, tone, d]) => (
            <div key={t} className="bg-paper border border-line rounded-2xl p-6">
              <p className={`font-extrabold text-[19px] ${tone}`}>{t}</p>
              <p className="mt-2 text-[14.5px] text-ink-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Where does the certificate list come from?", "From Certificate Transparency: every publicly trusted certificate is logged in public logs. Lapse uses SSLMate's CertSpotter search, which returns the unexpired ones for a domain and its subdomains."],
  ["Why is there an hourly limit?", "CertSpotter allows a limited number of searches an hour without an account, for personal use, and reading a domain takes at least two. With your own CertSpotter API key the limit is higher; the key stays in your browser and goes only to CertSpotter."],
  ["What does the server do?", "One thing: it opens a TLS connection to each public hostname on port 443 and reads the certificate. It refuses private and internal addresses, and stores nothing."],
  ["How do you know a renewal is stuck?", "Let's Encrypt recommends renewing 90-day certificates every 60 days. If a certificate is more than a week past that point and no newer one for the same name is in the logs, the renewal has most likely stopped."],
  ["Does it work for certificates that aren't from Let's Encrypt?", "Yes. Every public CA logs its certificates. The renewal point is 2/3 of each certificate's own life, so a 200-day certificate is judged by its own length."],
  ["What about internal hosts?", "Certificates from a private CA aren't in the public logs, and Lapse won't connect to private addresses. It's for what the internet can see."],
  ["Can I run it on a schedule?", "The outputs are Hyper Elements templates. npm run sample re-reads a domain and writes the values, and npm run reports renders the PDF, the email and the calendar with the Hyper Elements command line tool."],
] as const;

function Faq() {
  return (
    <section id="faq" className="border-b border-line">
      <div className={`${WRAP} py-20 md:py-28 grid md:grid-cols-[360px_1fr] gap-12`}>
        <div className="md:sticky md:top-28 self-start">
          <Head n="06" eyebrow="FAQ" title="Before you check." />
        </div>
        <div className="border-t border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-bold text-[18px]">
                {q}
                <span className="grid place-items-center size-8 shrink-0 rounded-full border-2 border-violet text-violet text-[17px] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-6 pr-12 text-[15.5px] text-ink-2 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Close() {
  return (
    <>
      <section className="bg-ink text-white">
        <div className={`${WRAP} py-20 md:py-24 grid md:grid-cols-[1fr_auto] gap-8 items-end`}>
          <div>
            <h2 className="font-extrabold text-[40px] md:text-[64px] leading-[0.98] tracking-[-0.03em] max-w-[760px]">Find the stuck renewal before your visitors do.</h2>
            <p className="mt-4 text-[17px] text-white/70 max-w-[520px]">Check your domains, or a client&apos;s.</p>
          </div>
          <Link href="/check" className="btn bg-white text-ink hover:bg-white/90 !px-6 !py-3.5 !text-[15px]">
            Check a domain <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <footer className={`${WRAP} py-10 flex flex-col md:flex-row gap-3 justify-between text-[13px] text-muted`}>
        <span className="flex items-center gap-2 font-extrabold text-[18px] text-ink">
          <Mark size={22} /> Lapse
        </span>
        <p className="max-w-[720px] md:text-right">
          Built with{" "}
          <a className="underline underline-offset-2 hover:text-ink inline-flex items-center gap-0.5" href="https://github.com/hyper-elements/hyper-elements">
            Hyper Elements <ArrowUpRight size={12} />
          </a>
          . Not affiliated with Let&apos;s Encrypt, SSLMate or the CA/Browser Forum. The sample domain belongs to the author.
        </p>
      </footer>
    </>
  );
}

function Head({ n, eyebrow, title, children }: { n: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <p className="label">
        <span className="text-violet font-bold">{n}</span> · {eyebrow}
      </p>
      <h2 className="mt-4 font-extrabold text-[36px] md:text-[52px] leading-[1.03] tracking-[-0.03em]">{title}</h2>
      {children ? <p className="mt-5 text-[17px] leading-relaxed text-ink-2">{children}</p> : null}
    </div>
  );
}
