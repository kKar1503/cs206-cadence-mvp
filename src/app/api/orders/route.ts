import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// GET /api/orders - Get user's orders
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await db.order.findMany({
      where: {
        buyerId: session.user.id,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            artist: true,
            images: true,
            imageUrl: true,
            price: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      listingId: string;
      orderNumber: string;
    };

    const { listingId, orderNumber } = body;

    if (!listingId || !orderNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get listing details
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        price: true,
        sellerId: true,
        isSold: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.isSold) {
      return NextResponse.json(
        { error: "Listing already sold" },
        { status: 400 }
      );
    }

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        buyerId: session.user.id,
        listingId: listing.id,
        sellerId: listing.sellerId,
        amount: listing.price,
        status: "processing",
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            artist: true,
            images: true,
            imageUrl: true,
            price: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Mark listing as sold
    await db.listing.update({
      where: { id: listingId },
      data: { isSold: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
