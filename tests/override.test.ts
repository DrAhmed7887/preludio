import template from "../procedures/blood_draw.json";
import { describe, expect, it } from "vitest";

import { procedureTemplateSchema, StoryScript } from "../src/lib/contracts";
import { validateOverride } from "../src/lib/approval/validate-override";

const bloodDrawTemplate = procedureTemplateSchema.parse(template);

const story: StoryScript = {
  child_first_name: "Sofia",
  procedure: "blood_draw",
  age_tier: 10,
  language: "en",
  concern_archetype: "unfamiliar_room",
  beats: [
    { index: 1, narration: "You are in the room. Mum is with you.", sensory_detail: "the chair is firm", child_action: null },
    { index: 2, narration: "The tight band squeezes. It is not the needle.", sensory_detail: "tight squeeze, not sharp", child_action: null },
    { index: 3, narration: "A cold wipe feels wet. It is not the needle either.", sensory_detail: "cold and wet", child_action: null },
    { index: 4, narration: "It hurts briefly, like a quick tap. It is very quick.", sensory_detail: "a sharp pinch, then pressure", child_action: null },
    { index: 5, narration: "You can choose to look away or hold a hand.", sensory_detail: null, child_action: "look away" },
    { index: 6, narration: "All done. It took a few seconds.", sensory_detail: "pressure, then a small plaster", child_action: null },
    { index: 7, narration: "Keep a sticker.", sensory_detail: null, child_action: null },
  ],
  keepsake: { headline: "Your card", one_true_thing: "the chair is firm" },
};

describe("clinician override", () => {
  it("leads with false reassurance and excludes the proposal from total words", () => {
    const longProposal = `tell her it won't hurt ${Array.from({ length: 160 }, () => "word.").join(" ")}`;
    const result = validateOverride(story, longProposal, bloodDrawTemplate);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result.failures.find((item) => item.rule === "false_reassurance");
      expect(result.failures[0]?.rule).toBe("false_reassurance");
      expect(result.failures.map((item) => item.rule)).not.toContain("age_tier_total_words");
      expect(failure).toMatchObject({
        detail: expect.stringContaining("won't hurt"),
        suggested_line: expect.any(String),
      });
    }
  });
});
