"use client";

import { FormEvent, useState } from "react";

import {
  ConcernArchetype,
  Intake,
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

  function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = intakeSchema.safeParse(intake);

    setFormMessage(
      result.success
        ? "The intake is ready for rendering in Slice 3."
        : result.error.issues[0]?.message ?? "Check the intake values.",
    );
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

        <button type="submit">Check intake</button>
      </form>

      <section aria-live="polite" className="status-card">
        <p className="status-label">Intake status</p>
        <p>{formMessage || "Choose the clinical parameters and add the child&apos;s label."}</p>
      </section>
    </main>
  );
}
