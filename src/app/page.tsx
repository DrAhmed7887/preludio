"use client";

import { FormEvent, useRef, useState } from "react";
import { flushSync } from "react-dom";

import {
  ConcernArchetype,
  Intake,
  StoryScript,
  concernArchetypeSchema,
  intakeSchema,
} from "@/lib/contracts";

const concernLabels: Record<ConcernArchetype, string> = {
  needle_itself: "Needle itself",
  unfamiliar_room: "Unfamiliar room",
  strangers_white_coats: "Strangers in white coats",
  being_held: "Being held",
  separation_from_parent: "Separation from parent",
  seeing_blood: "Seeing blood",
  not_knowing_when_it_ends: "Not knowing when it ends",
  previous_bad_experience: "Previous bad experience",
};

const initialIntake: Intake = {
  child_first_name: "",
  procedure: "blood_draw",
  age_tier: 3,
  language: "es",
  concern_archetype: "unfamiliar_room",
};

export default function Home() {
  const [intake, setIntake] = useState<Intake>(initialIntake);
  const [formMessage, setFormMessage] = useState("");
  const [failures, setFailures] = useState<Array<{ rule: string; beat: number | null; detail: string; suggested_line?: string }>>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [override, setOverride] = useState("");
  const [overrideFailures, setOverrideFailures] = useState<Array<{ rule: string; detail: string; suggested_line?: string }>>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCheckingOverride, setIsCheckingOverride] = useState(false);
  const [story, setStory] = useState<StoryScript | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = intakeSchema.safeParse(intake);
    if (!result.success) {
      setFormMessage(result.error.issues[0]?.message ?? "Check the intake values.");
      return;
    }

    setFailures([]);
    setAudioUrl(null);
    setIsApproved(false);
    setOverride("");
    setOverrideFailures([]);
    setIsRendering(true);
    setStory(null);
    setStoryId(null);
    setFormMessage("Rendering the narration from the approved template.");

    try {
      const response = await fetch("/api/stories/render", {
        body: JSON.stringify(result.data),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();
      if (response.ok) {
        setStory(payload.story as StoryScript);
        setStoryId(payload.story_id as string);
        setFormMessage("Validated narration ready for clinician review.");
      } else {
        setFailures(payload.failures ?? []);
        setFormMessage(payload.detail ?? "Rendering did not produce a validated story.");
      }
    } catch {
      setFormMessage("The rendering request could not be completed.");
    } finally {
      setIsRendering(false);
    }
  }

  async function checkOverride() {
    if (!storyId) return;

    setIsCheckingOverride(true);
    try {
      const response = await fetch(`/api/stories/${storyId}/override`, {
        body: JSON.stringify({ override }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();
      setOverrideFailures(payload.failures ?? []);
      if (response.ok) {
        setFormMessage("This override did not trigger a validator refusal.");
        return;
      }
      setFormMessage("The override was refused by the validator.");
    } catch {
      setFormMessage("The override could not be checked.");
    } finally {
      setIsCheckingOverride(false);
    }
  }

  async function approveAndPlay() {
    if (!storyId) return;

    setIsApproving(true);
    try {
      const approval = await fetch(`/api/stories/${storyId}/approval`, { method: "POST" });
      const approvalPayload = await approval.json();
      if (!approval.ok) {
        setFailures(approvalPayload.failures ?? []);
        setFormMessage("Approval could not be completed.");
        return;
      }
      const audio = await fetch(`/api/stories/${storyId}/audio`, { method: "POST" });
      const audioPayload = await audio.json();
      if (!audio.ok) {
        setFailures(audioPayload.failures ?? []);
        setFormMessage(audioPayload.detail ?? "Narration audio could not be prepared.");
        return;
      }
      flushSync(() => {
        setAudioUrl(audioPayload.audio_url as string);
        setIsApproved(true);
      });
      await audioRef.current?.play();
      setFormMessage("Approved narration is playing for clinician listening.");
    } catch {
      setFormMessage("Approval completed, but playback needs a manual click.");
    } finally {
      setIsApproving(false);
    }
  }

  function refuseStory() {
    setAudioUrl(null);
    setIsApproved(false);
    setFormMessage("Narration refused. Nothing was prepared for delivery.");
  }

  return (
    <main className="page-shell">
      <header>
        <p className="eyebrow">Preludio · clinician intake</p>
        <h1>Prepare a voice story with clinical guidance.</h1>
        <p className="intro">
          The four clinical parameters shape the story. The child&apos;s name is a
          label for the narration.
        </p>
      </header>

      <form className="intake-form" onSubmit={submitIntake}>
        <div className="field field-wide">
          <label htmlFor="child_first_name">Child&apos;s first name or nickname</label>
          <input
            id="child_first_name"
            maxLength={40}
            name="child_first_name"
            onChange={(event) =>
              setIntake({ ...intake, child_first_name: event.target.value })
            }
            required
            value={intake.child_first_name}
          />
          <p className="field-help">
            First name or nickname only. No surname, no date of birth, no medical
            record number, no identifier of any kind.
          </p>
        </div>

        <div className="field">
          <label htmlFor="procedure">Procedure</label>
          <select
            id="procedure"
            name="procedure"
            onChange={(event) =>
              setIntake({ ...intake, procedure: event.target.value as Intake["procedure"] })
            }
            value={intake.procedure}
          >
            <option value="blood_draw">Blood draw</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="age_tier">Age tier</label>
          <select
            id="age_tier"
            name="age_tier"
            onChange={(event) =>
              setIntake({ ...intake, age_tier: Number(event.target.value) as Intake["age_tier"] })
            }
            value={intake.age_tier}
          >
            <option value={3}>3</option>
            <option value={6}>6</option>
            <option value={10}>10</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="language">Language</label>
          <select
            id="language"
            name="language"
            onChange={(event) =>
              setIntake({ ...intake, language: event.target.value as Intake["language"] })
            }
            value={intake.language}
          >
            <option value="es">Spanish</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="concern_archetype">Concern archetype</label>
          <select
            id="concern_archetype"
            name="concern_archetype"
            onChange={(event) =>
              setIntake({
                ...intake,
                concern_archetype: event.target.value as Intake["concern_archetype"],
              })
            }
            value={intake.concern_archetype}
          >
            {concernArchetypeSchema.options.map((concern) => (
              <option key={concern} value={concern}>
                {concernLabels[concern]}
              </option>
            ))}
          </select>
        </div>

        <button disabled={isRendering} type="submit">
          {isRendering ? "Rendering narration…" : "Render narration"}
        </button>
      </form>

      <section aria-live="polite" className="status-card">
        <p className="status-label">Intake status</p>
        <p>{formMessage || "Choose the clinical parameters and add the child&apos;s label."}</p>
      </section>

      {failures.length > 0 && (
        <section aria-live="polite" className="failure-card">
          <p className="status-label">Validation result</p>
          {failures.map((failure) => (
            <article key={`${failure.rule}-${failure.beat}`}>
              <p><strong>{failure.rule}</strong>{failure.beat ? ` · beat ${failure.beat}` : ""}</p>
              <p>{failure.detail}</p>
              {failure.suggested_line && <p>Alternative: {failure.suggested_line}</p>}
            </article>
          ))}
        </section>
      )}

      {story && (
        <section className="story-output">
          <p className="status-label">Validated narration</p>
          {story.beats.map((beat) => (
            <article className="narration-card" key={beat.index}>
              <p className="beat-index">Beat {beat.index}</p>
              <p>{beat.narration}</p>
            </article>
          ))}
          <section className="override-panel">
            <p className="status-label">Override check</p>
            <label htmlFor="override">Clinician wording to check</label>
            <textarea
              id="override"
              maxLength={280}
              onChange={(event) => setOverride(event.target.value)}
              placeholder="Tell her it won't hurt"
              value={override}
            />
            <button disabled={!override.trim() || isCheckingOverride} onClick={checkOverride} type="button">
              {isCheckingOverride ? "Checking wording…" : "Check wording"}
            </button>
            {overrideFailures.map((failure) => (
              <article className="refusal-card" key={failure.rule}>
                <p className="refusal-rule">{failure.rule}</p>
                <p>This wording promises that a sensation will not hurt. Preludio uses truthful sensory descriptions instead.</p>
                <p><strong>Alternative:</strong> {failure.suggested_line}</p>
              </article>
            ))}
          </section>
          <section className="approval-panel">
            <p className="status-label">Clinician approval</p>
            <p>Review the seven narration lines, then choose one action.</p>
            {!isApproved && (
              <div className="approval-actions">
                <button disabled={isApproving} onClick={approveAndPlay} type="button">
                  {isApproving ? "Approving…" : "Approve and play narration"}
                </button>
                <button className="secondary-action" disabled={isApproving} onClick={refuseStory} type="button">Refuse</button>
              </div>
            )}
          </section>
          <section className="audio-panel">
            <p className="status-label">Narration audio</p>
            <p>{isApproved ? "AI-generated voice for clinician listening." : "Audio remains unavailable until approval."}</p>
            {audioUrl && <audio autoPlay controls ref={audioRef} src={audioUrl}>Your browser cannot play this audio.</audio>}
          </section>
          {isApproved && audioUrl && (
            <section className="delivery-preview">
              <p className="status-label">WhatsApp sandbox preview</p>
              <div className="chat-thread">
                <article className="cover-card">
                  <p>PRELUDIO</p>
                  <h2>Blood draw</h2>
                  <span>A voice story for {story.child_first_name}</span>
                </article>
                <article className="chat-bubble audio-bubble">
                  <p>Voice story</p>
                  <audio controls src={audioUrl}>Your browser cannot play this audio.</audio>
                </article>
                <article className="chat-bubble transcript-bubble">
                  <p className="status-label">Transcript</p>
                  {story.beats.map((beat) => <p key={beat.index}>{beat.narration}</p>)}
                </article>
              </div>
            </section>
          )}
        </section>
      )}
    </main>
  );
}
