import { db } from "@/server/db";
import type { NotificationType } from "../../generated/prisma";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  listingId?: string;
  orderId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  return db.notification.create({ data: params });
}

/**
 * Notify all users who favorited a listing (excluding a specific user).
 * Used for price changes, listing sold, listing updated, etc.
 */
export async function notifyFavoriters(
  listingId: string,
  excludeUserId: string,
  type: NotificationType,
  message: string,
  orderId?: string,
) {
  const favorites = await db.favorite.findMany({
    where: { listingId, userId: { not: excludeUserId } },
    select: { userId: true },
  });

  if (favorites.length === 0) return;

  return db.notification.createMany({
    data: favorites.map((fav) => ({
      userId: fav.userId,
      type,
      message,
      listingId,
      orderId,
    })),
  });
}
