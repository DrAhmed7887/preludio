import { Intake, ProcedureTemplate } from "../contracts";
import type { ValidationFailure } from "../validator/validate-story";

const sentenceLimits = { 3: 8, 6: 12, 10: 18 } as const;
const beatWordBudgets = {
  3: [7, 6, 6, 7, 3, 6, 4],
  6: [16, 16, 16, 22, 16, 16, 12],
  10: [26, 26, 26, 30, 26, 26, 22],
} as const;

export function getBeatWordBudget(
  ageTier: Intake["age_tier"],
  beatIndex: number,
): number {
  return beatWordBudgets[ageTier][beatIndex] ?? 0;
}

export function buildBeatPrompt(
  intake: Intake,
  template: ProcedureTemplate,
  beatIndex: number,
  priorFailures: ValidationFailure[] = [],
): string {
  const beat = template.beats[beatIndex];
  if (!beat) {
    throw new Error("Template beat is missing.");
  }

  const anchors = beat.must_convey.map((item) => {
    const options = (template.coverage_anchors.items[item]?.[intake.language] ?? [])
      .filter((option) => intake.age_tier !== 3 || !/\p{N}/u.test(option));
    return `${item}: ${options.map((option) => `“${option}”`).join(" OR ")}`;
  });
  const feedback = priorFailures.filter(
    (failure) => failure.beat === null || failure.beat === beat.id,
  );
  const retryRequirements = feedback.map((failure) => {
    const item = beat.must_convey.find((mustConvey) => failure.detail.includes(mustConvey));
    if (!item) return `Retry failure: ${failure.rule} — ${failure.detail}`;

    const options = (template.coverage_anchors.items[item]?.[intake.language] ?? [])
      .filter((option) => intake.age_tier !== 3 || !/\p{N}/u.test(option));
    return `Retry requirement: missing ${item}. Copy exactly one: ${options.map((option) => `“${option}”`).join(" OR ")}.`;
  });

  return [
    `Render beat ${beat.id} only in ${intake.language} for ${intake.child_first_name}.`,
    `Your narration field must contain at most ${getBeatWordBudget(intake.age_tier, beatIndex)} words and never more than ${sentenceLimits[intake.age_tier] - 2} words per sentence. Count words before answering. Do not use the child's name unless it still fits.`,
    `Clinical fact: ${beat.clinical_fact}`,
    `Sensory truth: ${beat.sensory_truth ?? "none"}`,
    "The validator accepts only the exact substrings below. Copy one complete option for every required item; do not paraphrase it. Before returning, check that narration contains one option from every line.",
    ...anchors,
    "Every required phrase must be in narration; child_action is not checked for coverage.",
    "Set child_action to null.",
    intake.age_tier === 3
      ? "For tier 3, use only one complete required phrase per item in short sentences. Do not add any other words, introduction, or explanation."
      : "Do not add a clinical step or promise that a sensation will not hurt.",
    "Return narration and child_action only.",
    ...retryRequirements,
  ].filter(Boolean).join("\n");
}
