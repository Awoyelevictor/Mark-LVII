import crypto from "node:crypto";
import { createOperatorToken } from "../lib/operator-auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const secret = process.env.ULTRON_OPERATOR_ACCESS_KEY;
  if (!secret) return res.status(503).json({ error: "Operator access is not configured." });
  const a = Buffer.from(String(req.body?.key || "")), b = Buffer.from(secret);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: "Access denied. Check the operator key." });
  return res.status(200).json({ token: createOperatorToken(secret), expiresIn: 2592000 });
}
