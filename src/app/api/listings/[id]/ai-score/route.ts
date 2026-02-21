import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(
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
      authenticityScore: number;
      isVerified: boolean;
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

    // Update listing with AI score
    const updatedListing = await db.listing.update({
      where: { id },
      data: {
        authenticityScore: body.authenticityScore,
        isVerified: body.isVerified,
      },
    });

    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    console.error("Error updating AI score:", error);
    return NextResponse.json(
      { error: "Failed to update AI score" },
      { status: 500 }
    );
  }
}
