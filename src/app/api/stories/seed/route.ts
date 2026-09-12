import { NextResponse } from "next/server";
import { z } from "zod";

import { storeStory } from "@/lib/story-store";
import { seededStories } from "@/lib/seeds/stories";
import { validateStory } from "@/lib/validator/validate-story";
import templateJson from "../../../../../procedures/blood_draw.json";
import { procedureTemplateSchema } from "@/lib/contracts";

const template = procedureTemplateSchema.parse(templateJson);
const inputSchema = z.object({ language: z.enum(["en", "es"]) });

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ reason: "invalid_seed" }, { status: 400 });

  const story = seededStories[input.data.language];
  const validation = validateStory(story, template);
  if (!validation.ok) return NextResponse.json({ failures: validation.failures }, { status: 422 });

  return NextResponse.json({ story_id: storeStory(story), story, seeded: true }, { status: 201 });
}
