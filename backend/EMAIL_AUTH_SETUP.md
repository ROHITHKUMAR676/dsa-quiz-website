# Email verification and password recovery

Registration and password recovery send email through the Gmail API over HTTPS. This works on Render's free web service because it does not use SMTP ports. Gmail API standard usage is currently available at no additional cost; Google applies per-user send limits and API quotas.

## Google Cloud setup

1. Create or select a project in Google Cloud Console and enable the **Gmail API**.
2. Configure the OAuth consent screen. Use **Internal** only if the sender account belongs to a Google Workspace organization where you can create internal apps; otherwise use **External** and add the sender account as a test user while setting up.
3. Create an OAuth client ID and secret. Add `https://developers.google.com/oauthplayground` as an authorized redirect URI if you use OAuth 2.0 Playground to generate the refresh token.
4. In OAuth 2.0 Playground settings, enable **Use your own OAuth credentials**, enter the OAuth client ID and secret, request `https://www.googleapis.com/auth/gmail.send`, authorize as the same Gmail account used for `GMAIL_USER`, and exchange the code for tokens. Copy the refresh token.
5. If the consent screen is External and remains in **Testing**, Google refresh tokens for Gmail scopes expire after 7 days. For continuous production use, move the consent app to production and complete any Google verification required for the `gmail.send` scope, or use an eligible Workspace Internal app.

## Backend environment variables

Set these in local `backend/.env` and in the backend service's Render **Environment** settings:

- `GMAIL_USER`: the Gmail address authorized above.
- `GMAIL_API_CLIENT_ID`: OAuth client ID.
- `GMAIL_API_CLIENT_SECRET`: OAuth client secret.
- `GMAIL_API_REFRESH_TOKEN`: refresh token with the `gmail.send` scope.

Keep all four values on the backend only. Remove the old `GMAIL_APP_PASSWORD` setting; it is no longer used. Redeploy the backend after changing Render variables. Never put OAuth secrets or refresh tokens in Vite/frontend variables or commit them to source control.

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

Registration and password recovery still require database connectivity. Verification codes expire after 10 minutes, allow up to five incorrect attempts, and have a 60-second resend cooldown.
