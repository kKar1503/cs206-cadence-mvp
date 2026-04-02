import { db } from "@/server/db";

type DealType = "UNDERPRICED" | "FAIR" | "OVERPRICED";

/**
 * Generates fake price comparison data for a newly created listing.
 * Randomly assigns a deal type, then generates platform prices that
 * are consistent with that deal classification.
 */
export async function generateFakePriceComparison(
  listingId: string,
  listingPrice: number,
) {
  // Weighted random: 35% great deal, 40% fair, 25% overpriced
  const roll = Math.random();
  const dealType: DealType =
    roll < 0.35 ? "UNDERPRICED" : roll < 0.75 ? "FAIR" : "OVERPRICED";

  // Generate a percentage that fits the deal type
  const percentage = generatePercentage(dealType);

  // Generate a "last updated" date 1-2 days ago
  const now = new Date();
  const hoursAgo = 24 + Math.random() * 24; // 24-48 hours ago
  const priceDataUpdated = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  // Compute a fake "market average" from the listing price and deal type
  const marketAvg = computeMarketAverage(listingPrice, dealType, percentage);

  // Generate platform-specific price ranges around the market average
  const discogs = generatePlatformRange(marketAvg, "Discogs");
  const ebay = generatePlatformRange(marketAvg, "eBay");

  // Determine Cadence label based on deal type
  const cadenceLabel =
    dealType === "OVERPRICED"
      ? "High"
      : "Optimal";

  await db.$transaction([
    // Update the listing with price label info
    db.listing.update({
      where: { id: listingId },
      data: {
        priceLabel: dealType,
        pricePercentage: percentage,
        priceDataUpdated,
      },
    }),
    // Create platform price entries
    db.platformPrice.createMany({
      data: [
        {
          platform: "Discogs",
          minPrice: discogs.min,
          maxPrice: discogs.max,
          priceLabel: discogs.label,
          listingId,
        },
        {
          platform: "eBay",
          minPrice: ebay.min,
          maxPrice: ebay.max,
          priceLabel: ebay.label,
          listingId,
        },
        {
          platform: "Cadence",
          avgPrice: listingPrice,
          priceLabel: cadenceLabel,
          listingId,
        },
      ],
    }),
  ]);
}

function generatePercentage(dealType: DealType): number {
  // Return a realistic percentage for each deal type
  switch (dealType) {
    case "UNDERPRICED":
      // 5-25% below market
      return round(5 + Math.random() * 20);
    case "FAIR":
      // 1-6% within market
      return round(1 + Math.random() * 5);
    case "OVERPRICED":
      // 10-35% above market
      return round(10 + Math.random() * 25);
  }
}

function computeMarketAverage(
  listingPrice: number,
  dealType: DealType,
  percentage: number,
): number {
  // If UNDERPRICED, market avg is higher than listing price
  // If OVERPRICED, market avg is lower than listing price
  // If FAIR, market avg is close to listing price
  switch (dealType) {
    case "UNDERPRICED":
      return listingPrice * (1 + percentage / 100);
    case "OVERPRICED":
      return listingPrice * (1 - percentage / 100);
    case "FAIR":
      // Randomly slightly above or below
      return listingPrice * (Math.random() > 0.5 ? 1 + percentage / 200 : 1 - percentage / 200);
  }
}

function generatePlatformRange(
  marketAvg: number,
  platform: string,
): { min: number; max: number; label: string } {
  // Each platform gets a range around the market average with some variance
  // eBay tends to be slightly higher than Discogs
  const platformBias = platform === "eBay" ? 1.05 : 1.0;
  const biasedAvg = marketAvg * platformBias;

  // Range spread: 15-40% of the average
  const spreadFactor = 0.15 + Math.random() * 0.25;
  const halfSpread = biasedAvg * spreadFactor / 2;

  const min = round(biasedAvg - halfSpread);
  const max = round(biasedAvg + halfSpread);

  // Determine label based on how the range relates to market
  const label = platform === "eBay" && platformBias > 1 ? "Slightly High" : "Fair";

  return { min: Math.max(1, min), max: Math.max(min + 1, max), label };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
