import type { Badge, LeaderboardEntry, NotificationItem, Quiz, UserProfile } from "../types";

export const badgeCatalog: Badge[] = [
  { id: "night-owl", name: "Night Owl", description: "Complete a quiz after midnight", icon: "moon", earned: true, earnedAt: "2026-06-10", rarity: "rare" },
  { id: "early-bird", name: "Early Bird", description: "Complete a quiz before 8 AM", icon: "sunrise", earned: false, rarity: "rare" },
  { id: "bug-hunter", name: "Bug Hunter", description: "Pass all hidden test cases first try", icon: "bug", earned: true, earnedAt: "2026-06-14", rarity: "epic" },
  { id: "quiz-master", name: "Quiz Master", description: "Score 100% on 5 quizzes", icon: "brain", earned: false, rarity: "epic" },
  { id: "dsa-warrior", name: "DSA Warrior", description: "Complete 50 daily quizzes", icon: "swords", earned: false, rarity: "legendary" },
  { id: "frontend-ninja", name: "Frontend Ninja", description: "Top 3 in a WebDev quiz", icon: "code", earned: true, earnedAt: "2026-05-28", rarity: "rare" },
  { id: "consistency", name: "Consistency", description: "Maintain a 7-day streak", icon: "flame", earned: true, earnedAt: "2026-06-20", rarity: "common" },
];

export const currentUser: UserProfile = {
  id: "u-1029",
  name: "Aarav Krishnan",
  email: "aarav.k@college.edu",
  department: "Computer Science",
  year: "3rd Year",
  registerNumber: "21CS1042",
  phone: "+91 98765 43210",
  avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Aarav&backgroundColor=1A2038",
  bio: "DSA enthusiast. Breaking things and fixing them faster.",
  preferredLanguage: "C++",
  role: "student",
  level: 14,
  xp: 3240,
  xpToNextLevel: 4000,
  coins: 1280,
  streak: 9,
  rank: 7,
  highestRank: 3,
  tier: "Elite",
  accuracy: 87,
  questionsSolved: 342,
  fastestResponseSec: 3.2,
  badges: badgeCatalog,
};

