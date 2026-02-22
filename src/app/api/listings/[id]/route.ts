import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import type { ListingType, Condition } from "@prisma/generated";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
        platformPrices: {
          orderBy: {
            platform: "asc",
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Increment view count
    await db.listing.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Fetch related listings: same type or same artist, exclude current
    const related = await db.listing.findMany({
      where: {
        id: { not: id },
        isSold: false,
        OR: [
          { type: listing.type },
          { artist: listing.artist },
        ],
      },
      include: {
        seller: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    return NextResponse.json({ listing, related });
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as {
      title: string;
      artist: string;
      description: string;
      type: string;
      condition: string;
      price: number;
      year?: number;
      genre?: string;
      label?: string;
      images: string[];
    };

    // Check if listing exists and user owns it
    const existing = await db.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update listing
    const updatedListing = await db.listing.update({
      where: { id },
      data: {
        title: body.title,
        artist: body.artist,
        description: body.description,
        type: body.type as ListingType,
        condition: body.condition as Condition,
        price: body.price,
        year: body.year,
        genre: body.genre,
        label: body.label,
        images: JSON.stringify(body.images),
      },
    });

    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}
