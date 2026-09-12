import { StoryScript } from "./contracts";

type InMemoryStoryStore = {
  stories: Map<string, StoryScript>;
  audioByStoryId: Map<string, Uint8Array>;
  approvedStoryIds: Set<string>;
  approvedAtByStoryId: Map<string, number>;
};

const globalStore = globalThis as typeof globalThis & { preludioStoryStore?: InMemoryStoryStore };
const store = globalStore.preludioStoryStore ??= {
  stories: new Map<string, StoryScript>(),
  audioByStoryId: new Map<string, Uint8Array>(),
  approvedStoryIds: new Set<string>(),
  approvedAtByStoryId: new Map<string, number>(),
};

export const PARENT_LINK_TTL_MS = 24 * 60 * 60 * 1000;

export function storeStory(story: StoryScript): string {
  const storyId = crypto.randomUUID();
  store.stories.set(storyId, story);
  return storyId;
}

export function getStory(storyId: string): StoryScript | undefined {
  return store.stories.get(storyId);
}

export function storeAudio(storyId: string, audio: Uint8Array): void {
  store.audioByStoryId.set(storyId, audio);
}

export function getAudio(storyId: string): Uint8Array | undefined {
  return store.audioByStoryId.get(storyId);
}

export function approveStory(storyId: string): void {
  store.approvedStoryIds.add(storyId);
  store.approvedAtByStoryId.set(storyId, Date.now());
}

export function isStoryApproved(storyId: string): boolean {
  return store.approvedStoryIds.has(storyId);
}

export function isParentStoryAvailable(storyId: string, now = Date.now()): boolean {
  const approvedAt = store.approvedAtByStoryId.get(storyId);
  return Boolean(approvedAt && now - approvedAt <= PARENT_LINK_TTL_MS);
}
