# Mark Netlify Landing Page

This folder is self-contained and can be deployed as its own Netlify project.

## What it does

- Serves `index.html`, `styles.css`, `app.js`, and `hana.mp4`
- Accepts waitlist submissions through `/.netlify/functions/subscribe`
- Appends each valid submission to the Google Sheet `15CPNwma6Ejzy0J44SFGtVpgp6vEg2f916tFQIZcM8NI`

## Required Netlify environment variables

Copy the values from `.env.example` into the Netlify site settings and set the real secrets there.

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEET_TAB`
- `SUBSCRIBE_ALLOWED_ORIGIN`

## Google Sheets setup

1. Create a Google Cloud service account with the Google Sheets API enabled.
2. Generate a JSON key for that service account.
3. Copy the `client_email` value into `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
4. Copy the `private_key` value into `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
5. Share the spreadsheet with the service account email as an editor.
6. Ensure the target tab exists. The function writes three columns in order:
   - `submitted_at`
   - `email`
   - `source`

## Security choices

- Google credentials stay server-side in the Netlify function.
- The form posts only to a same-origin Netlify function.
- The function checks origin and referer headers when present.
- A hidden honeypot field filters common bots.
- Simple IP-based rate limiting reduces repeated abuse.
- Netlify headers set a restrictive CSP and related browser security headers.
