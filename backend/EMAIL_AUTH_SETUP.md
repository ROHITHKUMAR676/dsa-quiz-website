# Email verification and password recovery

Registration and password recovery send verification codes through Gmail SMTP using `sendAuthCode()`. Codes expire after 10 minutes, are stored as keyed hashes, allow up to five incorrect attempts, and have a 60-second resend cooldown.

## Gmail SMTP setup

Enable 2-Step Verification on the sending Google account and create an App Password under Google Account > Security > 2-Step Verification > App passwords. Configure these backend environment variables in local `backend/.env` and in the production backend service:

- `GMAIL_USER`: the Gmail address used to send messages.
- `GMAIL_APP_PASSWORD`: the Google App Password (not the account password).

Production startup requires both values. Keep them on the backend only; never add them to frontend/Vite variables. Remove obsolete email provider variables from the backend deployment settings.

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

To exercise the flows, register using an address at `ALLOWED_EMAIL_DOMAIN`, retrieve the code from that inbox, and complete verification. Then sign out, use **Forgot Password?**, verify the recovery code, set a new password, and sign in with it. Incorrect, expired, or reused codes should be rejected. Both flows require Gmail SMTP credentials and database connectivity.
