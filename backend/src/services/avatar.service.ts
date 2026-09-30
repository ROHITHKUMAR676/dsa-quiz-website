import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { sanitizeUser } from "../utils/sanitize.js";

const MAX_AVATAR_BYTES = 512 * 1024;

export async function saveAvatar(userId: string, image: Buffer) {
  if (image.byteLength > MAX_AVATAR_BYTES) {
    throw new ApiError(413, "Profile images must be 512 KB or smaller", "AVATAR_TOO_LARGE");
  }
  if (
    image.byteLength < 12 ||
    image.toString("ascii", 0, 4) !== "RIFF" ||
    image.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new ApiError(415, "Choose a valid image file", "INVALID_AVATAR");
  }
  const data = Uint8Array.from(image);

  const user = await prisma.$transaction(async (tx) => {
    const imageRecord = await tx.userAvatar.upsert({
      where: { userId },
      create: { userId, contentType: "image/webp", data },
      update: { contentType: "image/webp", data },
      select: { updatedAt: true },
    });
    return tx.user.update({
      where: { id: userId },
      data: { avatar: `/api/auth/avatar/${userId}?v=${imageRecord.updatedAt.getTime()}` },
    });
  });

  return sanitizeUser(user);
}

export async function getAvatar(userId: string) {
  const avatar = await prisma.userAvatar.findUnique({
    where: { userId },
    select: { contentType: true, data: true, updatedAt: true },
  });
  if (!avatar) throw new ApiError(404, "Profile image not found", "AVATAR_NOT_FOUND");
  return avatar;
}
