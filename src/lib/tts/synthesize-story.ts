import OpenAI from "openai";

import { StoryScript } from "../contracts";

export const OPENROUTER_TTS_MODEL = "mistralai/voxtral-mini-tts-2603";
const OPENROUTER_TTS_VOICE = "en_paul_neutral";

export async function synthesizeStory(story: StoryScript): Promise<Uint8Array> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for narration audio.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const input = story.beats.map((beat) => beat.narration).join("\n");
  const response = await client.audio.speech.create({
    model: OPENROUTER_TTS_MODEL,
    input,
    voice: OPENROUTER_TTS_VOICE,
    response_format: "mp3",
  });

  return new Uint8Array(await response.arrayBuffer());
}
