import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Evidence | Preludio",
  description: "Implementation evidence for Preludio's governed voice-story workflow.",
};

const evidence = [
  {
    title: "A constrained clinical input",
    detail:
      "The clinician selects one supported procedure, an age tier, language, and a concern. The product does not diagnose, screen, or measure a child.",
  },
  {
    title: "Clinician-authored source material",
    detail:
      "Required facts, truthful sensory details, and seven fixed story beats come from the procedure template—not from the model.",
  },
  {
    title: "A validation gate before approval",
    detail:
      "Every generated story is checked for required coverage, age-appropriate structure, required sensory-detail fields, prohibited content, and false reassurance before it can be approved.",
  },
  {
    title: "Human approval before delivery",
    detail:
      "A user explicitly approves the narration before audio preparation and the parent-facing delivery flow begin.",
  },
  {
    title: "A deliberately narrow parent link",
    detail:
      "The parent view is read-only, has no editable controls, uses an opaque identifier, expires after 24 hours, and shows the approved story transcript and audio.",
  },
] as const;

export default function EvidencePage() {
  return (
    <main className="evidence-shell">
      <header className="evidence-hero">
        <p className="eyebrow">Preludio · implementation evidence</p>
        <h1>Useful AI needs a safety boundary.</h1>
        <p className="intro">
          Preludio helps a clinician prepare a child for a blood draw with a
          tailored voice story. The model drafts prose within a
          clinician-authored structure and explicit validation rules.
        </p>
        <Link className="evidence-cta" href="/">
          Open the live clinician flow
        </Link>
      </header>

      <section aria-labelledby="proof-heading" className="evidence-section">
        <div>
          <p className="eyebrow">What the product enforces</p>
          <h2 id="proof-heading">Five controls in the live workflow</h2>
        </div>
        <ol className="evidence-list">
          {evidence.map((item, index) => (
            <li key={item.title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="demo-heading" className="evidence-demo">
        <p className="eyebrow">Demo path</p>
        <h2 id="demo-heading">A reviewable, end-to-end interaction</h2>
        <p>
          Load a validator-approved English or Spanish example in the clinician
          flow, review each narration beat, test a proposed override, then
          approve to prepare and play the narration. The page demonstrates the
          gate before any parent-facing delivery step.
        </p>
      </section>

      <section aria-labelledby="references-heading" className="evidence-references">
        <p className="eyebrow">Clinical background</p>
        <h2 id="references-heading">PubMed references</h2>
        <p>
          These studies informed the problem space around children&apos;s
          needle-related procedures. They are background reading, not claims of
          a clinical outcome for this product.
        </p>
        <ul>
          <li>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/30284240/"
              rel="noreferrer"
              target="_blank"
            >
              Birnie et al. — Psychological interventions for needle-related
              procedural pain and distress in children and adolescents (2018)
            </a>
          </li>
          <li>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/35463010/"
              rel="noreferrer"
              target="_blank"
            >
              Ryu et al. — Effects of Virtual Reality Education on Procedural
              Pain and Anxiety During Venipuncture in Children: A Randomized
              Clinical Trial (2022)
            </a>
          </li>
        </ul>
      </section>

      <p className="evidence-note">
        Preludio is output-only patient education. It makes no claim about pain,
        anxiety, distress, cooperation, diagnosis, or treatment outcome.
      </p>
    </main>
  );
}
