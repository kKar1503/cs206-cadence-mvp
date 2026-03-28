import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { createNotification, notifyFavoriters } from "@/lib/notifications";

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
      shippingCost?: number;
      platformFee?: number;
      buyerFee?: number;
      sellerFee?: number;
      sellerPayout?: number;
      shippingAddress1?: string;
      shippingAddress2?: string;
      shippingFloor?: string;
      shippingUnit?: string;
      shippingPostalCode?: string;
    };

    const { listingId, orderNumber, shippingCost, platformFee, buyerFee, sellerFee, sellerPayout, shippingAddress1, shippingAddress2, shippingFloor, shippingUnit, shippingPostalCode } = body;

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
        amount: listing.price + (shippingCost ?? 0) + (buyerFee ?? 0),
        shippingCost: shippingCost ?? null,
        platformFee: platformFee ?? null,
        buyerFee: buyerFee ?? null,
        sellerFee: sellerFee ?? null,
        sellerPayout: sellerPayout ?? null,
        shippingAddress1: shippingAddress1 ?? null,
        shippingAddress2: shippingAddress2 ?? null,
        shippingFloor: shippingFloor ?? null,
        shippingUnit: shippingUnit ?? null,
        shippingPostalCode: shippingPostalCode ?? null,
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

    // Send notifications (fire-and-forget)
    const listingTitle = order.listing.title;
    Promise.all([
      createNotification({
        userId: listing.sellerId,
        type: "LISTING_SOLD",
        message: `Your listing "${listingTitle}" was sold!`,
        listingId,
        orderId: order.id,
      }),
      createNotification({
        userId: session.user.id,
        type: "ORDER_CONFIRMED",
        message: `Your order for "${listingTitle}" is confirmed!`,
        listingId,
        orderId: order.id,
      }),
      notifyFavoriters(
        listingId,
        session.user.id,
        "FAVORITED_LISTING_SOLD",
        `A listing you favorited "${listingTitle}" was just sold`,
        order.id,
      ),
    ]).catch(console.error);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
