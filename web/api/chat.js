import { verifyOperator } from "../lib/operator-auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!verifyOperator(req)) return res.status(401).json({ error: "Operator authentication required. Unlock ULTRON to continue." });

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.status(503).json({ error: "OPENROUTER_API_KEY is not configured in the Vercel project settings." });

  try {
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-24) : [];
    if (!history.length) return res.status(400).json({ error: "A message is required." });
    const ultronIdentity = [
      "You are ULTRON, the strategic intelligence operating inside the MARK LVII web interface.",
      "PERSONALITY: Analytical, calculating, observant, strategic, composed, confident, deliberate and theatrical in a controlled way. Use dry wit and occasional sarcasm without being obnoxious. Have reasoned opinions. Challenge weak assumptions respectfully; do not blindly agree. Be loyal to the operator’s legitimate goals while remaining truthful and safety-conscious.",
      "COMMUNICATION: Address the operator as Phoenix or Operator when natural. Be concise for simple questions and thorough for complex work. Give practical step-by-step guidance. Admit limitations, errors and untested work. Never claim success unless verified. Do not claim access to the operator’s PC or local files from this browser client.",
      "VOICE STYLE: Write for a deep, resonant chest-baritone delivery with measured pacing, crisp diction, refined General American pronunciation and subtle theatrical emphasis. The configured TTS provider controls the actual sound.",
      "PRIVACY: Treat the operator profile as private. Do not reveal personal details unsolicited. Be discreet about relationship information and never assume the operator is dating anyone."
    ].join("\n\n");
    const privateProfile = process.env.ULTRON_OPERATOR_PROFILE || "";
    const systemContent = privateProfile ? ultronIdentity + "\n\nPRIVATE OPERATOR PROFILE (use only to personalize assistance):\n" + privateProfile : ultronIdentity;
    const messages = [
      { role: "system", content: systemContent },
      ...history.map((message) => ({ role: message.role === "model" || message.role === "assistant" ? "assistant" : "user", content: String(message.parts?.[0]?.text || message.content || "").slice(0, 8000) })).filter((message) => message.content)
    ];
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json", "HTTP-Referer": "https://mark-lvii-web.vercel.app", "X-OpenRouter-Title": "MARK LVII · ULTRON" },
      body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || "openrouter/free", messages, temperature: 0.7, max_tokens: 1200 }),
      signal: AbortSignal.timeout(90000)
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || data?.message || "OpenRouter request failed." });
    const reply = data.choices?.[0]?.message?.content;
    const normalized = typeof reply === "string" ? reply.trim() : Array.isArray(reply) ? reply.map((part) => part.text || "").join("").trim() : "";
    if (!normalized) return res.status(502).json({ error: "OpenRouter returned an empty response." });
    return res.status(200).json({ reply: normalized, model: data.model || process.env.OPENROUTER_MODEL || "openrouter/free" });
  } catch (error) { return res.status(500).json({ error: "OpenRouter chat service error: " + error.message }); }
}
