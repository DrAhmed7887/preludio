import { z } from "zod";

export const ageTierSchema = z.union([z.literal(3), z.literal(6), z.literal(10)]);
export const languageSchema = z.enum(["es", "en", "ar"]);
export const procedureSchema = z.literal("blood_draw");
export const concernArchetypeSchema = z.enum([
  "needle_itself",
  "unfamiliar_room",
  "strangers_white_coats",
  "being_held",
  "separation_from_parent",
  "seeing_blood",
  "not_knowing_when_it_ends",
  "previous_bad_experience",
]);

const childNamePattern = /^[\p{L}\p{M}][\p{L}\p{M}'’-]{0,39}$/u;

export const childFirstNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a first name or nickname.")
  .max(40, "Use 40 characters or fewer.")
  .regex(childNamePattern, "Use one first name or nickname with letters only.");

export const intakeSchema = z.object({
  child_first_name: childFirstNameSchema,
  procedure: procedureSchema,
  age_tier: ageTierSchema,
  language: languageSchema,
  concern_archetype: concernArchetypeSchema,
});

export const procedureBeatSchema = z.object({
  id: z.number().int().positive(),
  clinical_fact: z.string().min(1),
  sensory_truth: z.string().min(1).nullable(),
  must_convey: z.array(z.string().min(1)).min(1),
});

export const coverageAnchorSchema = z.object({
  en: z.array(z.string().min(1)).min(2).max(4),
  es: z.array(z.string().min(1)).min(2).max(4),
  ar: z.array(z.string().min(1)).min(2).max(4),
});

export const procedureTemplateSchema = z.object({
  procedure_id: procedureSchema,
  coverage_anchors: z.object({
    matching_note: z.string().min(1),
    items: z.record(z.string(), coverageAnchorSchema),
  }),
  beats: z.array(procedureBeatSchema).length(7),
});

export const beatSchema = z.object({
  index: z.number().int().positive(),
  narration: z.string().min(1),
  sensory_detail: z.string().min(1).nullable(),
  child_action: z.string().min(1).nullable(),
});

export const storyScriptSchema = intakeSchema.extend({
  beats: z.array(beatSchema).length(7),
  keepsake: z.object({
    headline: z.string().min(1),
    one_true_thing: z.string().min(1),
  }),
});

export type Intake = z.infer<typeof intakeSchema>;
export type ConcernArchetype = z.infer<typeof concernArchetypeSchema>;
export type ProcedureTemplate = z.infer<typeof procedureTemplateSchema>;
export type StoryScript = z.infer<typeof storyScriptSchema>;
