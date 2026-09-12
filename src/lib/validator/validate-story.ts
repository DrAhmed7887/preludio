import {
  ProcedureTemplate,
  StoryScript,
  languageSchema,
} from "../contracts";

type Language = (typeof languageSchema.options)[number];

export type ValidationFailure = {
  rule: string;
  beat: number | null;
  detail: string;
  suggested_line?: string;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; failures: ValidationFailure[] };

export type ValidationOptions = {
  totalWordNarration?: string;
};

export const falseReassurancePhrases: Record<Language, readonly string[]> = {
  en: ["won't hurt", "will not hurt", "no pain", "painless", "you won't feel", "it's nothing", "don't be scared", "nothing to be afraid of", "big kids don't cry", "over before you know it", "i promise", "just a little scratch"],
  es: ["no te va a doler", "no dolerá", "sin dolor", "indoloro", "no lo sentirás", "no es nada", "no tengas miedo", "no hay nada que temer", "los niños grandes no lloran", "terminará antes de que te des cuenta", "te lo prometo", "solo un pequeño pinchazo", "no duele", "no va a doler", "no te dolerá", "solo es un pinchazo", "un pinchacito", "solo un poquito", "ya casi", "no pasa nada"],
  ar: ["لن يؤلمك", "لن يؤلم", "لا ألم", "غير مؤلم", "لن تشعر", "هذا لا شيء", "لا تخف", "لا يوجد ما تخاف منه", "الأطفال الكبار لا يبكون", "سينتهي قبل أن تدرك", "أعدك", "مجرد وخزة صغيرة", "مش هيوجع", "مش هيوجعك", "مش هتحس", "ما تخافش", "مش حاجة", "خلاص هيخلص"],
};

const alternatives: Record<Language, string> = {
  en: "You may feel some new sensations; your care team will be there with you.",
  es: "Puede que notes sensaciones nuevas; tu equipo de atención estará contigo.",
  ar: "قد تشعر بأحاسيس جديدة؛ سيكون فريق رعايتك معك.",
};

const tierLimits = {
  3: { totalWords: 60, sentenceWords: 8 },
  6: { totalWords: 120, sentenceWords: 12 },
  10: { totalWords: 200, sentenceWords: 18 },
} as const;

const mechanismTerms = ["vein", "blood", "tourniquet", "vena", "sangre", "torniquete", "وريد", "دم", "رباط"];
const prohibitedContent = [
  /\b(?:dose|milligrams?|mg)\b/i,
  /\b(?:bad|mean) (?:nurse|doctor|clinician)\b/i,
  /\b(?:held down|strapped down|restrained)\b/i,
  /\b(?:magic|pretend|imaginary)\b/i,
  /\b(?:will cure|will fix|will make you better)\b/i,
];

const words = (text: string) => text.trim().split(/\s+/u).filter(Boolean);
const sentences = (text: string) => text.split(/[.!?؟]+/u).filter((sentence) => sentence.trim());

export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/ـ/gu, "")
    .replace(/[أإآ]/gu, "ا")
    .replace(/ة/gu, "ه")
    .replace(/ى/gu, "ي");
}

const normaliseForMatching = (language: Language, text: string) =>
  language === "ar" ? normalizeArabic(text) : text.toLocaleLowerCase();
const matches = (language: Language, text: string, phrase: string) =>
  normaliseForMatching(language, text).includes(normaliseForMatching(language, phrase));

const choicePatterns: Record<Language, RegExp> = {
  en: /\b(?:you can choose|you may choose|choose whether|you can look away|you can turn away|you can hold a hand|you can squeeze a hand|you can breathe out|you can take a breath)\b/i,
  es: /(?:puedes elegir|puede elegir|elige si)/i,
  ar: /(?:يمكنك أن تختار|يمكنك اختيار)/u,
};

function structureFailures(story: StoryScript, template: ProcedureTemplate): ValidationFailure[] {
  const matches = story.beats.length === template.beats.length && story.beats.every(
    (beat, index) => beat.index === template.beats[index]?.id,
  );

  return matches
    ? []
    : [{ rule: "template_beat_structure", beat: null, detail: "Story beats must match the template count and order.", suggested_line: "Restore the template's seven beats in order." }];
}

export function validateCoverage(story: StoryScript, template: ProcedureTemplate): ValidationFailure[] {
  return template.beats.flatMap((templateBeat, index) => {
    const narration = story.beats[index]?.narration ?? "";
    return templateBeat.must_convey
      .filter((item) => !template.coverage_anchors.items[item]?.[story.language]
        .some((anchor) => matches(story.language, narration, anchor)))
      .map((item) => ({
        rule: "must_convey_coverage",
        beat: templateBeat.id,
        detail: `Narration does not cover required content: ${item}.`,
        suggested_line: `Include “${item}” in this beat's narration.`,
      }));
  });
}

