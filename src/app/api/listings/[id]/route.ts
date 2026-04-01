import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { notifyFavoriters } from "@/lib/notifications";
import { buildTasteProfile } from "@/lib/recommendations";
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

    // Fetch related listings — taste-ranked if user is authenticated
    const session = await auth();
    let related;

    if (session?.user?.id) {
      // Taste-based: fetch more candidates, score, rank, take top 4
      const profile = await buildTasteProfile(session.user.id);
      const candidates = await db.listing.findMany({
        where: {
          id: { not: id },
          isSold: false,
          OR: [
            { type: listing.type },
            { artist: listing.artist },
            ...(listing.genre ? [{ genre: listing.genre }] : []),
          ],
        },
        include: { seller: { select: { name: true } } },
        take: 20,
      });

      if (profile.totalSignals > 0) {
        // Score by taste match
        related = candidates
          .map((c) => {
            let score = 0;
            if (profile.artists[c.artist]) score += 30;
            if (c.genre && profile.genres[c.genre]) score += 25;
            if (c.year) {
              const decade = `${Math.floor(c.year / 10) * 10}s`;
              if (profile.decades[decade]) score += 15;
            }
            if (profile.types[c.type]) score += 10;
            if (c.label && profile.labels[c.label]) score += 10;
            return { ...c, _score: score };
          })
          .sort((a, b) => b._score - a._score)
          .slice(0, 4)
          .map(({ _score, ...rest }) => rest);
      } else {
        related = candidates.slice(0, 4);
      }
    } else {
      // Fallback: simple type/artist match
      related = await db.listing.findMany({
        where: {
          id: { not: id },
          isSold: false,
          OR: [
            { type: listing.type },
            { artist: listing.artist },
          ],
        },
        include: { seller: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      });
    }

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
      tracklist?: Array<{ side: string; tracks: string[] }> | null;
    };

    // Check if listing exists and user owns it
    const existing = await db.listing.findUnique({
      where: { id },
      select: { sellerId: true, price: true, title: true },
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
        tracklist: body.tracklist ? JSON.stringify(body.tracklist) : null,
      },
    });

    // Notify favoriters of changes (fire-and-forget)
    if (body.price !== existing.price) {
      notifyFavoriters(
        id,
        session.user.id,
        "PRICE_CHANGED",
        `Price changed on "${body.title}" — now $${body.price.toFixed(2)}`,
      ).catch(console.error);
    } else {
      notifyFavoriters(
        id,
        session.user.id,
        "LISTING_UPDATED",
        `A listing you favorited "${body.title}" was updated`,
      ).catch(console.error);
    }

    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const listing = await db.listing.findUnique({
      where: { id },
      select: { sellerId: true, title: true, isSold: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (listing.isSold) {
      return NextResponse.json({ error: "Cannot delete a sold listing" }, { status: 400 });
    }

    await db.listing.delete({ where: { id } });

    return NextResponse.json({ message: "Listing deleted" });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
