# Project state

## Current slice

Tier-3 live narration now renders as one connected seven-beat voice story rather
than isolated lines. The validator continues to reject content that falls outside
the clinician-authored template or its language and safety rules.

## Decisions

- OpenRouter model: `openai/gpt-4.1-mini`; tier 3 uses
  `google/gemini-2.5-flash` for its connected structured render.
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
- Tier 3 is authorised for up to 400 words and 12 words per sentence. It uses a
  single structured live render so the seven fixed beats can form one connected
  read-aloud story. The existing no-numerals and no-mechanism rules remain.
- For the demonstration, Cloud Run is pinned to one warm instance and narration
  media remains in memory for the active session. Production deployment would use
  object storage for durable public media.

## Next work

No further product changes are planned in this slice. The Twilio route remains in
place for later use, while the in-app preview is the delivery surface for the
current demonstration.
