import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  try {
    const listings = await db.listing.findMany({
      where: {
        isSold: false, // Only show available listings
      },
      include: {
        seller: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
