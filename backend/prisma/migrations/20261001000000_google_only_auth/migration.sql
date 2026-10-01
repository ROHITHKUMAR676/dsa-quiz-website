-- Google Sign-In is now the only supported authentication method.
-- Keep user rows, Google subjects, roles, and quiz history intact.
DROP TABLE IF EXISTS "AuthChallenge";
DROP TYPE IF EXISTS "AuthChallengePurpose";

ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";
ALTER TABLE "User" DROP COLUMN IF EXISTS "authProvider";

DROP TYPE IF EXISTS "AuthProvider";
