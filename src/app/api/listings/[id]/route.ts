import { NextResponse } from "next/server";
import { db } from "@/server/db";

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
