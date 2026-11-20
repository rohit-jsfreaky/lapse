import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleanDomains, fromCertSpotter, hostnames, judge, judgeAll, maxLifeOn, renewAt, ymd, type Issuance } from "../templates/_shared/certs.ts";
import { isPrivate } from "../src/lib/served.ts";

const cert = (names: string[], notBefore: string, days = 90, sha = notBefore): Issuance => ({ id: sha, names, issuer: "Let's Encrypt", notBefore: `${notBefore}T00:00:00Z`, notAfter: new Date(Date.parse(`${notBefore}T00:00:00Z`) + days * 86_400_000).toISOString(), sha256: sha });
const up = (host: string, c: Issuance, extra = {}) => ({ host, ok: true, notBefore: c.notBefore, notAfter: c.notAfter, sha256: c.sha256, names: c.names, nameMismatch: false, ...extra });

test("SC-081 schedule and Let's Encrypt's renewal point", () => {
  assert.deepEqual(["2026-03-14", "2026-03-15", "2027-03-15", "2029-03-14", "2029-03-15"].map(maxLifeOn), [398, 200, 100, 100, 47]);
  assert.equal(ymd(renewAt("2026-09-01T00:00:00Z", "2026-11-30T00:00:00Z")), "2026-10-31"); // 90 days: at 60
  assert.equal(ymd(renewAt("2026-11-01T00:00:00Z", "2026-11-07T00:00:00Z")), "2026-11-04"); // 6 days: at 3
});

test("every state, worst first", () => {
  const a = cert(["a.ex.com"], "2026-10-01");
  const b = cert(["b.ex.com"], "2026-09-01");
  const old = cert(["c.ex.com"], "2026-08-25", 90, "old");
  const fresh = cert(["c.ex.com"], "2026-10-25", 90, "new");
  const d = cert(["d.ex.com"], "2026-09-15");
  const e = cert(["e.ex.com"], "2026-09-10");
  const f = cert(["f.ex.com"], "2026-10-01");
  const today = "2026-11-20";
  const certs = [a, b, old, fresh, d, e, f];
  const served = [
    up("a.ex.com", a),
    up("b.ex.com", b),
    up("c.ex.com", old),
    { host: "d.ex.com", ok: false, error: "connection refused" },
    { host: "e.ex.com", ok: false, error: "not in DNS" },
    up("f.ex.com", f, { nameMismatch: true, names: ["other.net"] }),
  ];
  const got = judgeAll(["ex.com"], certs, today, served).map((h) => [h.host, h.state]);
  assert.deepEqual(got, [
    ["f.ex.com", "wrong-name"],
    ["c.ex.com", "not-deployed"],
    ["b.ex.com", "overdue"],
    ["d.ex.com", "not-answering"],
    ["a.ex.com", "ok"],
    ["e.ex.com", "retired"],
  ]);
  assert.equal(judge("x.ex.com", [cert(["x.ex.com"], "2026-09-19")], today).state, "due");
  // A CDN holding several certificates issued the same day, serving the older one by minutes: fine.
  const le = cert(["cdn.ex.com"], "2026-11-07", 90, "le");
  const backup = { ...cert(["cdn.ex.com"], "2026-11-07", 90, "backup"), notBefore: "2026-11-07T00:05:00Z", issuer: "SSL.com" };
  const cdn = judge("cdn.ex.com", [le, backup], today, up("cdn.ex.com", le));
  assert.deepEqual([cdn.state, cdn.issuer], ["ok", "Let's Encrypt"]); // renew at 18 Nov, today 20 Nov
  assert.equal(judge("x.ex.com", [cert(["x.ex.com"], "2026-09-19")], today, up("x.ex.com", cert(["x.ex.com"], "2026-08-01", 90))).state, "expired");
});

test("hostnames: apex and www first, other domains' names left out", () => {
  assert.deepEqual(hostnames([cert(["api.ex.com", "ex.com", "*.ex.com", "www.ex.com", "ex.com.evil.net"], "2026-10-01")], "ex.com"), ["ex.com", "www.ex.com", "api.ex.com", "*.ex.com"]);
});

test("pasted domains are cleaned", () => {
  assert.deepEqual(cleanDomains("https://Example.com/path, *.ex.org\nfoo.co.uk.  not_a_domain localhost example.com"), ["example.com", "ex.org", "foo.co.uk"]);
});

test("never connect to private addresses", () => {
  assert.deepEqual(["10.1.2.3", "127.0.0.1", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "fd00::1", "::ffff:10.0.0.1", "8.8.8.8", "2606:4700::1"].map(isPrivate), [true, true, true, true, true, true, true, true, true, false, false]);
});

test("getrevlio.com, frozen 20 Nov 2026: 15 certificates, 11 hosts, 3 not answering", () => {
  const s = JSON.parse(readFileSync(new URL("../public/samples/getrevlio.json", import.meta.url), "utf8"));
  const hosts = judgeAll(s.domains, fromCertSpotter(s.certspotter), s.date, s.served);
  assert.equal(fromCertSpotter(s.certspotter).length, 15);
  assert.equal(hosts.length, 11);
  assert.deepEqual(hosts.filter((h) => h.state !== "ok").map((h) => h.host), ["api.tieout.getrevlio.com", "api.monitoring.getrevlio.com", "api.pinpoint.getrevlio.com"]);
});
