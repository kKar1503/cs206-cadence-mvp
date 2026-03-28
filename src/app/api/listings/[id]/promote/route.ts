import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as { days?: number };
    const days = body.days ?? 7; // Default 7-day promotion

    // Check if listing exists and user owns it
    const existing = await db.listing.findUnique({
      where: { id },
      select: { sellerId: true, isSold: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (existing.isSold) {
      return NextResponse.json(
        { error: "Cannot promote a sold listing" },
        { status: 400 },
      );
    }

    const promotedUntil = new Date();
    promotedUntil.setDate(promotedUntil.getDate() + days);

    const updatedListing = await db.listing.update({
      where: { id },
      data: {
        isPromoted: true,
        promotedUntil,
      },
    });

    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    console.error("Error promoting listing:", error);
    return NextResponse.json(
      { error: "Failed to promote listing" },
      { status: 500 },
    );
  }
}
