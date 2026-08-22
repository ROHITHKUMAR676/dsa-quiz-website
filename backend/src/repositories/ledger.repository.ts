import { Prisma, RewardSource } from "@prisma/client";
import { prisma } from "../config/prisma.js";

interface LedgerEntryInput {
  userId: string;
  amount: number;
  source: RewardSource;
  referenceId: string;
}

/**
 * Awards XP atomically: writes the immutable ledger row AND bumps
 * User.xp in the same transaction. Idempotent via the
 * @@unique([userId, source, referenceId]) constraint on XpTransaction - a
 * retried/duplicate call (e.g. finalization re-run) is a safe no-op
 * (returns null) rather than double-crediting the user (spec sections 17, 32).
 */
export async function awardXp(input: LedgerEntryInput) {
  if (input.amount === 0) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.xpTransaction.create({ data: input });
      await tx.user.update({ where: { id: input.userId }, data: { xp: { increment: input.amount } } });
      return transaction;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}

/** Same idempotency guarantee as awardXp, for coins. */
export async function awardCoins(input: LedgerEntryInput) {
  if (input.amount === 0) return null;
  try {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.coinTransaction.create({ data: input });
      await tx.user.update({ where: { id: input.userId }, data: { coins: { increment: input.amount } } });
      return transaction;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}
