import { PrismaClient, Role, BadgeRuleType } from "@prisma/client";
import { ADMIN_EMAIL, ADMIN_NAME } from "../src/config/admin.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      fullName: ADMIN_NAME,
      role: Role.ADMIN,
    },
    create: {
      fullName: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: Role.ADMIN,
      department: "Platform",
      settings: { create: {} },
    },
  });

  await prisma.user.updateMany({
    where: { role: Role.ADMIN, email: { not: ADMIN_EMAIL } },
    data: { role: Role.STUDENT },
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
