import { describe, expect, it } from "vitest";

import { seededStories } from "../src/lib/seeds/stories";
import { PARENT_LINK_TTL_MS, approveStory, isParentStoryAvailable, storeStory } from "../src/lib/story-store";

describe("parent story links", () => {
  it("only exposes an approved story for 24 hours", () => {
    const storyId = storeStory(seededStories.en);
    expect(isParentStoryAvailable(storyId)).toBe(false);

    approveStory(storyId);
    expect(isParentStoryAvailable(storyId)).toBe(true);
    expect(isParentStoryAvailable(storyId, Date.now() + PARENT_LINK_TTL_MS + 1)).toBe(false);
  });
});
