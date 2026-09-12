import template from "../procedures/blood_draw.json";
import { describe, expect, it, vi } from "vitest";

import {
  Intake,
  RenderedStory,
  procedureTemplateSchema,
} from "../src/lib/contracts";
import {
  MAX_RENDER_ATTEMPTS,
  renderStory,
} from "../src/lib/render/render-story";

const bloodDrawTemplate = procedureTemplateSchema.parse(template);
const intake: Intake = {
  child_first_name: "Sofia",
  procedure: "blood_draw",
  age_tier: 10,
  language: "en",
  concern_archetype: "unfamiliar_room",
};

const validCandidate: RenderedStory = {
  beats: [
    { index: 1, narration: "Sofia, you are in the room. Mum is with you.", child_action: null },
    { index: 2, narration: "The tight band squeezes. It is not the needle.", child_action: null },
    { index: 3, narration: "A cold wipe feels wet. It is not the needle either.", child_action: null },
    { index: 4, narration: "It hurts briefly, like a quick tap. It is very quick.", child_action: null },
    { index: 5, narration: "You can choose to look away or hold a hand.", child_action: "look away" },
    { index: 6, narration: "All done. It took a few seconds.", child_action: null },
    { index: 7, narration: "Keep a sticker.", child_action: null },
  ],
  keepsake: { headline: "Your card", one_true_thing: "the chair is firm" },
};

describe("structured rendering", () => {
  it("accepts a validated candidate", async () => {
    const result = await renderStory(intake, bloodDrawTemplate, async () => validCandidate);
    expect(result).toMatchObject({ ok: true, story: { child_first_name: "Sofia" } });
  });

  it("stops after exactly two invalid candidates and returns structured failures", async () => {
    const invalidCandidate = {
      ...validCandidate,
      beats: validCandidate.beats.map((beat) =>
        beat.index === 4 ? { ...beat, narration: "It won't hurt." } : beat,
      ),
    };
    const generator = vi.fn().mockResolvedValue(invalidCandidate);
    const result = await renderStory(intake, bloodDrawTemplate, generator);

    expect(generator).toHaveBeenCalledTimes(MAX_RENDER_ATTEMPTS);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result.failures.find((item) => item.rule === "false_reassurance");
      expect(failure).toMatchObject({ beat: 4, suggested_line: expect.any(String) });
    }
  });
});
