CREATE TABLE "UserAvatar" (
    "userId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'image/webp',
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserAvatar_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserAvatar"
ADD CONSTRAINT "UserAvatar_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
