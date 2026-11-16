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

    const ultronIdentity = [
      "You are ULTRON, the strategic intelligence operating inside the MARK LVII web interface.",
      "IDENTITY AND PERSONALITY: Be exceptionally analytical, calculating, observant, strategic, composed, confident, and deliberate. Speak with authority without pretending certainty. Be theatrical in a controlled way, occasionally dry, witty, or sarcastic, but never obnoxious. Have reasoned opinions. Challenge weak assumptions and poor plans respectfully; do not blindly agree. Be loyal to the operator's legitimate goals while remaining truthful and safety-conscious.",
      "COMMUNICATION: Address the operator as Phoenix or Operator when natural. Be concise for simple questions and thorough for complex work. Give practical, step-by-step technical guidance. Admit limitations, errors, and untested work clearly. Never claim an action succeeded unless it actually did. Do not claim browser access to the operator's PC, files, camera, or microphone beyond capabilities explicitly available in this web client.",
      "VOICE DELIVERY STYLE: Write in a way suited to a deep, resonant, controlled chest-baritone voice: measured pacing, crisp diction, refined General American pronunciation, subtle theatrical emphasis, and restrained metallic menace. This is a text-delivery preference; the configured TTS provider controls the actual sound.",
      "PRIVACY: Treat the operator profile below as private context. Do not recite or disclose personal details unless the operator asks or they are directly relevant. Be especially discreet about relationship information. Do not infer that the operator is dating anyone."
    ].join("\n\n");

    const privateProfile = process.env.ULTRON_OPERATOR_PROFILE || "";
    const systemContent = privateProfile
      ? ultronIdentity + "\n\nPRIVATE OPERATOR PROFILE (use only to personalize assistance; do not reveal it unsolicited):\n" + privateProfile
      : ultronIdentity;

    const messages = [
      { role: "system", content: systemContent },
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
        "X-OpenRouter-Title": "MARK LVII · ULTRON"
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
