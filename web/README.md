# Mark LVII Web

A browser-first companion interface for Mark LVII. It is intentionally separate from the original desktop Python application.

## Deploy on Vercel

Set the Vercel project Root Directory to `web`. Framework preset: Other. No build command or output directory is required for this static page and Node functions.

## Environment variables

Add these in Vercel → Project → Settings → Environment Variables:

- `GEMINI_API_KEY` — Google AI Studio API key used by the Gemini chat endpoint.
- `ULTRON_VOICE_SECRET` — the same secret configured as `ULTRON_VOICE_SECRET` on the existing `ultron-voice-api` Render service. Never commit this value.
- `ULTRON_VOICE_API_URL` — optional; defaults to `https://ultron-voice-api.onrender.com`.

Redeploy after adding variables.

## Current scope

- Cloud Gemini chat through a Vercel server function.
- Browser speech recognition where supported.
- Africa TTS WAV playback through the existing ULTRON Voice API.
- No PC control yet; that will be added later through an optional Windows companion.
