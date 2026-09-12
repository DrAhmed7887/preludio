import templateJson from "../../../../../../procedures/blood_draw.json";
import { NextResponse } from "next/server";

import { procedureTemplateSchema } from "@/lib/contracts";
import { getAudio, getStory, isStoryApproved, storeAudio } from "@/lib/story-store";
import { synthesizeStory } from "@/lib/tts/synthesize-story";
import { validateStory } from "@/lib/validator/validate-story";

const template = procedureTemplateSchema.parse(templateJson);

type RouteContext = { params: Promise<{ storyId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { storyId } = await context.params;
  const story = getStory(storyId);
  if (!story) {
    return NextResponse.json({ reason: "story_not_found" }, { status: 404 });
  }
  if (!isStoryApproved(storyId)) {
    return NextResponse.json({ reason: "approval_required" }, { status: 403 });
  }

  const validation = validateStory(story, template);
  if (!validation.ok) {
    return NextResponse.json({ failures: validation.failures }, { status: 422 });
  }

  try {
    storeAudio(storyId, await synthesizeStory(story));
    return NextResponse.json({ audio_url: `/api/stories/${storyId}/audio` }, { status: 201 });
  } catch {
    return NextResponse.json(
      { reason: "audio_generation_failed", detail: "Narration audio could not be generated." },
      { status: 502 },
    );
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { storyId } = await context.params;
  const audio = getAudio(storyId);
  if (!audio) {
    return NextResponse.json({ reason: "audio_not_found" }, { status: 404 });
  }

  const body = new Uint8Array(audio.byteLength);
  body.set(audio);
  return new Response(body.buffer, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "audio/mpeg",
    },
  });
}
