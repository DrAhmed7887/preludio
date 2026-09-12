import templateJson from "../../../../../../procedures/blood_draw.json";
import { NextResponse } from "next/server";
import { z } from "zod";

import { validateOverride } from "@/lib/approval/validate-override";
import { procedureTemplateSchema } from "@/lib/contracts";
import { getStory } from "@/lib/story-store";

const overrideSchema = z.object({ override: z.string().trim().min(1).max(280) });
const template = procedureTemplateSchema.parse(templateJson);

type RouteContext = { params: Promise<{ storyId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const body = await request.json().catch(() => null);
  const input = overrideSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json({ reason: "invalid_override" }, { status: 400 });
  }

  const { storyId } = await context.params;
  const story = getStory(storyId);
  if (!story) {
    return NextResponse.json({ reason: "story_not_found" }, { status: 404 });
  }

  const validation = validateOverride(story, input.data.override, template);
  return NextResponse.json(validation, { status: validation.ok ? 200 : 422 });
}
