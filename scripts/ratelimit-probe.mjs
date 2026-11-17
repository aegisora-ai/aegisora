const URL_ = process.env.API_URL;
const KEY = process.env.API_KEY;
if (!URL_ || !KEY) { console.error("API_URL ve API_KEY gerekli"); process.exit(1); }
const BODY = JSON.stringify({ agent: "ratelimit-probe", action: "search.query", resource: "docs", risk: 10 });
const MAX = Number(process.env.MAX || 400);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function hit() {
  const r = await fetch(URL_, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + KEY }, body: BODY });
  const text = await r.text();
  const headers = Object.fromEntries([...r.headers].filter(([k]) => /retry|ratelimit/i.test(k)));
  return { status: r.status, headers, text };
}

let sent = 0, ok = 0, first429 = null;
const t0 = Date.now();
while (sent < MAX && !first429) {
  const batch = await Promise.all(Array.from({ length: 10 }, hit));
  sent += batch.length;
  for (const r of batch) {
    if (r.status === 200) ok++;
    else if (r.status === 429 && !first429) first429 = { headers: r.headers, body: r.text.slice(0, 300) };
    else if (r.status !== 429) { console.log("beklenmeyen:", r.status, r.text.slice(0, 200)); process.exit(1); }
  }
}
console.log({ gonderilen: sent, basarili200: ok, saniye: ((Date.now() - t0) / 1000).toFixed(1), ilk429: first429 ?? "yok" });

if (first429) {
  const t1 = Date.now();
  while (Date.now() - t1 < 180000) {
    await sleep(5000);
    const r = await hit();
    if (r.status === 200) { console.log("limit acildi, bekleme (sn):", ((Date.now() - t1) / 1000).toFixed(0)); process.exit(0); }
  }
  console.log("180 sn icinde acilmadi");
}