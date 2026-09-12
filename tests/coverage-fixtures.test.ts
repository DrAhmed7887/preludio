import template from "../procedures/blood_draw.json";
import { describe, expect, it } from "vitest";

import { procedureTemplateSchema, StoryScript } from "../src/lib/contracts";
import {
  validateCoverage,
  validateStory,
} from "../src/lib/validator/validate-story";

const bloodDrawTemplate = procedureTemplateSchema.parse(template);

const story = (
  age_tier: 3 | 6 | 10,
  language: "en" | "es" | "ar",
  narrations: string[],
): StoryScript => ({
  child_first_name: "Sofia",
  procedure: "blood_draw",
  age_tier,
  language,
  concern_archetype: "unfamiliar_room",
  beats: narrations.map((narration, index) => ({
    index: index + 1,
    narration,
    sensory_detail: ["the chair is firm", "a tight band", "a cold wet wipe", "a sharp pinch", null, "pressure then a plaster", null][index],
    child_action: index === 4 ? "look away" : null,
  })),
  keepsake: { headline: "Your card", one_true_thing: "the chair is firm" },
});

const fixtures = [
  {
    name: "tier 3 English",
    story: story(3, "en", [
      "You are in the room. Mum is with you.",
      "The tight band squeezes. It is not the needle.",
      "A cold wipe feels wet. It is not the needle either.",
      "It hurts briefly, like a quick tap. It is very quick.",
      "Look away or hold a hand.",
      "The needle is out. It took a few seconds.",
      "Keep a sticker.",
    ]),
  },
  {
    name: "tier 6 English",
    story: story(6, "en", [
      "You are at the clinic. A nurse is here with your dad.",
      "The tight band gives a tight squeeze; it is not the needle.",
      "The cold wipe feels wet, and the wipe is not the needle either.",
      "It can hurt for a moment, like counting to five, and it was very quick.",
      "You can breathe out or hold a hand.",
      "The needle is out; it took a few seconds.",
      "You can keep a card.",
    ]),
  },
  {
    name: "tier 10 English",
    story: story(10, "en", [
      "You are in the chair at the clinic. A grown-up is with you.",
      "The tight band squeezes your arm. The needle is not here yet.",
      "The cold wipe feels wet. The wipe is not the needle either.",
      "It can hurt for a moment, like a mosquito bite, for 5 to 20 seconds.",
      "You can choose to look away, breathe out, or hold a hand.",
      "All done. It was very quick.",
      "There is a card for you.",
    ]),
  },
  {
    name: "tier 3 Spanish",
    story: story(3, "es", [
      "Estás en la sala. Mamá está contigo.",
      "La banda aprieta. No es la aguja.",
      "La toallita fría se siente mojada. Tampoco es la aguja.",
      "Puede doler un momento, como un toque rápido. Son unos segundos.",
      "Puedes mirar a otro lado o tomar una mano.",
      "La aguja salió. Tomó unos segundos.",
      "Puedes quedarte con una pegatina.",
    ]),
  },
  {
    name: "tier 6 Spanish",
    story: story(6, "es", [
      "Estás en la clínica. Una enfermera está aquí y papá está contigo.",
      "La banda aprieta el brazo. La aguja aún no está.",
      "La toallita fría se siente mojada. La toallita tampoco es la aguja.",
      "Duele un momento, como un pellizco, y duró unos segundos.",
      "Puedes respirar o tomar una mano.",
      "Ya terminó. Duró unos segundos.",
      "Puedes quedarte con una tarjeta.",
    ]),
  },
  {
    name: "tier 10 Spanish",
    story: story(10, "es", [
      "Estás en la silla de la clínica. Un adulto está contigo.",
      "La banda aprieta el brazo. La aguja aún no está.",
      "La toallita fría se siente mojada. Tampoco es la aguja.",
      "Puede doler un momento, como una picadura de mosquito, por 5 a 20 segundos.",
      "Puedes elegir mirar a otro lado, respirar o tomar una mano.",
      "Se acabó. Duró unos segundos.",
      "Hay una tarjeta para ti.",
    ]),
  },
  {
    name: "tier 3 Arabic",
    story: story(3, "ar", [
      "أنت في الغرفة. ماما معك.",
      "رباط يضغط. مش الإبرة.",
      "منديل بارد ومبلل. لسه مش الإبرة.",
      "توجع لحظة، مثل لمسة سريعة. بضع ثوان.",
      "يمكنك النظر بعيدًا أو مسك يد.",
      "الإبرة خرجت. أخذ بضع ثوان.",
      "تحتفظ بملصق.",
    ]),
  },
  {
    name: "tier 6 Arabic",
    story: story(6, "ar", [
      "أنت في العيادة. ممرضة هنا وبابا معك.",
      "رباط يضغط على ذراعك. الإبرة ليست هنا بعد.",
      "تشعر بالبرودة والبلل. المنديل ليس الإبرة أيضًا.",
      "قد توجع قليلًا، مثل قرصة، واستغرق بضع ثوان.",
      "يمكنك التنفس أو مسك يد.",
      "انتهى الأمر. أخذ بضع ثوان.",
      "تحتفظ ببطاقة.",
    ]),
  },
  {
    name: "tier 10 Arabic",
    story: story(10, "ar", [
      "أنت على الكرسي في العيادة. شخص كبير معك.",
      "رباط يضغط على ذراعك. الإبرة ليست هنا بعد.",
      "تشعر بالبرودة والبلل. المنديل ليس الإبرة أيضًا.",
      "قد توجع قليلًا، مثل قرصة ناموسة، من 5 إلى 20 ثانية.",
      "يمكنك أن تختار النظر بعيدًا أو التنفس.",
      "خلص. استغرق بضع ثوان.",
      "بطاقة لك.",
    ]),
  },
];

describe("localized coverage anchors", () => {
  it.each(fixtures)("covers every item for $name", ({ story: fixture }) => {
    expect(validateCoverage(fixture, bloodDrawTemplate)).toEqual([]);
  });

  it("accepts pinch comparisons but rejects false-reassurance shorthand", () => {
    const pinchStory = fixtures[1].story;
    const scratchStory = {
      ...fixtures[0].story,
      beats: fixtures[0].story.beats.map((beat) =>
        beat.index === 4
          ? { ...beat, narration: "It hurts briefly, just a little scratch. It is very quick." }
          : beat,
      ),
    };
    const spanishShorthandStory = {
      ...fixtures[3].story,
      beats: fixtures[3].story.beats.map((beat) =>
        beat.index === 4
          ? { ...beat, narration: "Puede doler un momento, solo un pequeño pinchazo. Son unos segundos." }
          : beat,
      ),
    };

    expect(validateCoverage(pinchStory, bloodDrawTemplate)).toEqual([]);
    expect(validateStory(scratchStory, bloodDrawTemplate)).toMatchObject({ ok: false });
    expect(validateStory(spanishShorthandStory, bloodDrawTemplate)).toMatchObject({ ok: false });
  });
});
