import { notFound } from "next/navigation";

import { getAudio, getStory, isParentStoryAvailable } from "@/lib/story-store";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ storyId: string }> };

export default async function ParentStoryPage({ params }: PageProps) {
  const { storyId } = await params;
  const story = getStory(storyId);

  if (!story || !isParentStoryAvailable(storyId)) notFound();

  const audioAvailable = Boolean(getAudio(storyId));

  return (
    <main className="parent-story-shell">
      <p className="eyebrow">Preludio · voice story</p>
      <h1>A blood draw story for {story.child_first_name}</h1>
      <p className="intro">Listen together before the appointment.</p>
      {audioAvailable && (
        <audio controls className="parent-audio" src={`/api/stories/${storyId}/audio`}>
          Your browser cannot play this audio.
        </audio>
      )}
      <section className="parent-transcript" aria-label="Narration transcript">
        <p className="status-label">Narration</p>
        {story.beats.map((beat) => <p key={beat.index}>{beat.narration}</p>)}
      </section>
    </main>
  );
}
