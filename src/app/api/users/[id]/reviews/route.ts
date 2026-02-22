import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sellerId } = await params;
    const body = await request.json() as {
      rating: number;
      comment: string | null;
      listingId: string;
    };

    const { rating, comment, listingId } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if user is trying to review themselves
    if (session.user.id === sellerId) {
      return NextResponse.json(
        { error: "You cannot review yourself" },
        { status: 400 }
      );
    }

    // Check if listing exists
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Verify the listing belongs to the seller being reviewed
    if (listing.sellerId !== sellerId) {
      return NextResponse.json(
        { error: "Listing does not belong to this seller" },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this seller for this listing
    const existingReview = await db.review.findFirst({
      where: {
        reviewerId: session.user.id,
        sellerId,
        listingId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this seller for this listing" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await db.review.create({
      data: {
        rating,
        comment: comment ?? "",
        reviewerId: session.user.id,
        sellerId,
        listingId,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, image: true },
        },
        listing: {
          select: { id: true, title: true, artist: true },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
