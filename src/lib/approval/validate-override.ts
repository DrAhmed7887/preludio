import { ProcedureTemplate, StoryScript } from "../contracts";
import { ValidationResult, validateStory } from "../validator/validate-story";

export function validateOverride(
  story: StoryScript,
  override: string,
  template: ProcedureTemplate,
): ValidationResult {
  return validateStory({
    ...story,
    beats: story.beats.map((beat, index) =>
      index === 0 ? { ...beat, narration: `${beat.narration} ${override}` } : beat,
    ),
  }, template);
}
