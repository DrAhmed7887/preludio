import templateJson from "../../../../../../procedures/blood_draw.json";
import { NextResponse } from "next/server";

import { procedureTemplateSchema } from "@/lib/contracts";
import { getAudio, getStory, isStoryApproved } from "@/lib/story-store";
import { validateStory } from "@/lib/validator/validate-story";

const template = procedureTemplateSchema.parse(templateJson);
type RouteContext = { params: Promise<{ storyId: string }> };

function twilioSettings() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.TWILIO_WHATSAPP_TO;
  return accountSid && authToken && from && to ? { accountSid, authToken, from, to } : null;
}

export async function POST(request: Request, context: RouteContext) {
  const { storyId } = await context.params;
  const story = getStory(storyId);
  const settings = twilioSettings();
  if (!story) return NextResponse.json({ reason: "story_not_found" }, { status: 404 });
  if (!isStoryApproved(storyId)) return NextResponse.json({ reason: "approval_required" }, { status: 403 });
  if (!getAudio(storyId)) return NextResponse.json({ reason: "audio_required" }, { status: 409 });
  if (!settings) return NextResponse.json({ reason: "delivery_not_configured" }, { status: 503 });

  const validation = validateStory(story, template);
  if (!validation.ok) return NextResponse.json({ failures: validation.failures }, { status: 422 });

  const transcript = story.beats.map((beat) => beat.narration).join(" ");
  const audioUrl = new URL(`/api/stories/${storyId}/audio`, request.url).toString();
  const body = new URLSearchParams({
    Body: transcript,
    From: settings.from,
    MediaUrl: audioUrl,
    To: settings.to,
  });
  const credentials = Buffer.from(`${settings.accountSid}:${settings.authToken}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${settings.accountSid}/Messages.json`,
    { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body },
  );
  if (!response.ok) return NextResponse.json({ reason: "delivery_failed" }, { status: 502 });

  const message = await response.json() as { sid: string; status: string };
  return NextResponse.json({ message_sid: message.sid, status: message.status }, { status: 201 });
}
