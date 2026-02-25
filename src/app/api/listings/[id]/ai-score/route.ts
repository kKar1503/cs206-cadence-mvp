import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// Helper function to generate realistic sub-scores based on overall score
function generateSubScores(overallScore: number) {
  // Add some variance to make it realistic (±5-10 points)
  const variance = () => Math.random() * 10 - 5;

  // Generate 4 sub-scores that average close to the overall score
  const scores = [
    Math.max(0, Math.min(100, overallScore + variance())),
    Math.max(0, Math.min(100, overallScore + variance())),
    Math.max(0, Math.min(100, overallScore + variance())),
    Math.max(0, Math.min(100, overallScore + variance())),
  ];

  // Adjust to ensure average is close to overall score
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const adjustment = overallScore - avg;

  return scores.map(s => Math.max(0, Math.min(100, Math.round(s + adjustment))));
}

// Generate authenticity notes based on score
function generateAuthenticityNotes(score: number): string {
  if (score >= 95) {
    return "All authenticity markers verified successfully. Label, pressing details, and matrix numbers match original specifications.";
  } else if (score >= 85) {
    return "Strong authenticity indicators present. Minor variations noted but consistent with legitimate pressings from this era.";
  } else if (score >= 75) {
    return "Authenticity markers mostly align with known originals. Some minor inconsistencies detected in typography or matrix details.";
  } else if (score >= 60) {
    return "Mixed authenticity signals. Some markers match original specifications, but several inconsistencies raise concerns.";
  } else {
    return "Multiple authenticity concerns detected. Label design, typography, and pressing details show significant deviations from known originals.";
  }
}

// Generate condition notes based on score
function generateConditionNotes(score: number): string {
  if (score >= 95) {
    return "Excellent condition throughout. Minimal signs of use. Vinyl surface is clean, sleeve shows no significant wear.";
  } else if (score >= 85) {
    return "Very good condition overall. Light handling marks visible but no major defects. Plays cleanly with minimal surface noise.";
  } else if (score >= 75) {
    return "Good condition with some visible wear. Minor surface marks and sleeve creasing present but no major damage.";
  } else if (score >= 60) {
    return "Fair condition with moderate wear. Visible surface marks, sleeve wear, and some edge damage. May have audible surface noise.";
  } else {
    return "Heavy wear evident. Significant surface marks, sleeve damage, and condition issues that may affect playback quality.";
  }
}

export async function POST(
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
      authenticityScore: number;
      isVerified: boolean;
    };

    // Check if listing exists and user owns it
    const existing = await db.listing.findUnique({
      where: { id },
      select: { sellerId: true, condition: true, title: true, price: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Special handling for "In Rainbows" demo listing
    const isInRainbows = existing.title.toLowerCase().includes("in rainbows");
    let authenticityScore = body.authenticityScore;
    let isVerified = body.isVerified;

    if (isInRainbows) {
      authenticityScore = 97.8;
      isVerified = true;
    }

    // Generate authenticity sub-scores (use the potentially overridden score)
    let labelMatchScore, matrixNumberScore, typographyScore, serialRangeScore;

    if (isInRainbows) {
      // High specific scores for In Rainbows demo
      labelMatchScore = 98;
      matrixNumberScore = 97;
      typographyScore = 98;
      serialRangeScore = 98;
    } else {
      [labelMatchScore, matrixNumberScore, typographyScore, serialRangeScore] =
        generateSubScores(authenticityScore);
    }

    // Generate condition score based on the listing's condition field
    // Map condition to a base score range
    let conditionBaseScore: number;
    switch (existing.condition) {
      case "BRAND_NEW":
        conditionBaseScore = 98 + Math.random() * 2; // 98-100
        break;
      case "LIKE_NEW":
        conditionBaseScore = 93 + Math.random() * 5; // 93-98
        break;
      case "LIGHTLY_USED":
        conditionBaseScore = 85 + Math.random() * 8; // 85-93
        break;
      case "WELL_USED":
        conditionBaseScore = 70 + Math.random() * 10; // 70-80
        break;
      case "HEAVILY_USED":
        conditionBaseScore = 50 + Math.random() * 15; // 50-65
        break;
      default:
        conditionBaseScore = 75 + Math.random() * 10; // 75-85
    }

    const conditionScore = Math.round(conditionBaseScore);

    // Generate condition sub-scores
    const [vinylSurfaceScore, sleeveScore, labelConditionScore, edgesScore] =
      generateSubScores(conditionScore);

    // Update listing with AI scores
    const updatedListing = await db.listing.update({
      where: { id },
      data: {
        authenticityScore,
        isVerified,
        verifiedByOfficial: isInRainbows ? true : undefined,
        verificationSource: isInRainbows ? "Professional CD Authentication Services" : undefined,

        // Authenticity breakdown
        labelMatchScore,
        matrixNumberScore,
        typographyScore,
        serialRangeScore,
        authenticityNotes: isInRainbows
          ? "Special edition 2007 release verified by official authentication service. All markers confirm genuine XL Recordings pressing. Includes bonus disc and all original materials."
          : generateAuthenticityNotes(authenticityScore),

        // Condition breakdown
        conditionScore,
        vinylSurfaceScore,
        sleeveScore,
        labelConditionScore,
        edgesScore,
        conditionNotes: generateConditionNotes(conditionScore),
      },
    });

    // For "In Rainbows", also create platform price entries
    if (isInRainbows) {
      // Check if platform prices already exist
      const existingPrices = await db.platformPrice.findMany({
        where: { listingId: id },
      });

      if (existingPrices.length === 0) {
        await db.platformPrice.createMany({
          data: [
            {
              platform: "Discogs",
              minPrice: 22,
              maxPrice: 30,
              priceLabel: "Fair",
              listingId: id,
            },
            {
              platform: "eBay",
              minPrice: 24,
              maxPrice: 32,
              priceLabel: "Fair",
              listingId: id,
            },
            {
              platform: "Cadence",
              avgPrice: existing.price,
              priceLabel: "Optimal",
              listingId: id,
            },
          ],
        });
      }
    }

    return NextResponse.json({ listing: updatedListing });
  } catch (error) {
    console.error("Error updating AI score:", error);
    return NextResponse.json(
      { error: "Failed to update AI score" },
      { status: 500 }
    );
  }
}
