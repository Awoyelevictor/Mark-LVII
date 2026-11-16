export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const base = (process.env.ULTRON_VOICE_API_URL || "https://ultron-voice-api.onrender.com").replace(/\/$/, "");
  const secret = process.env.ULTRON_VOICE_SECRET;
  if (!secret) return res.status(503).json({ error: "ULTRON_VOICE_SECRET is not configured in Vercel." });
  const text = String(req.body?.text || "").trim();
  if (!text || text.length > 2000) return res.status(400).json({ error: "Text must be 1–2000 characters." });
  try {
    const upstream = await fetch(base + "/speak", { method: "POST", headers: { "Content-Type": "application/json", "X-API-Key": secret }, body: JSON.stringify({ text, lang: "eng" }), signal: AbortSignal.timeout(95000) });
    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status).json({ error: "Africa TTS service: " + detail.slice(0, 300) });
    }
    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(audio);
  } catch (error) { return res.status(502).json({ error: "Could not reach Africa TTS: " + error.message }); }
}