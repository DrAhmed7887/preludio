import templateJson from "../../../../../procedures/blood_draw.json";
import { NextResponse } from "next/server";

import { intakeSchema, procedureTemplateSchema } from "@/lib/contracts";
import { renderStory } from "@/lib/render/render-story";
import { storeStory } from "@/lib/story-store";

const template = procedureTemplateSchema.parse(templateJson);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = intakeSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json(
      { reason: "invalid_intake", detail: input.error.issues[0]?.message },
      { status: 400 },
    );
  }

  const result = await renderStory(input.data, template);
  if (!result.ok) {
    return NextResponse.json({ failures: result.failures }, { status: 422 });
  }

  const storyId = storeStory(result.story);
  return NextResponse.json({ story_id: storyId, story: result.story }, { status: 201 });
}
