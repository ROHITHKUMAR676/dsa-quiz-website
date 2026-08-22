# Intellexa - WebDev x DSA Arena

A premium, gamified frontend for the Intellexa technical club: dark futuristic UI, glassmorphism, XP, streaks, animated quizzes, leaderboards, and admin tooling.

## Tech Stack

React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion + React Router + Recharts + Lucide Icons + canvas-confetti

## Getting Started

```bash
npm install
npm run dev
```

Open the printed local URL, usually http://localhost:5173.

To build for production:

```bash
npm run build
npm run preview
```

## Flow

1. Splash screen on first visit, then login with backend authentication.
2. Student: profile setup, dashboard, tutorial, quiz attempts, leaderboard, profile, notifications, and settings.
3. Admin: dashboard, create quiz, scheduled quizzes, participants, leaderboard, analytics, and settings.

Student and admin application data is loaded from the backend API.

Fully responsive: sidebar nav collapses to a bottom tab bar plus slide-in drawer on mobile.
