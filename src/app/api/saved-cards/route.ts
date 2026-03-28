// WARNING: This endpoint stores and returns raw card details in plaintext.
// This is ONLY acceptable because the entire payment system is a fake/simulated
// prototype for a school project (CS206). All card credentials are fake test data.
// In production, NEVER store raw card numbers — use Stripe, etc.

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedCards = await db.savedCard.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        cardName: true,
        cardType: true,
        last4: true,
        expiryDate: true,
        // NOTE: We intentionally return the full card number here because this
        // is a fake payment system. A real system would NEVER return full card numbers.
        cardNumber: true,
      },
    });

    return NextResponse.json(savedCards);
  } catch (error) {
    console.error("Error fetching saved cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved cards" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      cardNumber: string;
      cardName: string;
      expiryDate: string;
      cardType: string;
    };

    const { cardNumber, cardName, expiryDate, cardType } = body;

    if (!cardNumber || !cardName || !expiryDate || !cardType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const last4 = cardNumber.replace(/\s/g, "").slice(-4);

    // Upsert: replace existing saved card for this user (one card per user for simplicity)
    const existing = await db.savedCard.findFirst({
      where: { userId: session.user.id },
    });

    let savedCard;
    if (existing) {
      savedCard = await db.savedCard.update({
        where: { id: existing.id },
        data: { cardNumber, cardName, expiryDate, cardType, last4 },
      });
    } else {
      savedCard = await db.savedCard.create({
        data: {
          cardNumber,
          cardName,
          expiryDate,
          cardType,
          last4,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(savedCard, { status: 201 });
  } catch (error) {
    console.error("Error saving card:", error);
    return NextResponse.json({ error: "Failed to save card" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const cardId = url.searchParams.get("id");

    if (!cardId) {
      return NextResponse.json(
        { error: "Card ID is required" },
        { status: 400 },
      );
    }

    // Verify the card belongs to the user
    const card = await db.savedCard.findUnique({
      where: { id: cardId },
      select: { userId: true },
    });

    if (card?.userId !== session.user.id) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await db.savedCard.delete({ where: { id: cardId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved card:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 },
    );
  }
}
