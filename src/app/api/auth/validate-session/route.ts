import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ valid: false, reason: "no_session" });
    }

    // Check if user still exists in database
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ valid: false, reason: "user_not_found" });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error validating session:", error);
    return NextResponse.json(
      { valid: false, reason: "error" },
      { status: 500 }
    );
  }
}
