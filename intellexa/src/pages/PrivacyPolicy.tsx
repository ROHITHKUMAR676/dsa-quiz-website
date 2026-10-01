import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "1. Information we collect",
    content: (
      <>
        <p>When you use Intellexa, we collect your name and Rajalakshmi Engineering College email address from Google, plus student profile details you provide such as department, year, register number, phone number, preferred programming language, and optional profile photo.</p>
        <p>We also record platform activity needed to provide the service, including quizzes attempted, answers and results, scores, points, streaks, badges, leaderboard participation, and account activity such as sign-in and last-active times. Basic technical request and security logs may also be generated when you use the website.</p>
      </>
    ),
  },
  {
    title: "2. Why we use this information",
    content: <p>We use this information to create and secure accounts, confirm college eligibility, provide quizzes and personalized progress, calculate results and rewards, display leaderboards, maintain the service, and investigate abuse or technical problems. We do not use it to sell advertising profiles.</p>,
  },
  {
    title: "3. Google Sign-In",
    content: <p>If you choose Google Sign-In, Google provides identity information such as your name, email address, and a stable account identifier so Intellexa can authenticate you and associate your account. We use Google user data only for authentication and account functionality. We do not sell Google user data or use it for advertising. Google Sign-In is separate from the Gmail service used to deliver account emails; Intellexa does not use your Google account to read your inbox or contacts.</p>,
  },
  {
    title: "4. Authentication and account data",
    content: <p>Intellexa uses Google Sign-In as its authentication method. We retain the Google account identifier needed to recognize your account. A signed session token is stored in your browser to keep you signed in and is sent to the service when you make authenticated requests. You can sign out to remove the locally stored session.</p>,
  },
  {
    title: "5. Storage and protection",
    content: <p>Account and quiz records are stored in the application database, and an optional profile photo is stored with account data. The website and its API use HTTPS in transit. We apply access controls and security measures intended to limit access to authorized application operations. No online service can guarantee absolute security, so please use a unique password and keep verification codes private.</p>,
  },
  {
    title: "6. Email verification and password resets",
    content: <p>Intellexa does not send email verification or password-reset messages. Google verifies the account as part of Google Sign-In, and Intellexa does not request access to your inbox.</p>,
  },
  {
    title: "7. Sharing with third parties",
    content: <p>We do not sell personal information. We share only what is needed with service providers that help operate the platform, such as Google for sign-in and the providers hosting the website, API, and database. These providers process information to provide their services. We may also disclose information when required by law or when necessary to protect users and the service.</p>,
  },
  {
    title: "8. Your choices and privacy requests",
    content: <p>You may review or update profile details through the account features available in Intellexa and use the password-reset flow to regain access. You can request access to, correction of, or deletion of your account information by contacting the Intellexa project administrators through Rajalakshmi Engineering College’s usual student or project support channel. We may need to verify your identity before acting on a request.</p>,
  },
  {
    title: "9. Data retention",
    content: <p>We keep account and quiz records while an account is active and for as long as they are needed to operate the platform, preserve quiz results and leaderboard integrity, or meet security and legal obligations. You may ask the project administrators to delete your account; some records may need to be retained where required for legitimate operational or legal reasons.</p>,
  },
  {
    title: "10. Changes to this policy",
    content: <p>We may update this policy as Intellexa’s features or data practices change. The latest version will be published on this page with its updated date. Please review this page periodically for material changes.</p>,
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-dvh relative overflow-hidden px-4 py-8 sm:py-12">
      <div className="absolute inset-0 bg-grid-glow pointer-events-none" />
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-neon-blue/10 blur-3xl pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-ink-dim hover:text-neon-cyan transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>

        <header className="glass-strong mt-6 rounded-2xl p-6 sm:p-10">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-aurora shadow-glow">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">Intellexa · DSA Quiz Platform</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink-dim">This policy explains what information Intellexa uses and how it supports your college quiz account.</p>
          <p className="mt-5 text-xs text-ink-faint">Last updated: October 1, 2026</p>
        </header>

        <div className="mt-5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4 text-sm leading-6 text-ink-dim">
          <span className="font-semibold text-ink">Google user data:</span> Google account information is used only to authenticate you and provide account functionality. It is not sold.
        </div>

        <div className="mt-5 space-y-3">
          {sections.map(({ title, content }) => (
            <section key={title} className="glass-strong rounded-xl p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-ink-dim">{content}</div>
            </section>
          ))}
        </div>

        <footer className="pb-8 pt-6 text-center text-xs text-ink-faint">
          Questions about this policy? Contact the Intellexa project administrators through your college’s usual student or project support channel.
        </footer>
      </div>
    </main>
  );
}
