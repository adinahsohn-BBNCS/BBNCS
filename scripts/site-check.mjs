// Crawl the live site and check every page, asset, and link.
// Usage: node scripts/site-check.mjs [https://bbncs.com]
const origin = (process.argv[2] || "https://bbncs.com").replace(/\/$/, "");
const host = new URL(origin).host;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

const pages = new Map();
const assets = new Map();
const external = new Map();
const problems = [];

async function get(url, method = "GET") {
  try {
    const res = await fetch(url, { method, redirect: "follow", headers: { "user-agent": UA } });
    const body = method === "GET" ? await res.arrayBuffer() : new ArrayBuffer(0);
    return { status: res.status, finalUrl: res.url, type: res.headers.get("content-type") || "", body: Buffer.from(body) };
  } catch (e) {
    return { status: 0, finalUrl: url, type: "", body: Buffer.alloc(0), error: e.cause?.code || e.message };
  }
}

function extractRefs(html, base) {
  const refs = [];
  const re = /\b(?:href|src|content|action)=["']([^"']+)["']|srcset=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const values = m[2] ? m[2].split(",").map((s) => s.trim().split(/\s+/)[0]) : [m[1]];
    for (const v of values) {
      if (!v || /^(mailto:|tel:|javascript:|data:|#)/i.test(v)) continue;
      if (!/^(https?:)?\/\//i.test(v) && !v.startsWith("/") && !/\.\w{2,5}($|\?)/.test(v) && !v.endsWith("/")) continue;
      try {
        const u = new URL(v, base);
        u.hash = "";
        refs.push(u.toString());
      } catch {}
    }
  }
  return refs;
}

function isPage(u) {
  const p = new URL(u).pathname;
  return p.endsWith("/") || p.endsWith(".html");
}

async function crawl() {
  const sitemap = await get(`${origin}/sitemap.xml`);
  const seeds = [...sitemap.body.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const queue = [`${origin}/`, ...seeds];
  const extraPaths = ["/review/", "/remote/", "/support/", "/support/ticket/", "/robots.txt", "/sitemap.xml"];
  for (const p of extraPaths) queue.push(origin + p);

  while (queue.length) {
    const url = queue.shift();
    const u = new URL(url);
    if (u.host !== host) continue;
    if (pages.has(url) || assets.has(url)) continue;

    const res = await get(url);
    const finalPath = new URL(res.finalUrl).pathname;
    const html = res.type.includes("text/html");
    const record = { status: res.status, finalUrl: res.finalUrl, size: res.body.length };

    if (html && isPage(url)) {
      pages.set(url, record);
      const text = res.body.toString();
      if (res.status !== 200) problems.push(`PAGE ${res.status}: ${url}`);
      if (res.finalUrl.replace(/\/$/, "") !== url.replace(/\/$/, "")) problems.push(`PAGE REDIRECTED: ${url} -> ${res.finalUrl}`);
      if (/cgi-sys|suspended/i.test(finalPath + text.slice(0, 3000))) problems.push(`SUSPENSION/PLACEHOLDER: ${url}`);
      if (!/Bits, Bytes/i.test(text)) problems.push(`MISSING BRAND TEXT: ${url}`);
      const title = (text.match(/<title>([^<]*)<\/title>/i) || [])[1];
      if (!title) problems.push(`NO <title>: ${url}`);
      record.title = title;
      record.noindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(text);
      const canonical = (text.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i) || [])[1];
      record.canonical = canonical;
      if (canonical && canonical !== url && !record.noindex) problems.push(`CANONICAL MISMATCH: ${url} -> ${canonical}`);
      if (/(?:src|href)=["']http:\/\//i.test(text)) problems.push(`INSECURE http:// REFERENCE: ${url}`);
      if (!/G-K0PQ3RGV7E/.test(text)) problems.push(`NO GA TAG: ${url}`);

      for (const ref of extractRefs(text, res.finalUrl)) {
        const r = new URL(ref);
        if (r.host === host) {
          if (!pages.has(ref) && !assets.has(ref)) queue.push(ref);
        } else if (/^https?:$/.test(r.protocol)) {
          if (!external.has(ref)) external.set(ref, { from: url });
        }
      }
    } else {
      assets.set(url, record);
      if (res.status !== 200) problems.push(`ASSET ${res.status}: ${url}`);
      else if (res.body.length === 0) problems.push(`EMPTY ASSET: ${url}`);
    }
  }
}

async function checkExternal() {
  const skip = /fonts\.googleapis|fonts\.gstatic|googletagmanager|schema\.org|w3\.org|formsubmit\.co|supabase\.co/;
  const list = [...external.keys()].filter((u) => !skip.test(u));
  await Promise.all(
    list.map(async (u) => {
      const res = await get(u);
      external.get(u).status = res.status || res.error;
    }),
  );
  for (const u of external.keys()) if (skip.test(u)) external.get(u).status = "skipped";
}

await crawl();
await checkExternal();

console.log(`\nPAGES (${pages.size})`);
for (const [u, r] of [...pages].sort()) console.log(`  ${r.status}  ${u.replace(origin, "") || "/"}${r.noindex ? "  [noindex]" : ""}  — ${r.title}`);
console.log(`\nASSETS (${assets.size})`);
const assetFails = [...assets].filter(([, r]) => r.status !== 200);
console.log(`  ${assets.size - assetFails.length} OK, ${assetFails.length} failed`);
console.log(`\nEXTERNAL LINKS (${external.size})`);
for (const [u, r] of [...external].sort()) console.log(`  ${r.status}  ${u}`);
console.log(`\nPROBLEMS (${problems.length})`);
for (const p of problems) console.log(`  ${p}`);
