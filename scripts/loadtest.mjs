const URL_ = process.env.API_URL;
const KEY = process.env.API_KEY;
const BODY = process.env.BODY || JSON.stringify({ agent: "loadtest", action: "search.query", resource: "docs", risk: 10 });
const TOTAL = Number(process.env.TOTAL || 200);
const CONC = Number(process.env.CONC || 20);
if (!URL_ || !KEY) { console.error("API_URL ve API_KEY gerekli"); process.exit(1); }

const lat = [], codes = {}, decisions = {};
let next = 0;

async function worker() {
  while (next < TOTAL) {
    next++;
    const t0 = performance.now();
    try {
      const r = await fetch(URL_, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + KEY }, body: BODY });
      codes[r.status] = (codes[r.status] || 0) + 1;
      const j = await r.json().catch(() => ({}));
      const d = j.effect || j.data?.effect;
      if (d) decisions[d] = (decisions[d] || 0) + 1;
    } catch { codes.neterr = (codes.neterr || 0) + 1; }
    lat.push(performance.now() - t0);
  }
}

const t0 = performance.now();
await Promise.all(Array.from({ length: CONC }, worker));
const sec = (performance.now() - t0) / 1000;
lat.sort((a, b) => a - b);
const p = (q) => lat[Math.min(lat.length - 1, Math.floor(lat.length * q))].toFixed(0) + " ms";
console.log({ total: TOTAL, concurrency: CONC, seconds: sec.toFixed(1), rps: (TOTAL / sec).toFixed(1), p50: p(0.5), p95: p(0.95), p99: p(0.99), statusCodes: codes, decisions });