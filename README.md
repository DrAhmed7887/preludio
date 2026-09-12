# Preludio

Preludio is a governed WhatsApp voice-story agent that helps clinicians prepare
children for procedures. A nurse, child-life specialist, or physician chooses a
procedure, age tier, language, and concern archetype. The system renders committed
clinical guidance into a clinician-approved voice story for a parent to share.

This is output-only patient-education material. It performs no measurement,
screening, or diagnosis, and makes no claim about pain, anxiety, distress, or
cooperation.

The WhatsApp number uses the Twilio sandbox; it is not a Business account. Hospital
patient portals and EHR order screens are deployment targets, not existing
integrations.

## Demo scope and parent link

One procedure is implemented: blood draw. Adding another procedure is one
clinician-authored JSON file in `procedures/`; it is not model-authored clinical
content. Live generation is unreliable at tiers 3 and 6, so the demonstration loads
seeded, validator-approved English and Spanish tier-10 stories. The Twilio delivery
path is implemented and authenticates, but there is no funded WhatsApp sender, so
delivery is demonstrated in-app.

After clinician approval, a parent receives a read-and-listen link using an opaque
random identifier. It has no login or editable controls, expires after 24 hours, and
shows only the approved narration and its voice note. It contains a first name or
nickname only—no patient data.

## Hackathon delivery limitation

For the demonstration, narration media is held in memory for the active session and
the Cloud Run service is pinned warm. A Twilio sandbox send is started immediately
after clinician approval, while that media remains available. Production deployment
would use object storage for durable public media; this project does not include it.

## Local development

```sh
npm install
npm run dev
```

```sh
npm run guard
npm test
```
