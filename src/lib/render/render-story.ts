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
import { buildBeatPrompt } from "./prompt";

export const OPENROUTER_MODEL = "openai/gpt-4o-mini";
export const MAX_RENDER_ATTEMPTS = 2;

export type RenderResult =
  | { ok: true; story: StoryScript }
  | { ok: false; failures: ValidationFailure[] };

export type CandidateGenerator = (
  intake: Intake,
  template: ProcedureTemplate,
  priorFailures: ValidationFailure[],
) => Promise<RenderedStory>;

const modelBeatSchema = renderedBeatSchema.omit({ index: true });

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

async function generateCandidate(
  intake: Intake,
  template: ProcedureTemplate,
  priorFailures: ValidationFailure[],
): Promise<RenderedStory> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for rendering.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const beats = await Promise.all(template.beats.map(async (beat, index) => {
    const completion = await client.chat.completions.create({
      model: OPENROUTER_MODEL,
      temperature: 0,
      messages: [{ role: "user", content: buildBeatPrompt(intake, template, index, priorFailures) }],
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

  return renderedStorySchema.parse({
    beats,
    keepsake: {
      headline: keepsakeHeadlines[intake.language],
      one_true_thing: template.beats[0]?.sensory_truth?.split(";")[0] ?? "",
    },
  });
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

  for (let attempt = 1; attempt <= MAX_RENDER_ATTEMPTS; attempt += 1) {
    try {
      const candidate = await generator(input, template, finalFailures ?? []);
      const story = combineStory(input, candidate, template);
      const validation = validateStory(story, template);
      if (validation.ok) {
        return { ok: true, story };
      }
      finalFailures = validation.failures;
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
