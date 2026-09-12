# Project state

## Current slice

Slice 4 — narration audio. A validated story is checked again before it reaches the
OpenRouter speech endpoint. The resulting MP3 is held in memory and served from a
same-origin route to the browser listening surface.

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

## Next work

Slice 5 adds the clinician approval gate and the visible refusal response. Audio
and delivery remain downstream of that gate.
