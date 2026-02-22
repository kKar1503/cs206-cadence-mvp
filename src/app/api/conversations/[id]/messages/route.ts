import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// GET /api/conversations/[id]/messages - Get all messages in a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    // Verify user is part of this conversation
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get all messages in the conversation
    const messages = await db.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Mark unread messages as read
    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser,
        listingId: conversation.listingId,
      },
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message in a conversation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { content } = await req.json() as { content: string };

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Verify user is part of this conversation
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Create the message
    const message = await db.message.create({
      data: {
        content: content.trim(),
        conversationId,
        senderId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Update conversation's updatedAt timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
