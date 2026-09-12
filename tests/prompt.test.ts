import template from "../procedures/blood_draw.json";
import { describe, expect, it } from "vitest";

import { Intake, procedureTemplateSchema } from "../src/lib/contracts";
import { buildBeatPrompt, getBeatWordBudget } from "../src/lib/render/prompt";

const bloodDrawTemplate = procedureTemplateSchema.parse(template);

const intake: Intake = {
  child_first_name: "Maya",
  procedure: "blood_draw",
  age_tier: 10,
  language: "en",
  concern_archetype: "unfamiliar_room",
};

describe("English narration prompt", () => {
  it("gives tier 3 room for a complete story without exceeding its total limit", () => {
    const budgets = Array.from({ length: 7 }, (_, index) => getBeatWordBudget(3, index));

    expect(budgets).toEqual([55, 55, 60, 70, 50, 55, 45]);
    expect(budgets.reduce((total, budget) => total + budget, 0)).toBeLessThanOrEqual(400);
  });

  it("asks for a named, spoken story voice and concern-aware emphasis", () => {
    const prompt = buildBeatPrompt(intake, bloodDrawTemplate, 0);

    expect(prompt).toContain("Maya");
    expect(prompt).toContain("warm, spoken English");
    expect(prompt).toContain("short voice story");
    expect(prompt).toContain("Selected concern: unfamiliar_room");
    expect(prompt).toContain("Weave one complete option");
  });

  it("includes the validator's concrete retry line for story-wide requirements", () => {
    const prompt = buildBeatPrompt(intake, bloodDrawTemplate, 4, [{
      rule: "age_tier_real_choice",
      beat: null,
      detail: "Tier 10 narration must offer one real choice.",
      suggested_line: "You can choose to look away or hold a hand.",
    }]);

    expect(prompt).toContain("Required correction: You can choose to look away or hold a hand.");
  });
});
