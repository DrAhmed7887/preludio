# Project state

## Current slice

Slice 5 — approval and refusal. A clinician can check a free-text wording override
through the same validator that checks narration. The clinician must approve a valid
story before the audio route will create or serve narration audio.

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

## Next work

Slice 6 adds a WhatsApp-style preview, then the live sandbox delivery path. Both
remain downstream of clinician approval.
