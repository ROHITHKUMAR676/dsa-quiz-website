# Intellexa — WebDev × DSA Arena

A premium, gamified frontend for the Intellexa technical club: dark futuristic UI, glassmorphism, neon blue/purple gradients, XP/levels/streaks, animated quizzes, a coding arena with anti-cheat, leaderboards, and full admin tooling.

## Tech Stack
React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion + React Router + Recharts + Lucide Icons + canvas-confetti

## Getting Started

```bash
npm install
npm run dev
```

Open the printed local URL (default http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## Flow
1. **Splash screen** (first visit) → **Login** (Google / college email / demo Admin button)
2. **Student**: forced profile setup → dashboard → first-time interactive tutorial (replayable from Settings)
3. Explore: Dashboard, Coding Arena (quizzes + coding rounds), Quiz attempt (speed-based scoring), Coding editor (anti-cheat tab-switch detection), Leaderboard (podium + rank deltas), Profile (badges, stats, timeline), Notifications, Settings
4. **Admin** (via "Continue as Admin" on login): Dashboard with charts, Create Quiz, Create Coding Challenge, Scheduled Quizzes, Participants, Leaderboard, Analytics, Settings

All data is realistic mock data in `src/data/mockData.ts` — swap in real API calls when ready.

Fully responsive: sidebar nav collapses to a bottom tab bar + slide-in drawer on mobile.
