import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  geocodePostalCode,
  haversineDistance,
  getShippingCost,
} from "@/lib/shipping";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      buyerPostalCode: string;
      listingId: string;
    };

    const { buyerPostalCode, listingId } = body;

    if (!buyerPostalCode || !listingId) {
      return NextResponse.json(
        { error: "Postal code and listing ID are required" },
        { status: 400 },
      );
    }

    // Validate Singapore postal code format (6 digits)
    if (!/^\d{6}$/.test(buyerPostalCode)) {
      return NextResponse.json(
        { error: "Invalid Singapore postal code (must be 6 digits)" },
        { status: 400 },
      );
    }

    // Look up listing → seller → cached coordinates
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: {
        seller: {
          select: {
            latitude: true,
            longitude: true,
            postalCode: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    const sellerLat = listing.seller.latitude;
    const sellerLon = listing.seller.longitude;

    if (sellerLat == null || sellerLon == null) {
      // Seller has no cached coordinates — use default SMU location
      // This shouldn't happen with seeded data but handles edge cases
      return NextResponse.json({
        cost: 5.0,
        tier: "Standard",
        estimate: "3-5 business days",
        distance: null,
        buyerAddress: null,
      });
    }

    // Geocode buyer's postal code via OneMap API
    const buyerGeo = await geocodePostalCode(buyerPostalCode);

    if (!buyerGeo) {
      return NextResponse.json(
        { error: "Could not find address for this postal code" },
        { status: 400 },
      );
    }

    // Calculate distance using Haversine formula
    const distance = haversineDistance(
      sellerLat,
      sellerLon,
      buyerGeo.lat,
      buyerGeo.lon,
    );

    const shipping = getShippingCost(distance);

    return NextResponse.json({
      cost: shipping.cost,
      tier: shipping.tier,
      estimate: shipping.estimate,
      distance: Math.round(distance * 10) / 10, // 1 decimal place
      buyerAddress: buyerGeo.address,
      // Structured address fields from OneMap for auto-fill
      blockNo: buyerGeo.blockNo,
      roadName: buyerGeo.roadName,
      building: buyerGeo.building,
    });
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return NextResponse.json(
      { error: "Failed to calculate shipping cost" },
      { status: 500 },
    );
  }
}
