export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "GEMINI_API_KEY is not configured in the Vercel project settings." });
  try {
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-24) : [];
    if (!history.length) return res.status(400).json({ error: "A message is required." });
    const contents = history.map(m => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: String(m.parts?.[0]?.text || "").slice(0, 8000) }] }));
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(key), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: "You are MARK LVII, a capable, composed, proactive personal AI assistant. Speak clearly and naturally. Be helpful, precise, and honest about capabilities. You are currently running in a browser; do not claim to control the user's computer or access local files. Your Windows companion will be integrated later." }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1200 } })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "Gemini request failed." });
    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!reply) return res.status(502).json({ error: "The AI returned an empty response." });
    return res.status(200).json({ reply });
  } catch (error) { return res.status(500).json({ error: "Chat service error: " + error.message }); }
}