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
