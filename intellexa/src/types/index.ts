export type Role = "admin" | "student";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  registerNumber: string;
  phone: string;
  avatar: string;
  bio: string;
  preferredLanguage: string;
  role: Role;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  streak: number;
  rank: number;
  highestRank: number;
  tier: "Bronze" | "Silver" | "Gold" | "Elite" | "Legend" | "Grandmaster" | "Champion";
  accuracy: number;
  questionsSolved: number;
  fastestResponseSec: number;
  badges: Badge[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  questions: QuizQuestion[];
  timeLimitPerQuestion: number;
  status: "live" | "upcoming" | "completed";
  scheduledAt?: string;
  participants: number;
}

export interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  userId: string;
  name: string;
  avatar: string;
  department: string;
  xp: number;
  points: number;
  streak: number;
  badges: number;
  tier: UserProfile["tier"];
}

export interface NotificationItem {
  id: string;
  type: "quiz" | "badge" | "level" | "rank" | "streak" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}
