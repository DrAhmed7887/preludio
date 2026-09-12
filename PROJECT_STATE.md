# Project state

## Current slice

Slice 6 — delivery preview. An approved story appears as an in-app WhatsApp sandbox
preview with cover text, narration audio, and transcript. Live sandbox delivery is
not configured locally.

## Decisions

- OpenRouter model: `openai/gpt-4o-mini`.
- The renderer reads `OPENROUTER_API_KEY` only from the local environment.
- Clinical facts, sensory truth, and must-convey items remain in the committed
  procedure template. Sensory detail is derived server-side from that template.
- English tier 10 completed a live validated render. English tier 3 currently
  reaches the deterministic total-word refusal and is deferred for prompt-only
  calibration. Spanish and Arabic remain covered by the validator tests and are
  also deferred from live calibration.
- Speech model: `mistralai/voxtral-mini-tts-2603` through OpenRouter, using its
  available English neutral voice. A live English tier-10 MP3 was generated and
  fetched from the app route with an `audio/mpeg` content type.
- The refusal surface returns `false_reassurance`, plain-language reasoning, and a
  validator-supplied truthful alternative for “tell her it won't hurt”.
- English tier 6 is deferred from the demo after a live refusal on beat-4 coverage
  and a non-simple number. It did not reach the tier-3 total-word rule.
- Rendering now makes four validated attempts. Retry prompts name each missed
  must-convey item and show its exact localized anchors. English tier 10 passed two
  of three live runs; the remaining refusal lacked the tier-10 real choice.
- No Twilio environment values are configured locally. The in-memory audio route
  also cannot survive a Cloud Run instance sleep, so it is not suitable as a live
  sandbox media URL without durable public media storage.

## Next work

Return to prompt-only Spanish calibration only if time remains, then deploy after
the required runtime environment values are configured on Cloud Run.
