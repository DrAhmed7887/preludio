import { StoryScript } from "./contracts";

const stories = new Map<string, StoryScript>();
const audioByStoryId = new Map<string, Uint8Array>();

export function storeStory(story: StoryScript): string {
  const storyId = crypto.randomUUID();
  stories.set(storyId, story);
  return storyId;
}

export function getStory(storyId: string): StoryScript | undefined {
  return stories.get(storyId);
}

export function storeAudio(storyId: string, audio: Uint8Array): void {
  audioByStoryId.set(storyId, audio);
}

export function getAudio(storyId: string): Uint8Array | undefined {
  return audioByStoryId.get(storyId);
}
