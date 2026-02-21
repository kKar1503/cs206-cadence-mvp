import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// GET /api/conversations - Get all conversations for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all conversations where user is either user1 or user2
    const conversations = await db.conversation.findMany({
      where: {
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
        listing: {
          select: {
            id: true,
            title: true,
            artist: true,
            images: true,
            imageUrl: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get only the last message for preview
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform conversations to include the other user and last message
    const transformedConversations = conversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0];
      const unreadCount = conv.messages.filter(
        (msg) => !msg.isRead && msg.senderId !== userId
      ).length;

      return {
        id: conv.id,
        otherUser,
        listing: conv.listing,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        unreadCount,
        updatedAt: conv.updatedAt,
        listingId: conv.listingId,
      };
    });

    return NextResponse.json(transformedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get existing conversation with another user
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("Unauthorized: No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { otherUserId: string; listingId: string };
    const { otherUserId, listingId } = body;

    console.log("Creating conversation:", { currentUserId: session.user.id, otherUserId, listingId });

    if (!otherUserId) {
      console.error("Missing otherUserId");
      return NextResponse.json({ error: "otherUserId is required" }, { status: 400 });
    }

    if (!listingId) {
      console.error("Missing listingId");
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    if (otherUserId === session.user.id) {
      console.error("Cannot create conversation with self");
      return NextResponse.json({ error: "Cannot create conversation with yourself" }, { status: 400 });
    }

    const userId = session.user.id;

    // Verify the other user exists
    const userExists = await db.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });

    if (!userExists) {
      console.error("Other user not found:", otherUserId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure user1Id < user2Id for consistency (alphabetical order)
    const [user1Id, user2Id] = [userId, otherUserId].sort();

    console.log("Sorted user IDs:", { user1Id, user2Id });

    // Use findUnique with the unique constraint to get or create conversation
    let conversation = await db.conversation.findUnique({
      where: {
        user1Id_user2Id_listingId: {
          user1Id,
          user2Id,
          listingId,
        },
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

    // Create conversation if it doesn't exist
    if (!conversation) {
      try {
        conversation = await db.conversation.create({
          data: {
            user1Id,
            user2Id,
            listingId,
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
      } catch (createError) {
        // If creation failed due to race condition, try to find it again
        console.log("Create failed, attempting to find existing conversation");
        conversation = await db.conversation.findUnique({
          where: {
            user1Id_user2Id_listingId: {
              user1Id,
              user2Id,
              listingId,
            },
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
          throw createError;
        }
      }
    }

    const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;

    console.log("Conversation created/found:", conversation.id);
    return NextResponse.json({
      id: conversation.id,
      otherUser,
      listingId: conversation.listingId,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create conversation", details: errorMessage },
      { status: 500 }
    );
  }
}
