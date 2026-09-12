# Project state

## Current slice

Slice 6 — seeded delivery. The app has instant English and Spanish tier-10 seed
stories that were accepted by the deterministic validator, plus an in-app WhatsApp
sandbox preview with cover text, narration audio, and transcript. The final demo
send uses the English seed through the same clinician-approval flow.

## Decisions

- OpenRouter model: `openai/gpt-4o-mini`.
- The renderer reads `OPENROUTER_API_KEY` only from the local environment.
- Clinical facts, sensory truth, and must-convey items remain in the committed
  procedure template. Sensory detail is derived server-side from that template.
- Live generation stays available but is not a dependable demo path: a fresh
  English tier-10 sample passed one of five runs. Seed stories capture a passing
  English tier-10 output and a passing Spanish tier-10 output without weakening
  validation.
- Speech model: `mistralai/voxtral-mini-tts-2603` through OpenRouter, using its
  available English neutral voice. A live English tier-10 MP3 was generated and
  fetched from the app route with an `audio/mpeg` content type.
- The refusal surface returns `false_reassurance`, plain-language reasoning, and a
  validator-supplied truthful alternative for “tell her it won't hurt”.
- English tier 6 is deferred from the demo after a live refusal on beat-4 coverage
  and a non-simple number. It did not reach the tier-3 total-word rule.
- Rendering now makes four validated attempts. Retry prompts name each missed
  must-convey item and show its exact localized anchors.
- For the demonstration, Cloud Run is pinned to one warm instance and narration
  media remains in memory for the active session. The send begins immediately after
  approval. Production deployment would use object storage for durable public media.

## Next work

Deploy the seeded-delivery revision once with its runtime configuration, then load,
approve, synthesize, and send the English seed without another revision in between.
