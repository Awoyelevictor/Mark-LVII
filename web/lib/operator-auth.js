import crypto from "node:crypto";

export function createOperatorToken(secret) {
  const payload = Buffer.from(JSON.stringify({ sub: "phoenix-operator", exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + signature;
}

export function verifyOperator(req) {
  const secret = process.env.ULTRON_OPERATOR_ACCESS_KEY;
  if (!secret) return false;
  const header = String(req.headers?.authorization || "");
  if (!header.startsWith("Bearer ")) return false;
  const parts = header.slice(7).split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return decoded.sub === "phoenix-operator" && Number(decoded.exp) > Date.now(); } catch { return false; }
}
