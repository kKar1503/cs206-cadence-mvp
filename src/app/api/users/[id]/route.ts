import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        listings: {
          where: { isSold: false },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            artist: true,
            price: true,
            images: true,
            imageUrl: true,
            type: true,
            condition: true,
            isVerified: true,
            verifiedByOfficial: true,
            views: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            listings: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
