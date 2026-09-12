# Project state

## Current slice

Slice 3 — structured render. The server route accepts the intake contract, renders
the seven fixed beats through OpenRouter, deterministically validates the assembled
StoryScript, retries at most twice, and returns named structured failures when no
candidate passes.

## Decisions

- OpenRouter model: `openai/gpt-4o-mini`.
- The renderer reads `OPENROUTER_API_KEY` only from the local environment.
- Clinical facts, sensory truth, and must-convey items remain in the committed
  procedure template. Sensory detail is derived server-side from that template.
- English tier 10 completed a live validated render. English tier 3 currently
  reaches the deterministic total-word refusal and is deferred for prompt-only
  calibration. Spanish and Arabic remain covered by the validator tests and are
  also deferred from live calibration.

## Next work

Slice 4 adds generated narration audio and the browser listening surface. It must
remain downstream of the validator.
