import OpenAI from "openai";

import {
  Intake,
  ProcedureTemplate,
  RenderedStory,
  StoryScript,
  renderedBeatSchema,
  renderedStorySchema,
  storyScriptSchema,
} from "../contracts";
import { ValidationFailure, validateStory } from "../validator/validate-story";
import { buildBeatPrompt, getBeatWordBudget } from "./prompt";

export const OPENROUTER_MODEL = "openai/gpt-4.1-mini";
export const TIER_THREE_MODEL = "google/gemini-2.5-flash";
export const MAX_RENDER_ATTEMPTS = 4;

export type RenderResult =
  | { ok: true; story: StoryScript }
  | { ok: false; failures: ValidationFailure[] };

export type CandidateGenerator = (
  intake: Intake,
  template: ProcedureTemplate,
  priorFailures: ValidationFailure[],
  previousCandidate?: RenderedStory,
) => Promise<RenderedStory>;

const modelBeatSchema = renderedBeatSchema.omit({ index: true });
const modelFor = (intake: Intake) =>
  intake.age_tier === 3 ? TIER_THREE_MODEL : OPENROUTER_MODEL;

function responseSchema() {
  return {
    name: "rendered_beat",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["narration", "child_action"],
      properties: {
        narration: { type: "string" },
        child_action: { type: ["string", "null"] },
      },
    },
  } as const;
}

function fullStoryResponseSchema() {
  return {
    name: "repaired_story",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["beats"],
      properties: {
        beats: {
          type: "array",
          items: responseSchema().schema,
        },
      },
    },
  } as const;
}

const keepsakeHeadlines = {
  en: "A card for you",
  es: "Una tarjeta para ti",
  ar: "بطاقة لك",
} as const;

function providerFailure(detail: string): RenderResult {
  return {
    ok: false,
    failures: [{ rule: "render_provider_error", beat: null, detail }],
  };
}

function outputFailure(detail: string): RenderResult {
  return {
    ok: false,
    failures: [{ rule: "rendered_output_shape", beat: null, detail }],
  };
}

function candidateFromBeats(
  beats: unknown,
  intake: Intake,
  template: ProcedureTemplate,
): RenderedStory {
  if (!Array.isArray(beats) || beats.length !== template.beats.length) {
    throw new Error("The provider returned an incomplete structured story.");
  }

  return renderedStorySchema.parse({
    beats: beats.map((beat, index) => ({
      index: template.beats[index]?.id,
      ...modelBeatSchema.parse(beat),
    })),
    keepsake: {
      headline: keepsakeHeadlines[intake.language],
      one_true_thing: template.beats[0]?.sensory_truth?.split(";")[0] ?? "",
    },
  });
}

async function renderWholeStory(
  client: OpenAI,
  intake: Intake,
  template: ProcedureTemplate,
  previousCandidate: RenderedStory | undefined,
  priorFailures: ValidationFailure[],
): Promise<RenderedStory> {
  const totalWordLimit = { 3: 400, 6: 120, 10: 200 }[intake.age_tier];
  const sentenceWordLimit = { 3: 12, 6: 12, 10: 18 }[intake.age_tier];
  const anchorRequirements = template.beats.flatMap((beat) => [
    `Beat ${beat.id} approved anchors:`,
    ...beat.must_convey.map((item) => {
      const options = template.coverage_anchors.items[item]?.[intake.language] ?? [];
      return `${item}: ${options.map((option) => `“${option}”`).join(" OR ")}`;
    }),
  ]);
  const lineLimits = template.beats.map(
    (beat, index) => `Beat ${beat.id}: ${getBeatWordBudget(intake.age_tier, index)} words or fewer.`,
  );
  const beatTruths = template.beats.flatMap((beat) => [
    `Beat ${beat.id} clinical fact: ${beat.clinical_fact}`,
    `Beat ${beat.id} sensory truth: ${beat.sensory_truth ?? "none"}`,
  ]);
  const response = await client.chat.completions.create({
    model: modelFor(intake),
    messages: [{
      role: "user",
      content: [
        previousCandidate
          ? `Repair this seven-beat ${intake.language} voice story for ${intake.child_first_name}.`
          : `Write a seven-beat ${intake.language} voice story for ${intake.child_first_name}.`,
        `The seven returned narration lines together must use ${totalWordLimit} words or fewer while containing one approved anchor for every item below.`,
        ...lineLimits,
        `No sentence may use more than ${sentenceWordLimit} words.`,
        intake.age_tier === 3
          ? "For tier 3, make the seven lines a connected read-aloud story: arriving, getting ready, the truthful pinch moment, choices, ending, and keepsake. Include the child's name in beat 1 only. Do not mention blood, veins, or how the procedure works."
          : "",
        `Selected concern: ${intake.concern_archetype}. Let it shape the spoken emphasis without adding a clinical fact.`,
        "Every line must be a complete spoken sentence. Do not add, remove, or reorder a clinical beat. Do not promise that a sensation will not hurt.",
        ...beatTruths,
        ...anchorRequirements,
        ...(previousCandidate ? [
          "Validator failures to repair:",
          ...priorFailures.map((failure) => `${failure.rule}: ${failure.detail} ${failure.suggested_line ?? ""}`),
          "Existing candidate:",
          JSON.stringify(previousCandidate.beats),
        ] : []),
        "Return only the seven narration beats.",
      ].join("\n"),
    }],
    response_format: {
      type: "json_schema",
      json_schema: fullStoryResponseSchema(),
    },
  });
  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new Error("The provider returned no structured story repair.");
  }

  return candidateFromBeats(JSON.parse(content).beats, intake, template);
}

