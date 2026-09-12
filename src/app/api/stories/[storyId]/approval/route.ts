import templateJson from "../../../../../../procedures/blood_draw.json";
import { NextResponse } from "next/server";

import { procedureTemplateSchema } from "@/lib/contracts";
import { approveStory, getStory } from "@/lib/story-store";
import { validateStory } from "@/lib/validator/validate-story";

const template = procedureTemplateSchema.parse(templateJson);

type RouteContext = { params: Promise<{ storyId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { storyId } = await context.params;
  const story = getStory(storyId);
  if (!story) {
    return NextResponse.json({ reason: "story_not_found" }, { status: 404 });
  }

  const validation = validateStory(story, template);
  if (!validation.ok) {
    return NextResponse.json({ failures: validation.failures }, { status: 422 });
  }

  approveStory(storyId);
  return NextResponse.json({ approved: true }, { status: 201 });
}