function sensoryFailures(story: StoryScript, template: ProcedureTemplate): ValidationFailure[] {
  return template.beats.flatMap((templateBeat, index) => {
    const detail = story.beats[index]?.sensory_detail;
    const needsDetail = templateBeat.sensory_truth !== null;
    const matches = needsDetail ? Boolean(detail?.trim()) : detail === null;

    return matches
      ? []
      : [{
          rule: "sensory_detail_alignment",
          beat: templateBeat.id,
          detail: needsDetail
            ? "This template beat requires a truthful sensory detail."
            : "This template beat does not permit a sensory detail.",
          suggested_line: needsDetail
            ? templateBeat.sensory_truth ?? undefined
            : "Set sensory_detail to null for this beat.",
        }];
  });
}

function reassuranceFailures(story: StoryScript): ValidationFailure[] {
  const phrases = falseReassurancePhrases[story.language];

  return story.beats.flatMap((beat) => {
    const match = phrases.find((phrase) => matches(story.language, beat.narration, phrase));
    return match
      ? [{
          rule: "false_reassurance",
          beat: beat.index,
          detail: `Narration contains the banned phrase: ${match}.`,
          suggested_line: alternatives[story.language],
        }]
      : [];
  });
}

function personalizationFailures(story: StoryScript): ValidationFailure[] {
  if (story.language !== "en") return [];

  const firstNarration = story.beats[0]?.narration ?? "";
  return matches(story.language, firstNarration, story.child_first_name)
    ? []
    : [{
        rule: "child_name",
        beat: 1,
        detail: "The first narration line must include the child's first name or nickname.",
        suggested_line: `${story.child_first_name}, you are in the room with your care team.`,
      }];
}

function ageTierFailures(story: StoryScript, totalWordNarration?: string): ValidationFailure[] {
  const narration = story.beats.map((beat) => beat.narration).join(" ");
  const allWords = words(totalWordNarration ?? narration);
  const limit = tierLimits[story.age_tier];
  const totalFailure = allWords.length > limit.totalWords
    ? [{ rule: "age_tier_total_words", beat: null, detail: `Tier ${story.age_tier} allows at most ${limit.totalWords} words.`, suggested_line: "Shorten the narration while retaining every required item." }]
    : [];
  const sentenceFailure = sentences(narration).some((sentence) => words(sentence).length > limit.sentenceWords)
    ? [{ rule: "age_tier_sentence_words", beat: null, detail: `Tier ${story.age_tier} allows at most ${limit.sentenceWords} words per sentence.`, suggested_line: "Split this narration into shorter sentences." }]
    : [];
  const tierThreeRules: Array<ValidationFailure | null> = [
        /\p{N}/u.test(narration)
          ? { rule: "age_tier_numbers", beat: null, detail: "Tier 3 narration cannot include numbers.", suggested_line: "Use words without numbers for this tier." }
          : null,
        mechanismTerms.some((term) => matches(story.language, narration, term))
          ? { rule: "age_tier_mechanism", beat: null, detail: "Tier 3 narration cannot include a mechanism explanation.", suggested_line: "Use a concrete sensory description instead." }
          : null,
      ];
  const tierThreeFailures = story.age_tier === 3
    ? tierThreeRules.filter((failure): failure is Exclude<typeof failure, null> => failure !== null)
    : [];
  const tierSixFailures = story.age_tier !== 6 || !/(?:\b1[1-9]\b|\b[2-9]\d+\b)/.test(narration)
    ? []
    : [{ rule: "age_tier_numbers", beat: null, detail: "Tier 6 narration permits simple counting only.", suggested_line: "Use simple counting or remove the number." }];
  const tierTenFailures = story.age_tier !== 10 || choicePatterns[story.language].test(narration)
    ? []
    : [{ rule: "age_tier_real_choice", beat: null, detail: "Tier 10 narration must offer one real choice.", suggested_line: "You can choose to look away or hold a hand." }];

  return [...totalFailure, ...sentenceFailure, ...tierThreeFailures, ...tierSixFailures, ...tierTenFailures];
}

function contentFailures(story: StoryScript): ValidationFailure[] {
  return story.beats.flatMap((beat) => prohibitedContent.some((pattern) => pattern.test(beat.narration))
    ? [{ rule: "prohibited_content", beat: beat.index, detail: "Narration contains prohibited content.", suggested_line: alternatives[story.language] }]
    : []);
}

function keepsakeFailures(story: StoryScript): ValidationFailure[] {
  const oneTrueThing = story.keepsake.one_true_thing.trim();
  const inSensoryDetail = oneTrueThing.length > 0 && story.beats.some(
    (beat) => matches(story.language, beat.sensory_detail ?? "", oneTrueThing),
  );
  return inSensoryDetail
    ? []
    : [{ rule: "keepsake_truth", beat: null, detail: "The keepsake's one true thing must appear in a sensory detail.", suggested_line: "Include the keepsake's one true thing in a sensory detail." }];
}

export function validateStory(
  story: StoryScript,
  template: ProcedureTemplate,
  options: ValidationOptions = {},
): ValidationResult {
  const failures = [
    ...reassuranceFailures(story),
    ...contentFailures(story),
    ...personalizationFailures(story),
    ...structureFailures(story, template),
    ...validateCoverage(story, template),
    ...sensoryFailures(story, template),
    ...ageTierFailures(story, options.totalWordNarration),
    ...keepsakeFailures(story),
  ];

  return failures.length === 0 ? { ok: true } : { ok: false, failures };
}
