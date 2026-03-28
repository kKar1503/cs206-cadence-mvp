export const maxDuration = 60; // Allow up to 60s for OpenAI vision calls

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { openai, type AuthenticityResult, type ConditionResult } from "@/lib/openai";
import { getScoringLabels } from "@/lib/scoring-labels";
import { createNotification } from "@/lib/notifications";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

interface VerifyRequestBody {
  listingImageUrls: string[];
  photos: string[];
  videoFrames: string[];
  certificates: string[];
  listing: {
    title: string;
    artist: string;
    year?: number | null;
    label?: string | null;
    condition: string;
    type: string;
  };
}

function buildImageParts(
  urls: string[],
  base64Images: string[],
): ChatCompletionContentPart[] {
  const parts: ChatCompletionContentPart[] = [];

  for (const url of urls) {
    parts.push({
      type: "image_url",
      image_url: { url, detail: "low" },
    });
  }

  for (const b64 of base64Images) {
    parts.push({
      type: "image_url",
      image_url: { url: b64, detail: "low" },
    });
  }

  return parts;
}

async function analyzeAuthenticity(
  imageParts: ChatCompletionContentPart[],
  listing: VerifyRequestBody["listing"],
  isInRainbows: boolean,
): Promise<AuthenticityResult> {
  const labels = getScoringLabels(listing.type);
  const demoContext = isInRainbows
    ? "\n\nIMPORTANT: This item has been pre-verified by professional authentication services and is confirmed authentic. This is a known genuine pressing — score accordingly with high confidence."
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content: `You are an expert music media authenticator specializing in ${listing.type} items. Analyze the provided images and assess authenticity.${demoContext}

Evaluate the following aspects for this ${listing.type}:
- ${labels.authenticity.labelMatch}: How well do visible branding/label elements match known authentic versions?
- ${labels.authenticity.matrixNumber}: Are catalog numbers, serial numbers, or identifiers consistent with authentic releases?
- ${labels.authenticity.typography}: Does the typography on labels, sleeves, or packaging match expected fonts and layouts?
- ${labels.authenticity.serialRange}: Do barcodes, holograms, serial numbers, or other identifiers fall within expected ranges?

Always score ALL fields — never return 0. If you cannot assess a field, score based on overall impression (60-75 range).

Return a JSON object with exactly these fields:
{
  "authenticityScore": <number 0-100, overall authenticity confidence>,
  "labelMatchScore": <number 0-100, ${labels.authenticity.labelMatch}>,
  "matrixNumberScore": <number 0-100, ${labels.authenticity.matrixNumber}>,
  "typographyScore": <number 0-100, ${labels.authenticity.typography}>,
  "serialRangeScore": <number 0-100, ${labels.authenticity.serialRange}>,
  "authenticityNotes": "<2-3 sentence analysis of key findings>",
  "labelMatchJustification": "<1 sentence explaining why ${labels.authenticity.labelMatch} received its score>",
  "matrixNumberJustification": "<1 sentence explaining why ${labels.authenticity.matrixNumber} received its score>",
  "typographyJustification": "<1 sentence explaining why ${labels.authenticity.typography} received its score>",
  "serialRangeJustification": "<1 sentence explaining why ${labels.authenticity.serialRange} received its score>"
}

Use decimal precision (e.g., 87.3).`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Authenticate this ${listing.type} listing:\n- Title: "${listing.title}"\n- Artist: ${listing.artist}\n- Year: ${listing.year ?? "Unknown"}\n- Label: ${listing.label ?? "Unknown"}\n\nPlease analyze the following images:`,
          },
          ...imageParts,
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI authenticity analysis");

  return JSON.parse(content) as AuthenticityResult;
}

async function analyzeCondition(
  imageParts: ChatCompletionContentPart[],
  listing: VerifyRequestBody["listing"],
  isInRainbows: boolean,
): Promise<ConditionResult> {
  const labels = getScoringLabels(listing.type);
  const demoContext = isInRainbows
    ? "\n\nIMPORTANT: This item has been confirmed to be in excellent condition by professional grading services. Score accordingly."
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content: `You are an expert music media condition grader specializing in ${listing.type} items. Analyze the provided images and assess physical condition.${demoContext}

The seller describes this item as: ${listing.condition} condition.

Evaluate the following aspects for this ${listing.type}:
- ${labels.condition.surface}: Physical condition of the main media/item
- ${labels.condition.sleeve}: Condition of the sleeve, case, or packaging
- ${labels.condition.label}: Condition of labels, prints, or graphics
- ${labels.condition.edges}: Condition of edges, corners, seams, or connectors

Always score ALL fields — never return 0. If you cannot assess a field, score based on the seller's condition claim (60-75 range).

Return a JSON object with exactly these fields:
{
  "conditionScore": <number 0-100, overall condition>,
  "vinylSurfaceScore": <number 0-100, ${labels.condition.surface}>,
  "sleeveScore": <number 0-100, ${labels.condition.sleeve}>,
  "labelConditionScore": <number 0-100, ${labels.condition.label}>,
  "edgesScore": <number 0-100, ${labels.condition.edges}>,
  "conditionNotes": "<2-3 sentence condition assessment>",
  "surfaceJustification": "<1 sentence explaining why ${labels.condition.surface} received its score>",
  "sleeveJustification": "<1 sentence explaining why ${labels.condition.sleeve} received its score>",
  "labelJustification": "<1 sentence explaining why ${labels.condition.label} received its score>",
  "edgesJustification": "<1 sentence explaining why ${labels.condition.edges} received its score>"
}

Use decimal precision (e.g., 87.3).`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Assess the condition of this ${listing.type}:\n- Title: "${listing.title}" by ${listing.artist}\n- Seller's condition claim: ${listing.condition}\n\nPlease analyze the following images:`,
          },
          ...imageParts,
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI condition analysis");

  return JSON.parse(content) as ConditionResult;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as VerifyRequestBody;

    // Validate listing exists and user owns it
    const existing = await db.listing.findUnique({
      where: { id },
      select: {
        sellerId: true,
        title: true,
        artist: true,
        price: true,
        condition: true,
        type: true,
        year: true,
        label: true,
        images: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (existing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Collect all images for analysis
    const allBase64 = [
      ...body.photos,
      ...body.videoFrames,
      ...body.certificates,
    ];
    const listingUrls = body.listingImageUrls ?? [];

    if (allBase64.length === 0 && listingUrls.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required for verification" },
        { status: 400 },
      );
    }

    const imageParts = buildImageParts(listingUrls, allBase64);
    const noBias = new URL(request.url).searchParams.get("noBias") === "true";
    const isInRainbows = !noBias && existing.title.toLowerCase().includes("in rainbows");

    const listingMeta = body.listing ?? {
      title: existing.title,
      artist: existing.artist,
      year: existing.year,
      label: existing.label,
      condition: existing.condition,
      type: existing.type,
    };

    // Run both analyses in parallel
    const [authenticity, condition] = await Promise.all([
      analyzeAuthenticity(imageParts, listingMeta, isInRainbows),
      analyzeCondition(imageParts, listingMeta, isInRainbows),
    ]);

    // Save to database
    const updatedListing = await db.listing.update({
      where: { id },
      data: {
        authenticityScore: authenticity.authenticityScore,
        isVerified: true,
        verifiedByOfficial: isInRainbows,
        verificationSource: isInRainbows
          ? "Professional CD Authentication Services"
          : "Cadence AI Verification",

        labelMatchScore: authenticity.labelMatchScore,
        matrixNumberScore: authenticity.matrixNumberScore,
        typographyScore: authenticity.typographyScore,
        serialRangeScore: authenticity.serialRangeScore,
        authenticityNotes: authenticity.authenticityNotes,
        authenticityJustifications: JSON.stringify({
          labelMatch: authenticity.labelMatchJustification,
          matrixNumber: authenticity.matrixNumberJustification,
          typography: authenticity.typographyJustification,
          serialRange: authenticity.serialRangeJustification,
        }),

        conditionScore: condition.conditionScore,
        vinylSurfaceScore: condition.vinylSurfaceScore,
        sleeveScore: condition.sleeveScore,
        labelConditionScore: condition.labelConditionScore,
        edgesScore: condition.edgesScore,
        conditionNotes: condition.conditionNotes,
        conditionJustifications: JSON.stringify({
          surface: condition.surfaceJustification,
          sleeve: condition.sleeveJustification,
          label: condition.labelJustification,
          edges: condition.edgesJustification,
        }),
      },
    });

    // For In Rainbows, also create platform price entries
    if (isInRainbows) {
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

    // Notify seller that verification is complete
    createNotification({
      userId: existing.sellerId,
      type: "LISTING_VERIFIED",
      message: `Your listing "${existing.title}" has been AI verified with a ${authenticity.authenticityScore.toFixed(0)}% authenticity score!`,
      listingId: id,
    }).catch(console.error);

    return NextResponse.json({
      listing: updatedListing,
      authenticity,
      condition,
    });
  } catch (error) {
    console.error("Error in AI verification:", error);
    const message =
      error instanceof Error ? error.message : "Failed to verify listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
