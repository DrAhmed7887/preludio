import template from "../procedures/blood_draw.json";
import { describe, expect, it } from "vitest";

import { intakeSchema, procedureTemplateSchema } from "../src/lib/contracts";

describe("blood draw template", () => {
  it("matches the clinician-authored source exactly", () => {
    expect(procedureTemplateSchema.parse(template)).toEqual({
      procedure_id: "blood_draw",
      beats: [
        {
          id: 1,
          clinical_fact:
            "The child sits in a chair. A nurse and one parent are present.",
          sensory_truth: "the chair is firm; the room is bright",
          must_convey: ["where you are", "who is with you"],
        },
        {
          id: 2,
          clinical_fact: "A tourniquet is applied to the upper arm.",
          sensory_truth: "tight squeeze, not sharp, lasts about a minute",
          must_convey: ["it squeezes", "it is not the needle"],
        },
        {
          id: 3,
          clinical_fact: "The skin is cleaned with an alcohol wipe.",
          sensory_truth: "cold and wet, smells sharp, dries quickly",
          must_convey: ["cold", "wet", "this is not the needle either"],
        },
        {
          id: 4,
          clinical_fact: "A needle enters the vein and blood is collected.",
          sensory_truth: "a sharp pinch, then pressure; roughly 5-20 seconds",
          must_convey: ["it will hurt briefly", "honest comparator", "how long"],
        },
        {
          id: 5,
          clinical_fact:
            "The child may look away, breathe out, or hold a hand.",
          sensory_truth: null,
          must_convey: ["what you are allowed to do"],
        },
        {
          id: 6,
          clinical_fact:
            "The needle is removed; pressure and a dressing are applied.",
          sensory_truth: "pressure, then a small plaster",
          must_convey: ["it is over", "how long it took"],
        },
        {
          id: 7,
          clinical_fact: "The child keeps a card or sticker.",
          sensory_truth: null,
          must_convey: ["what you keep"],
        },
      ],
    });
  });
});

describe("intake contract", () => {
  const validIntake = {
    child_first_name: "Sofia",
    procedure: "blood_draw",
    age_tier: 3,
    language: "es",
    concern_archetype: "unfamiliar_room",
  } as const;

  it("accepts the five required intake values", () => {
    expect(intakeSchema.safeParse(validIntake).success).toBe(true);
  });

  it("rejects identifiers and multi-word names", () => {
    expect(
      intakeSchema.safeParse({ ...validIntake, child_first_name: "Sofia Khan" })
        .success,
    ).toBe(false);
    expect(
      intakeSchema.safeParse({ ...validIntake, child_first_name: "48291" }).success,
    ).toBe(false);
  });
});
