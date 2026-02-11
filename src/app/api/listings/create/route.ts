import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { ListingType, Condition } from "@prisma/generated";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      title: string;
      artist: string;
      description: string;
      type: string;
      condition: string;
      price: number;
      images: string[];
      year?: number;
      genre?: string;
      label?: string;
    };

    const { title, artist, description, type, condition, price, images, year, genre, label } = body;

    // Validation
    if (!title || !artist || !description || !type || !condition || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create listing
    const listing = await db.listing.create({
      data: {
        title,
        artist,
        description,
        type: type as ListingType,
        condition: condition as Condition,
        price,
        images: JSON.stringify(images ?? []),
        imageUrl: images[0] ?? null, // First image for backward compatibility
        year,
        genre,
        label,
        sellerId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Listing created successfully",
        listing,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
