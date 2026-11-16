export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: "OPENROUTER_API_KEY is not configured in the Vercel project settings."
    });
  }

  try {
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-24) : [];
    if (!history.length) return res.status(400).json({ error: "A message is required." });

    const messages = [
      {
        role: "system",
        content: "You are MARK LVII, a capable, composed, proactive personal AI assistant. Speak clearly and naturally. Be helpful, precise, and honest about capabilities. You are currently running in a browser; do not claim to control the user's computer or access local files. Your Windows companion will be integrated later."
      },
      ...history.map((message) => ({
        role: message.role === "model" || message.role === "assistant" ? "assistant" : "user",
        content: String(message.parts?.[0]?.text || message.content || "").slice(0, 8000)
      })).filter((message) => message.content)
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://mark-lvii-web.vercel.app",
        "X-OpenRouter-Title": "MARK LVII"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        messages,
        temperature: 0.7,
        max_tokens: 1200
      }),
      signal: AbortSignal.timeout(90000)
    });

    const data = await response.json();
    if (!response.ok) {
      const detail = data?.error?.message || data?.message || "OpenRouter request failed.";
      return res.status(response.status).json({ error: detail });
    }

    const reply = data.choices?.[0]?.message?.content;
    const normalized = typeof reply === "string"
      ? reply.trim()
      : Array.isArray(reply)
        ? reply.map((part) => part.text || "").join("").trim()
        : "";

    if (!normalized) return res.status(502).json({ error: "OpenRouter returned an empty response." });
    return res.status(200).json({ reply: normalized, model: data.model || process.env.OPENROUTER_MODEL || "openrouter/free" });
  } catch (error) {
    return res.status(500).json({ error: "OpenRouter chat service error: " + error.message });
  }
}