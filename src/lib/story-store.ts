import { StoryScript } from "./contracts";

const stories = new Map<string, StoryScript>();

export function storeStory(story: StoryScript): string {
  const storyId = crypto.randomUUID();
  stories.set(storyId, story);
  return storyId;
}

export function getStory(storyId: string): StoryScript | undefined {
  return stories.get(storyId);
}
