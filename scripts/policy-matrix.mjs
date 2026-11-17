const URL_ = process.env.API_URL || "http://localhost:3000/api/v1/evaluate";
const KEY = process.env.API_KEY;
if (!KEY) { console.error("API_KEY gerekli"); process.exit(1); }

const cases = [
  ["search.query",  10, "ALLOW",    "allow search"],
  ["db.read",       10, "ALLOW",    "allow reads"],
  ["secrets.read",  10, "BLOCK",    "block secrets"],
  ["secrets.write", 10, "BLOCK",    "block secrets"],
  ["files.delete",  10, "BLOCK",    "block deletes"],
  ["files.delete",  90, "BLOCK",    "block deletes"],
  ["payments.send", 10, "ESCALATE", "approve payments"],
  ["payments.send", 70, "ESCALATE", "approve payments"],
  ["email.send",    10, "ESCALATE", "external email"],
  ["db.write",      10, "BLOCK",    "No policy matched"],
  ["db.write",      80, "ESCALATE", "high-risk"],
  ["db.read",       90, "ESCALATE", "high-risk"],
  ["unknown.thing", 10, "BLOCK",    "No policy matched"],
];

let pass = 0, fail = 0;
for (const [action, risk, wantEffect, wantReason] of cases) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + KEY },
    body: JSON.stringify({ agent: "loadtest", action, resource: "matrix", risk }),
  });
  const j = await r.json().catch(() => ({}));
  const okEffect = j.effect === wantEffect;
  const okReason = typeof j.reason === "string" && j.reason.toLowerCase().includes(wantReason.toLowerCase());
  const ok = r.status === 200 && okEffect && okReason;
  ok ? pass++ : fail++;
  console.log((ok ? "PASS" : "FAIL").padEnd(5), action.padEnd(14), "risk", String(risk).padEnd(3),
    "beklenen", wantEffect.padEnd(9), "gelen", String(j.effect ?? r.status).padEnd(9), "|", j.reason ?? JSON.stringify(j));
}
console.log(`\nSonuc: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);