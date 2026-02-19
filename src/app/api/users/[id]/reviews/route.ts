import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : undefined;

    // Check user exists
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        _count: {
          select: { listings: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all reviews for accurate stats, then slice for the response
    const allReviews = await db.review.findMany({
      where: { sellerId: id },
      include: {
        reviewer: {
          select: { id: true, name: true, image: true },
        },
        listing: {
          select: { id: true, title: true, artist: true, images: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute aggregate stats from full set
    const totalReviews = allReviews.length;
    const averageRating =
      totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: allReviews.filter((r) => r.rating === star).length,
    }));

    // Apply limit to returned reviews only
    const reviews = limit !== undefined ? allReviews.slice(0, limit) : allReviews;

    return NextResponse.json({
      seller: user,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingBreakdown,
        totalListings: user._count.listings,
      },
      reviews,
    });
  } catch (error) {
    console.error("Error fetching seller reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
