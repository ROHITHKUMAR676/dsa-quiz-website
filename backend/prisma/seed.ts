import { PrismaClient, Role, BadgeRuleType } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await hashPassword("Admin@12345");
  const studentPasswordHash = await hashPassword("Student@12345");

  const admin = await prisma.user.upsert({
    where: { email: "admin@intellexa.dev" },
    update: {},
    create: {
      fullName: "Intellexa Admin",
      email: "admin@intellexa.dev",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      department: "Platform",
      settings: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { email: "aarav.k@college.edu" },
    update: {},
    create: {
      fullName: "Aarav Krishnan",
      email: "aarav.k@college.edu",
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      department: "Computer Science",
      year: "3rd Year",
      registerNumber: "21CS1042",
      phone: "+91 98765 43210",
      preferredLanguage: "C++",
      bio: "DSA enthusiast. Breaking things and fixing them faster.",
      avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=Aarav&backgroundColor=1A2038",
      settings: { create: {} },
    },
  });

  await prisma.badge.upsert({
    where: { id: "perfect-score" },
    update: {},
    create: {
      id: "perfect-score",
      name: "Perfect Score",
      description: "Score 100% on a daily quiz.",
      icon: "award",
      category: "quiz",
      ruleType: BadgeRuleType.PERFECT_SCORE,
      ruleConfig: { accuracy: 100, timing: "immediate" },
      xpReward: 0,
      coinReward: 20,
    },
  });

  await prisma.badge.upsert({
    where: { id: "champion" },
    update: {},
    create: {
      id: "champion",
      name: "Champion",
      description: "Finish rank #1 after a daily quiz is finalized.",
      icon: "trophy",
      category: "rank",
      ruleType: BadgeRuleType.CHAMPION,
      ruleConfig: { rank: 1, timing: "finalization" },
      xpReward: 0,
      coinReward: 20,
    },
  });

  await prisma.quiz.upsert({
    where: { id: "daily-quiz-sample" },
    update: {},
    create: {
      id: "daily-quiz-sample",
      title: "Sample Daily Quiz",
      description: "Development seed quiz for Phase 1 setup.",
      category: "WebDev",
      difficulty: "MEDIUM",
      status: "DRAFT",
      timezone: "Asia/Kolkata",
      timeLimit: 600,
      timeLimitPerQuestion: 20,
      maxAttempts: 1,
      createdById: admin.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
