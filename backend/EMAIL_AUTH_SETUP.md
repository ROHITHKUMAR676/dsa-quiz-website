# Email verification and password recovery

The backend sends registration and password recovery codes through Gmail SMTP. Codes expire after 10 minutes, are stored as keyed hashes, allow up to five incorrect attempts, and have a 60-second resend cooldown.

## Gmail setup

1. Sign in to the Google account that will send Intellexa email and enable 2-Step Verification in Google Account security settings.
2. Open Google Account > Security > 2-Step Verification > App passwords. Create an app password for this backend and copy the generated password. Google may not show App passwords on managed accounts.
3. Copy `backend/.env.example` to `backend/.env` and set `GMAIL_USER` to the sending Gmail address and `GMAIL_APP_PASSWORD` to the generated app password. Do not use the normal Google account password or commit `.env`.
4. In the deployment provider's backend service settings (Render, Railway, or the provider used for this deployment), add `GMAIL_USER` and `GMAIL_APP_PASSWORD` as backend environment variables, then redeploy. Keep them out of frontend/Vite variables.

## Database and local run

Apply the new challenge and email-verification migration, then regenerate Prisma Client and start the backend:

```sh
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Start the frontend in a second terminal with `cd intellexa && npm install && npm run dev`. Set `VITE_API_URL` if the backend is not at `http://localhost:4000`.

To exercise the flows, register using an address at `ALLOWED_EMAIL_DOMAIN`, retrieve the code from that inbox, and complete verification. Then sign out, use **Forgot Password?**, verify the recovery code, set a new password, and sign in with it. Incorrect, expired, or reused codes should be rejected. SMTP delivery requires valid Gmail app-password configuration and database connectivity.
