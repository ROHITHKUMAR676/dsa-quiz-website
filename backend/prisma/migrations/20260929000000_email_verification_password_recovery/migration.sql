CREATE TYPE "AuthChallengePurpose" AS ENUM ('REGISTRATION', 'PASSWORD_RESET');

ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "emailVerified" = true;

CREATE TABLE "AuthChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" "AuthChallengePurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendingRegistration" JSONB,
    "resetTokenHash" TEXT,
    "resetExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthChallenge_email_purpose_key" ON "AuthChallenge"("email", "purpose");
CREATE INDEX "AuthChallenge_expiresAt_idx" ON "AuthChallenge"("expiresAt");
