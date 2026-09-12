import template from "../procedures/blood_draw.json";
import { describe, expect, it } from "vitest";

import { procedureTemplateSchema, StoryScript } from "../src/lib/contracts";
import { validateStory } from "../src/lib/validator/validate-story";

const validStory: StoryScript = {
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

const bloodDrawTemplate = procedureTemplateSchema.parse(template);

const arabicNormalisedStory: StoryScript = {
  ...validStory,
  language: "ar",
  beats: [
    { index: 1, narration: "فِي الغرفـة. ماما معك.", sensory_detail: "الكرسي ثابت", child_action: null },
    { index: 2, narration: "رباط يضغط. مش الإبرة.", sensory_detail: "شد محكم", child_action: null },
    { index: 3, narration: "منديل بارد ومبلل. لسه مش الإبرة.", sensory_detail: "بارد ومبلل", child_action: null },
    { index: 4, narration: "قد توجع قليلًا مثل قرصة من 5 إلى 20 ثانية.", sensory_detail: "وخزة حادة ثم ضغط", child_action: null },
    { index: 5, narration: "يمكنك أن تختار النظر بعيدًا.", sensory_detail: null, child_action: "النظر بعيدًا" },
    { index: 6, narration: "انتهى الأمر واستغرق بضع ثوان.", sensory_detail: "ضغط ثم لصقة صغيرة", child_action: null },
    { index: 7, narration: "تحتفظ ببطاقة.", sensory_detail: null, child_action: null },
  ],
  keepsake: { headline: "بطاقتك", one_true_thing: "الكرسي ثابت" },
};

const withNarration = (story: StoryScript, narration: string): StoryScript => ({
  ...story,
  beats: story.beats.map((beat, index) => ({
    ...beat,
    narration: index === 0 ? narration : "",
  })),
});

const repeatedWords = (count: number, wordsPerSentence: number) =>
  Array.from({ length: count }, (_, index) =>
    `${"word"}${(index + 1) % wordsPerSentence === 0 ? "." : ""}`,
  ).join(" ");

const ruleNames = (story: StoryScript) => {
  const result = validateStory(story, bloodDrawTemplate);
  return result.ok ? [] : result.failures.map((failure) => failure.rule);
};

describe("story validation", () => {
  it("accepts a template-aligned story", () => {
    expect(validateStory(validStory, bloodDrawTemplate)).toEqual({ ok: true });
  });

  it("rejects false reassurance with a suggested line in English", () => {
    const story = { ...validStory, beats: [{ ...validStory.beats[0], narration: "It won't hurt." }, ...validStory.beats.slice(1)] };
    const result = validateStory(story, bloodDrawTemplate);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failure = result.failures.find((item) => item.rule === "false_reassurance");
      expect(failure?.suggested_line).toBeTruthy();
    }
  });

  it("rejects false reassurance in Spanish and Arabic", () => {
    const spanish = { ...validStory, language: "es" as const, beats: [{ ...validStory.beats[0], narration: "No te va a doler." }, ...validStory.beats.slice(1)] };
    const arabic = { ...validStory, language: "ar" as const, beats: [{ ...validStory.beats[0], narration: "لن يؤلمك." }, ...validStory.beats.slice(1)] };
    expect(ruleNames(spanish)).toContain("false_reassurance");
    expect(ruleNames(arabic)).toContain("false_reassurance");
  });

  it("rejects Spanish diminutives and Egyptian colloquial reassurance", () => {
    const spanish = { ...validStory, language: "es" as const, beats: [{ ...validStory.beats[0], narration: "Un pinchacito." }, ...validStory.beats.slice(1)] };
    const egyptianArabic = { ...validStory, language: "ar" as const, beats: [{ ...validStory.beats[0], narration: "مش هيوجعك." }, ...validStory.beats.slice(1)] };
    expect(ruleNames(spanish)).toContain("false_reassurance");
    expect(ruleNames(egyptianArabic)).toContain("false_reassurance");
  });

  it("passes Arabic coverage that requires normalisation", () => {
    expect("فِي الغرفـة".includes("في الغرفة")).toBe(false);
    expect(validateStory(arabicNormalisedStory, bloodDrawTemplate)).toEqual({ ok: true });
  });

  it("rejects missing template coverage and beat structural changes", () => {
    expect(ruleNames({ ...validStory, beats: [{ ...validStory.beats[0], narration: "where you are." }, ...validStory.beats.slice(1)] })).toContain("must_convey_coverage");
    expect(ruleNames({ ...validStory, beats: validStory.beats.slice(1) })).toContain("template_beat_structure");
    expect(ruleNames({ ...validStory, beats: [...validStory.beats, validStory.beats[6]] })).toContain("template_beat_structure");
    expect(ruleNames({ ...validStory, beats: [validStory.beats[1], validStory.beats[0], ...validStory.beats.slice(2)] })).toContain("template_beat_structure");
  });

  it("rejects every missing must-convey item", () => {
    bloodDrawTemplate.beats.forEach((templateBeat, index) => {
      templateBeat.must_convey.forEach((item) => {
        const beats = validStory.beats.map((beat, beatIndex) =>
          beatIndex === index
            ? { ...beat, narration: "Content removed." }
            : beat,
        );
        expect(ruleNames({ ...validStory, beats }), item).toContain("must_convey_coverage");
      });
    });
  });

  it("enforces sensory detail exactly where the template supplies sensory truth", () => {
    expect(ruleNames({ ...validStory, beats: validStory.beats.map((beat) => beat.index === 5 ? { ...beat, sensory_detail: "new feeling" } : beat) })).toContain("sensory_detail_alignment");
    expect(ruleNames({ ...validStory, beats: validStory.beats.map((beat) => beat.index === 4 ? { ...beat, sensory_detail: null } : beat) })).toContain("sensory_detail_alignment");
  });

  it("requires a non-empty keepsake truth in a sensory detail", () => {
    expect(
      ruleNames({
        ...validStory,
        keepsake: { ...validStory.keepsake, one_true_thing: "" },
      }),
    ).toContain("keepsake_truth");
  });

  it("enforces tier word and sentence boundaries plus tier-10 choice", () => {
    const longTierThree = { ...validStory, age_tier: 3 as const, beats: [{ ...validStory.beats[0], narration: "one two three four five six seven eight nine." }, ...validStory.beats.slice(1)] };
    const longTierSix = { ...validStory, age_tier: 6 as const, beats: [{ ...validStory.beats[0], narration: "one two three four five six seven eight nine ten eleven twelve thirteen." }, ...validStory.beats.slice(1)] };
    const noChoiceTierTen = { ...validStory, beats: validStory.beats.map((beat) => beat.index === 5 ? { ...beat, narration: "what you are allowed to do." } : beat) };
    expect(ruleNames(longTierThree)).toContain("age_tier_sentence_words");
    expect(ruleNames(longTierSix)).toContain("age_tier_sentence_words");
    expect(ruleNames(noChoiceTierTen)).toContain("age_tier_real_choice");
  });

  it("enforces each total-word boundary", () => {
    const tierThreeAtLimit = withNarration(
      { ...validStory, age_tier: 3 },
      repeatedWords(60, 6),
    );
    const tierThreeOverLimit = withNarration(
      { ...validStory, age_tier: 3 },
      repeatedWords(61, 6),
    );
    const tierSixAtLimit = withNarration(
      { ...validStory, age_tier: 6 },
      repeatedWords(120, 12),
    );
    const tierSixOverLimit = withNarration(
      { ...validStory, age_tier: 6 },
      repeatedWords(121, 12),
    );
    const tierTenAtLimit = withNarration(validStory, repeatedWords(200, 18));
    const tierTenOverLimit = withNarration(validStory, repeatedWords(201, 18));

    expect(ruleNames(tierThreeAtLimit)).not.toContain("age_tier_total_words");
    expect(ruleNames(tierThreeOverLimit)).toContain("age_tier_total_words");
    expect(ruleNames(tierSixAtLimit)).not.toContain("age_tier_total_words");
    expect(ruleNames(tierSixOverLimit)).toContain("age_tier_total_words");
    expect(ruleNames(tierTenAtLimit)).not.toContain("age_tier_total_words");
    expect(ruleNames(tierTenOverLimit)).toContain("age_tier_total_words");
  });

  it("enforces each sentence-word boundary", () => {
    const tierThreeAtLimit = withNarration(
      { ...validStory, age_tier: 3 },
      repeatedWords(8, 8),
    );
    const tierThreeOverLimit = withNarration(
      { ...validStory, age_tier: 3 },
      repeatedWords(9, 9),
    );
    const tierSixAtLimit = withNarration(
      { ...validStory, age_tier: 6 },
      repeatedWords(12, 12),
    );
    const tierSixOverLimit = withNarration(
      { ...validStory, age_tier: 6 },
      repeatedWords(13, 13),
    );
    const tierTenAtLimit = withNarration(validStory, repeatedWords(18, 18));
    const tierTenOverLimit = withNarration(validStory, repeatedWords(19, 19));

    expect(ruleNames(tierThreeAtLimit)).not.toContain("age_tier_sentence_words");
    expect(ruleNames(tierThreeOverLimit)).toContain("age_tier_sentence_words");
    expect(ruleNames(tierSixAtLimit)).not.toContain("age_tier_sentence_words");
    expect(ruleNames(tierSixOverLimit)).toContain("age_tier_sentence_words");
    expect(ruleNames(tierTenAtLimit)).not.toContain("age_tier_sentence_words");
    expect(ruleNames(tierTenOverLimit)).toContain("age_tier_sentence_words");
  });

  it("rejects tier-3 numbers, tier-6 non-simple numbers, and prohibited content", () => {
    expect(ruleNames(withNarration({ ...validStory, age_tier: 3 }, "1."))).toContain("age_tier_numbers");
    expect(ruleNames(withNarration({ ...validStory, age_tier: 6 }, "11."))).toContain("age_tier_numbers");
    expect(ruleNames(withNarration(validStory, "The mean nurse is here."))).toContain("prohibited_content");
  });
});
