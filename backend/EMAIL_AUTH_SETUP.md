# Email verification and password recovery

Registration and password recovery share `sendAuthCode()`. In production it uses the Resend HTTP API; local development can continue using Gmail SMTP. Codes expire after 10 minutes, are stored as keyed hashes, allow up to five incorrect attempts, and have a 60-second resend cooldown.

## Render production setup

In the Render dashboard, open the backend web service's **Environment** settings and add:

- `NODE_ENV`: `production` (Render does not set this Node-specific variable automatically).
- `RESEND_API_KEY`: a Resend API key with permission to send mail.
- `EMAIL_FROM`: a sender on a domain verified in Resend, such as `Intellexa <auth@your-verified-domain>`.

Save and redeploy the backend. Do not add the key to frontend/Vite variables. Production startup requires both variables and will not fall back to Gmail. This repository has no Render YAML/deployment manifest; configure these on the existing Render service.

Once Resend is working, remove `GMAIL_USER` and `GMAIL_APP_PASSWORD` from Render if they were previously set. They are only used as the local-development fallback and are ignored when Resend is configured.

## Local Gmail setup

For local development without Resend variables, enable 2-Step Verification on the sending Google account and create an App Password under Google Account > Security > 2-Step Verification > App passwords. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `backend/.env`; do not use the normal Google password. If Resend variables are present locally, Resend takes precedence.

## Database and local run

Apply the existing challenge/email-verification migration, then generate Prisma Client and start the backend:

```sh
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Start the frontend in a second terminal with `cd intellexa && npm install && npm run dev`. Set `VITE_API_URL` if the backend is not at `http://localhost:4000`.

To exercise the flows, register using an address at `ALLOWED_EMAIL_DOMAIN`, retrieve the code from that inbox, and complete verification. Then sign out, use **Forgot Password?**, verify the recovery code, set a new password, and sign in with it. Incorrect, expired, or reused codes should be rejected. Production email requires a valid Resend API key and verified sender; local Gmail delivery requires a valid Gmail App Password. Both require database connectivity.
