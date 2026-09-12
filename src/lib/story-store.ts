import { StoryScript } from "./contracts";

const stories = new Map<string, StoryScript>();
const audioByStoryId = new Map<string, Uint8Array>();
const approvedStoryIds = new Set<string>();
const approvedAtByStoryId = new Map<string, number>();

export const PARENT_LINK_TTL_MS = 24 * 60 * 60 * 1000;

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

export function approveStory(storyId: string): void {
  approvedStoryIds.add(storyId);
  approvedAtByStoryId.set(storyId, Date.now());
}

export function isStoryApproved(storyId: string): boolean {
  return approvedStoryIds.has(storyId);
}

export function isParentStoryAvailable(storyId: string, now = Date.now()): boolean {
  const approvedAt = approvedAtByStoryId.get(storyId);
  return Boolean(approvedAt && now - approvedAt <= PARENT_LINK_TTL_MS);
}