export const quizzes: Quiz[] = [
  {
    id: "q-101",
    title: "React Hooks Deep Dive",
    description: "Test your mastery of useState, useEffect, and custom hooks.",
    difficulty: "Medium",
    category: "WebDev",
    timeLimitPerQuestion: 20,
    status: "live",
    participants: 128,
    questions: [
      { id: "q1", question: "Which hook lets you synchronize a component with an external system?", options: ["useState", "useEffect", "useMemo", "useRef"], correctAnswer: 1, points: 100 },
      { id: "q2", question: "What does useCallback return?", options: ["A memoized value", "A memoized function", "A ref object", "A state setter"], correctAnswer: 1, points: 100 },
      { id: "q3", question: "Which hook is used to avoid unnecessary re-renders of expensive computations?", options: ["useEffect", "useMemo", "useContext", "useReducer"], correctAnswer: 1, points: 100 },
      { id: "q4", question: "What is the correct dependency array to run an effect only once?", options: ["No array", "[]", "[undefined]", "[null]"], correctAnswer: 1, points: 100 },
      { id: "q5", question: "Which hook gives direct access to a DOM node?", options: ["useRef", "useState", "useMemo", "useId"], correctAnswer: 0, points: 100 },
    ],
  },
  {
    id: "q-102",
    title: "Arrays & Two Pointers",
    description: "Classic DSA patterns every warrior must know.",
    difficulty: "Hard",
    category: "DSA",
    timeLimitPerQuestion: 25,
    status: "upcoming",
    scheduledAt: "2026-07-10T18:00:00",
    participants: 0,
    questions: [],
  },
  {
    id: "q-103",
    title: "CSS Flexbox & Grid",
    description: "Layout fundamentals, gotchas, and modern patterns.",
    difficulty: "Easy",
    category: "WebDev",
    timeLimitPerQuestion: 15,
    status: "completed",
    participants: 210,
    questions: [],
  },
  {
    id: "q-104",
    title: "Graph Traversals",
    description: "BFS, DFS, and shortest path essentials.",
    difficulty: "Hard",
    category: "DSA",
    timeLimitPerQuestion: 30,
    status: "upcoming",
    scheduledAt: "2026-07-12T17:00:00",
    participants: 0,
    questions: [],
  },
];

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, previousRank: 1, userId: "u-1", name: "Meera Iyer", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Meera&backgroundColor=1A2038", department: "CSE", xp: 8920, points: 12400, streak: 21, badges: 14, tier: "Grandmaster" },
  { rank: 2, previousRank: 3, userId: "u-2", name: "Rohan Das", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Rohan&backgroundColor=1A2038", department: "IT", xp: 8410, points: 11800, streak: 15, badges: 12, tier: "Champion" },
  { rank: 3, previousRank: 2, userId: "u-3", name: "Sanya Kapoor", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Sanya&backgroundColor=1A2038", department: "CSE", xp: 8105, points: 11250, streak: 18, badges: 13, tier: "Champion" },
  { rank: 4, previousRank: 4, userId: "u-4", name: "Vikram Rao", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Vikram&backgroundColor=1A2038", department: "ECE", xp: 7650, points: 10600, streak: 9, badges: 10, tier: "Legend" },
  { rank: 5, previousRank: 6, userId: "u-5", name: "Diya Sharma", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Diya&backgroundColor=1A2038", department: "CSE", xp: 7300, points: 10120, streak: 12, badges: 9, tier: "Legend" },
  { rank: 6, previousRank: 5, userId: "u-6", name: "Kabir Singh", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Kabir&backgroundColor=1A2038", department: "IT", xp: 6980, points: 9700, streak: 7, badges: 8, tier: "Elite" },
  { rank: 7, previousRank: 9, userId: "u-1029", name: "Aarav Krishnan", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Aarav&backgroundColor=1A2038", department: "CSE", xp: 3240, points: 9210, streak: 9, badges: 8, tier: "Elite" },
  { rank: 8, previousRank: 7, userId: "u-8", name: "Priya Menon", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Priya&backgroundColor=1A2038", department: "AI/DS", xp: 6540, points: 9080, streak: 5, badges: 7, tier: "Elite" },
  { rank: 9, previousRank: 8, userId: "u-9", name: "Arjun Nair", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Arjun&backgroundColor=1A2038", department: "CSE", xp: 6200, points: 8650, streak: 4, badges: 6, tier: "Gold" },
  { rank: 10, previousRank: 10, userId: "u-10", name: "Ishita Verma", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Ishita&backgroundColor=1A2038", department: "IT", xp: 5980, points: 8300, streak: 6, badges: 6, tier: "Gold" },
];

export const notifications: NotificationItem[] = [
  { id: "n1", type: "quiz", title: "New quiz is live", message: "React Hooks Deep Dive just went live. Jump in now.", time: "2m ago", read: false },
  { id: "n2", type: "rank", title: "You entered the Top 10", message: "You climbed to rank #7 on the leaderboard.", time: "1h ago", read: false },
  { id: "n3", type: "badge", title: "Badge unlocked", message: "You earned the Consistency badge.", time: "5h ago", read: false },
  { id: "n4", type: "streak", title: "Streak maintained", message: "9-day streak. Keep the fire burning.", time: "1d ago", read: true },
  { id: "n6", type: "level", title: "Level up!", message: "You reached Level 14.", time: "2d ago", read: true },
];

export const adminStats = {
  totalUsers: 1284,
  todaysQuiz: "React Hooks Deep Dive",
  liveParticipants: 128,
  completedQuizzes: 46,
  pendingScheduled: 5,
  weeklyActiveUsers: 812,
};

export const weeklyActivity = [
  { day: "Mon", users: 420, submissions: 210 },
  { day: "Tue", users: 512, submissions: 260 },
  { day: "Wed", users: 480, submissions: 240 },
  { day: "Thu", users: 610, submissions: 320 },
  { day: "Fri", users: 705, submissions: 390 },
  { day: "Sat", users: 390, submissions: 180 },
  { day: "Sun", users: 340, submissions: 150 },
];

export const difficultyBreakdown = [
  { name: "Easy", value: 38, color: "#34D399" },
  { name: "Medium", value: 42, color: "#FBBF24" },
  { name: "Hard", value: 20, color: "#F87171" },
];
