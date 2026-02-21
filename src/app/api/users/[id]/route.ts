import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { hash, compare } from "bcryptjs";

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

    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as {
      name?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const updates: { name?: string; password?: string } = {};

    // Name update
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (trimmed.length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      if (trimmed.length > 50) {
        return NextResponse.json({ error: "Name must be 50 characters or fewer" }, { status: 400 });
      }
      updates.name = trimmed;
    }

    // Password change
    if (body.newPassword !== undefined || body.currentPassword !== undefined) {
      if (!body.currentPassword || !body.newPassword) {
        return NextResponse.json(
          { error: "Both current and new password are required" },
          { status: 400 }
        );
      }
      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({ where: { id }, select: { password: true } });
      if (!user?.password) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isValid = await compare(body.currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      updates.password = await hash(body.newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: updates,
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