async function generateCandidate(
  intake: Intake,
  template: ProcedureTemplate,
  priorFailures: ValidationFailure[],
  previousCandidate?: RenderedStory,
): Promise<RenderedStory> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for rendering.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const needsWholeStoryRepair = priorFailures.some((failure) =>
    failure.rule === "age_tier_total_words" || failure.rule === "age_tier_sentence_words",
  );
  if (intake.age_tier === 3 || previousCandidate && needsWholeStoryRepair) {
    return renderWholeStory(client, intake, template, previousCandidate, priorFailures);
  }
  const repairIndexes = new Set(
    priorFailures
      .flatMap((failure) => failure.beat === null ? [] : [failure.beat - 1])
      .filter((index) => index >= 0 && index < template.beats.length),
  );
  const needsTemplateRepair = priorFailures.some((failure) =>
    failure.rule === "template_beat_structure",
  );
  const needsChoiceRepair = priorFailures.some(
    (failure) => failure.rule === "age_tier_real_choice",
  );
  const needsNameRepair = priorFailures.some(
    (failure) => failure.rule === "child_name",
  );
  if (needsTemplateRepair || !previousCandidate) {
    template.beats.forEach((_, index) => repairIndexes.add(index));
  }
  if (needsChoiceRepair) repairIndexes.add(4);
  if (needsNameRepair) repairIndexes.add(0);

  const beats = await Promise.all(template.beats.map(async (beat, index) => {
    const previousBeat = previousCandidate?.beats[index];
    if (previousBeat && !repairIndexes.has(index)) return previousBeat;

    const completion = await client.chat.completions.create({
      model: modelFor(intake),
      messages: [{ role: "user", content: buildBeatPrompt(
        intake,
        template,
        index,
        priorFailures,
        previousBeat?.narration,
      ) }],
      response_format: {
        type: "json_schema",
        json_schema: responseSchema(),
      },
    });
    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error(`The provider returned no structured content for beat ${beat.id}.`);
    }
    return { index: beat.id, ...modelBeatSchema.parse(JSON.parse(content)) };
  }));

  return candidateFromBeats(beats.map((beat) => ({
    narration: beat.narration,
    child_action: beat.child_action,
  })), intake, template);
}

function combineStory(
  input: Intake,
  candidate: RenderedStory,
  template: ProcedureTemplate,
): StoryScript {
  return storyScriptSchema.parse({
    ...input,
    ...candidate,
    beats: candidate.beats.map((beat, index) => ({
      ...beat,
      sensory_detail: template.beats[index]?.sensory_truth ?? null,
    })),
  });
}

export async function renderStory(
  input: Intake,
  template: ProcedureTemplate,
  generator: CandidateGenerator = generateCandidate,
): Promise<RenderResult> {
  let finalFailures: ValidationFailure[] | undefined;
  let previousCandidate: RenderedStory | undefined;

  for (let attempt = 1; attempt <= MAX_RENDER_ATTEMPTS; attempt += 1) {
    try {
      const candidate = await generator(
        input,
        template,
        finalFailures ?? [],
        previousCandidate,
      );
      const story = combineStory(input, candidate, template);
      const validation = validateStory(story, template);
      if (validation.ok) {
        return { ok: true, story };
      }
      finalFailures = validation.failures;
      previousCandidate = candidate;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "The provider returned an unknown error.";
      return error instanceof SyntaxError || error instanceof Error && error.message.includes("structured")
        ? outputFailure(detail)
        : providerFailure(detail);
    }
  }

  return {
    ok: false,
    failures: finalFailures ?? [
      { rule: "render_provider_error", beat: null, detail: "No candidate was returned." },
    ],
  };
}
