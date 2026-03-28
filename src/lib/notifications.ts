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

/**
 * Notify all followers of a user about a new listing.
 */
export async function notifyFollowers(
  sellerId: string,
  sellerName: string,
  listingId: string,
  listingTitle: string,
) {
  const followers = await db.follow.findMany({
    where: { followingId: sellerId },
    select: { followerId: true },
  });

  if (followers.length === 0) return;

  return db.notification.createMany({
    data: followers.map((f) => ({
      userId: f.followerId,
      type: "NEW_LISTING_FROM_FOLLOWED" as NotificationType,
      message: `${sellerName} listed a new item: "${listingTitle}"`,
      listingId,
    })),
  });
}
