import { StoryScript, storyScriptSchema } from "../contracts";

export const seededStories: Record<"en" | "es", StoryScript> = {
  en: storyScriptSchema.parse({
    child_first_name: "Sofia", procedure: "blood_draw", age_tier: 10, language: "en", concern_archetype: "unfamiliar_room",
    beats: [
      { index: 1, narration: "You are in the chair. A nurse is here. The room is bright. Mum is with you. You can choose to look away or hold a hand.", sensory_detail: "the chair is firm; the room is bright", child_action: null },
      { index: 2, narration: "A tight squeeze from the band squeezes your arm. It is not the needle yet, just a tight band. This will last about a minute.", sensory_detail: "tight squeeze, not sharp, lasts about a minute", child_action: null },
      { index: 3, narration: "The wipe feels cold and wet. It smells sharp and dries quickly. This wipe is not the needle either.", sensory_detail: "cold and wet, smells sharp, dries quickly", child_action: null },
      { index: 4, narration: "It may hurt briefly, like a pinch. You can expect a quick tap for 5 to 20 seconds. It feels like counting to five before you finish.", sensory_detail: "a sharp pinch, then pressure; roughly 5-20 seconds", child_action: null },
      { index: 5, narration: "You can choose to look away or hold a hand. Breathe out slowly and take a breath. It's okay to feel nervous right now.", sensory_detail: null, child_action: null },
      { index: 6, narration: "The needle is out. It took a few seconds. You can choose to look away or hold a hand. Pressure is applied, then a small plaster is placed.", sensory_detail: "pressure, then a small plaster", child_action: null },
      { index: 7, narration: "You can choose to look away or hold a hand. You get a card for you to keep.", sensory_detail: null, child_action: null },
    ],
    keepsake: { headline: "A card for you", one_true_thing: "the chair is firm" },
  }),
  es: storyScriptSchema.parse({
    child_first_name: "Sofia", procedure: "blood_draw", age_tier: 10, language: "es", concern_archetype: "unfamiliar_room",
    beats: [
      { index: 1, narration: "En la silla, la luz brilla intensamente. Una enfermera está aquí y mamá está contigo.", sensory_detail: "the chair is firm; the room is bright", child_action: null },
      { index: 2, narration: "La banda aprieta el brazo. No es la aguja. Sientes un apretón que dura un minuto.", sensory_detail: "tight squeeze, not sharp, lasts about a minute", child_action: null },
      { index: 3, narration: "La toallita fría se siente mojada. Huele fuerte y se siente fría. La toallita tampoco es la aguja.", sensory_detail: "cold and wet, smells sharp, dries quickly", child_action: null },
      { index: 4, narration: "Puede doler un momento, como un pellizco. Sentirás presión durante unos segundos. Esto tomará de 5 a 20 segundos.", sensory_detail: "a sharp pinch, then pressure; roughly 5-20 seconds", child_action: null },
      { index: 5, narration: "Puedes mirar a otro lado. Puedes elegir mirar a otro lado. Puedes respirar. Puedes tomar una mano.", sensory_detail: null, child_action: null },
      { index: 6, narration: "La aguja salió. Duró unos segundos. Se siente presión, luego un pequeño apósito. Ya terminó. Todo fue rápido y sencillo.", sensory_detail: "pressure, then a small plaster", child_action: null },
      { index: 7, narration: "Te dan una pegatina después de la visita. Quedarte con una tarjeta es divertido y especial. Recibes una pegatina como recompensa.", sensory_detail: null, child_action: null },
    ],
    keepsake: { headline: "Una tarjeta para ti", one_true_thing: "the chair is firm" },
  }),
};
