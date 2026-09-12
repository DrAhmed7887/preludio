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

## Local development

```sh
npm install
npm run dev
```

```sh
npm run guard
npm test
```
