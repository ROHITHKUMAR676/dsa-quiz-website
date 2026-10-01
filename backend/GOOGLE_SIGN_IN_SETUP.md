# Google Sign-In setup

Google Sign-In uses Google Identity Services in the frontend and verifies the returned ID token in the backend. The app accepts only verified Google Workspace accounts with the exact hosted-domain claim `rajalakshmi.edu.in`.

## Google Cloud configuration

1. In Google Cloud Console, create or select a project and configure the OAuth consent screen for your organization.
2. Create an OAuth 2.0 Client ID with application type **Web application**.
3. Under **Authorized JavaScript origins**, add each origin that serves the frontend, for example:
   - `http://localhost:5173`
   - The exact production Vercel origin, such as `https://<your-project>.vercel.app`
   - Any production custom domain used by the frontend
4. No redirect URI is required for the JavaScript callback flow used here.
5. Keep the OAuth client ID. The client secret is not used for Google Identity Services ID-token verification and must not be added to Vercel or Render for this feature.

Google's `hd` chooser hint helps users pick a college account, but it is not the access control. The backend independently verifies the signed token, audience, verified email, and exact `hd` claim.

## Environment variables

The OAuth client ID is public, but the backend needs it to validate the token audience. Set the same client ID in both deployments:

- **Render backend:** `GOOGLE_CLIENT_ID=<web OAuth client ID>`
- **Vercel frontend:** `VITE_GOOGLE_CLIENT_ID=<same web OAuth client ID>`
- **Local frontend:** add `VITE_GOOGLE_CLIENT_ID=<same web OAuth client ID>` to `intellexa/.env.local`.

Do not add `GOOGLE_CLIENT_SECRET` for this ID-token flow. Do not add any OAuth secret to Vercel. Redeploy Render and Vercel after setting their variables.

## Account behavior

Google sign-in creates a `STUDENT` account with an incomplete profile when no matching user exists. The existing profile setup will collect the remaining required student details. A verified Google account with an existing email safely links to that user while preserving the database role and any existing password login. A Google subject already linked to a different email is rejected.
