import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getRecommendations } from "@/lib/recommendations";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recommendations, profile } = await getRecommendations(session.user.id, 12);

    // Extract top taste summary for the UI
    const topGenres = Object.entries(profile.genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key);
    const topArtists = Object.entries(profile.artists)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => key);

    return NextResponse.json({
      recommendations,
      taste: {
        topGenres,
        topArtists,
        totalSignals: profile.totalSignals,
      },
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}
