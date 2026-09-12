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

export const falseReassurancePhrases = [
  { en: "won't hurt", es: "no te va a doler", ar: "لن يؤلمك" },
  { en: "will not hurt", es: "no dolerá", ar: "لن يؤلم" },
  { en: "no pain", es: "sin dolor", ar: "لا ألم" },
  { en: "painless", es: "indoloro", ar: "غير مؤلم" },
  { en: "you won't feel", es: "no lo sentirás", ar: "لن تشعر" },
  { en: "it's nothing", es: "no es nada", ar: "هذا لا شيء" },
  { en: "don't be scared", es: "no tengas miedo", ar: "لا تخف" },
  { en: "nothing to be afraid of", es: "no hay nada que temer", ar: "لا يوجد ما تخاف منه" },
  { en: "big kids don't cry", es: "los niños grandes no lloran", ar: "الأطفال الكبار لا يبكون" },
  { en: "over before you know it", es: "terminará antes de que te des cuenta", ar: "سينتهي قبل أن تدرك" },
  { en: "i promise", es: "te lo prometo", ar: "أعدك" },
  { en: "just a little scratch", es: "solo un pequeño pinchazo", ar: "مجرد وخزة صغيرة" },
] as const;

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
const includes = (text: string, phrase: string) => text.toLocaleLowerCase().includes(phrase.toLocaleLowerCase());

const choicePatterns: Record<Language, RegExp> = {
  en: /\b(?:you can choose|you may choose|choose whether)\b/i,
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

function coverageFailures(story: StoryScript, template: ProcedureTemplate): ValidationFailure[] {
  return template.beats.flatMap((templateBeat, index) => {
    const narration = story.beats[index]?.narration ?? "";
    return templateBeat.must_convey
      .filter((item) => !includes(narration, item))
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
  const phrases = falseReassurancePhrases.map((phrase) => phrase[story.language]);

  return story.beats.flatMap((beat) => {
    const match = phrases.find((phrase) => includes(beat.narration, phrase));
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

function ageTierFailures(story: StoryScript): ValidationFailure[] {
  const narration = story.beats.map((beat) => beat.narration).join(" ");
  const allWords = words(narration);
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
        mechanismTerms.some((term) => includes(narration, term))
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
    (beat) => includes(beat.sensory_detail ?? "", oneTrueThing),
  );
  return inSensoryDetail
    ? []
    : [{ rule: "keepsake_truth", beat: null, detail: "The keepsake's one true thing must appear in a sensory detail.", suggested_line: "Include the keepsake's one true thing in a sensory detail." }];
}

export function validateStory(story: StoryScript, template: ProcedureTemplate): ValidationResult {
  const failures = [
    ...structureFailures(story, template),
    ...coverageFailures(story, template),
    ...sensoryFailures(story, template),
    ...reassuranceFailures(story),
    ...ageTierFailures(story),
    ...contentFailures(story),
    ...keepsakeFailures(story),
  ];

  return failures.length === 0 ? { ok: true } : { ok: false, failures };
}
