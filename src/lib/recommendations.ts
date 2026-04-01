import { db } from "@/server/db";

// ─── Types ───────────────────────────────────────────────────────────────────

type FrequencyMap = Record<string, number>;

export interface TasteProfile {
  artists: FrequencyMap;
  genres: FrequencyMap;
  decades: FrequencyMap;
  types: FrequencyMap;
  labels: FrequencyMap;
  totalSignals: number;
}

export interface ScoredListing {
  id: string;
  title: string;
  artist: string;
  price: number;
  images: string;
  imageUrl: string | null;
  type: string;
  condition: string;
  genre: string | null;
  year: number | null;
  label: string | null;
  views: number;
  isVerified: boolean;
  authenticityScore: number | null;
  priceLabel: string | null;
  pricePercentage: number | null;
  seller: { name: string | null };
  score: number;
  matchReason: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDecade(year: number | null): string | null {
  if (!year) return null;
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function incrementMap(map: FrequencyMap, key: string | null, weight: number) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + weight;
}

// ─── Build Taste Profile ─────────────────────────────────────────────────────

export async function buildTasteProfile(userId: string): Promise<TasteProfile> {
  const [favorites, orders] = await Promise.all([
    db.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          select: { artist: true, genre: true, year: true, type: true, label: true },
        },
      },
    }),
    db.order.findMany({
      where: { buyerId: userId },
      include: {
        listing: {
          select: { artist: true, genre: true, year: true, type: true, label: true },
        },
      },
    }),
  ]);

  const profile: TasteProfile = {
    artists: {},
    genres: {},
    decades: {},
    types: {},
    labels: {},
    totalSignals: 0,
  };

  // Favorites weighted 1x
  for (const fav of favorites) {
    const l = fav.listing;
    incrementMap(profile.artists, l.artist, 1);
    incrementMap(profile.genres, l.genre, 1);
    incrementMap(profile.decades, getDecade(l.year), 1);
    incrementMap(profile.types, l.type, 1);
    incrementMap(profile.labels, l.label, 1);
    profile.totalSignals++;
  }

  // Purchases weighted 2x (stronger signal)
  for (const order of orders) {
    const l = order.listing;
    incrementMap(profile.artists, l.artist, 2);
    incrementMap(profile.genres, l.genre, 2);
    incrementMap(profile.decades, getDecade(l.year), 2);
    incrementMap(profile.types, l.type, 2);
    incrementMap(profile.labels, l.label, 2);
    profile.totalSignals++;
  }

  return profile;
}

// ─── Score a Single Listing ──────────────────────────────────────────────────

function scoreListing(
  listing: {
    artist: string;
    genre: string | null;
    year: number | null;
    type: string;
    label: string | null;
    views: number;
    isVerified: boolean;
  },
  profile: TasteProfile,
): { score: number; matchReason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Artist match (30 points max)
  const artistFreq = profile.artists[listing.artist] ?? 0;
  if (artistFreq > 0) {
    const artistWeight = Math.min(artistFreq / profile.totalSignals, 1);
    score += 30 * (0.5 + 0.5 * artistWeight);
    reasons.push(`You like ${listing.artist}`);
  }

  // Genre match (25 points max)
  const genreFreq = listing.genre ? (profile.genres[listing.genre] ?? 0) : 0;
  if (genreFreq > 0) {
    const genreWeight = Math.min(genreFreq / profile.totalSignals, 1);
    score += 25 * (0.5 + 0.5 * genreWeight);
    if (reasons.length === 0) reasons.push(`Because you like ${listing.genre}`);
  }

  // Decade match (15 points max)
  const decade = getDecade(listing.year);
  const decadeFreq = decade ? (profile.decades[decade] ?? 0) : 0;
  if (decadeFreq > 0) {
    const decadeWeight = Math.min(decadeFreq / profile.totalSignals, 1);
    score += 15 * (0.5 + 0.5 * decadeWeight);
    if (reasons.length === 0) reasons.push(`From the ${decade}`);
  }

  // Type match (10 points max)
  const typeFreq = profile.types[listing.type] ?? 0;
  if (typeFreq > 0) {
    const typeWeight = Math.min(typeFreq / profile.totalSignals, 1);
    score += 10 * (0.5 + 0.5 * typeWeight);
  }

  // Label match (10 points max)
  const labelFreq = listing.label ? (profile.labels[listing.label] ?? 0) : 0;
  if (labelFreq > 0) {
    const labelWeight = Math.min(labelFreq / profile.totalSignals, 1);
    score += 10 * (0.5 + 0.5 * labelWeight);
  }

  // Popularity boost (5 points max)
  const popularityScore = Math.min(listing.views / 20, 1) * 5;
  score += popularityScore;

  // Verified boost (5 points max)
  if (listing.isVerified) {
    score += 5;
  }

  return {
    score: Math.round(score * 10) / 10,
    matchReason: reasons[0] ?? "Recommended for you",
  };
}

// ─── Get Recommendations ─────────────────────────────────────────────────────

export async function getRecommendations(
  userId: string,
  limit = 12,
): Promise<{ recommendations: ScoredListing[]; profile: TasteProfile }> {
  const profile = await buildTasteProfile(userId);

  // If user has no taste data, return popular listings
  if (profile.totalSignals === 0) {
    const popular = await db.listing.findMany({
      where: { isSold: false, sellerId: { not: userId } },
      include: { seller: { select: { name: true } } },
      orderBy: { views: "desc" },
      take: limit,
    });

    return {
      recommendations: popular.map((l) => ({
        id: l.id,
        title: l.title,
        artist: l.artist,
        price: l.price,
        images: l.images,
        imageUrl: l.imageUrl,
        type: l.type,
        condition: l.condition,
        genre: l.genre,
        year: l.year,
        label: l.label,
        views: l.views,
        isVerified: l.isVerified,
        authenticityScore: l.authenticityScore,
        priceLabel: l.priceLabel,
        pricePercentage: l.pricePercentage,
        seller: l.seller,
        score: 0,
        matchReason: "Popular on Cadence",
      })),
      profile,
    };
  }

  // Get IDs to exclude (user's own listings + already purchased)
  const [ownListings, purchasedOrders] = await Promise.all([
    db.listing.findMany({
      where: { sellerId: userId },
      select: { id: true },
    }),
    db.order.findMany({
      where: { buyerId: userId },
      select: { listingId: true },
    }),
  ]);

  const excludeIds = new Set([
    ...ownListings.map((l) => l.id),
    ...purchasedOrders.map((o) => o.listingId),
  ]);

  // Fetch all unsold listings
  const candidates = await db.listing.findMany({
    where: { isSold: false },
    include: { seller: { select: { name: true } } },
  });

  // Score and rank
  const scored: ScoredListing[] = candidates
    .filter((l) => !excludeIds.has(l.id))
    .map((l) => {
      const { score, matchReason } = scoreListing(l, profile);
      return {
        id: l.id,
        title: l.title,
        artist: l.artist,
        price: l.price,
        images: l.images,
        imageUrl: l.imageUrl,
        type: l.type,
        condition: l.condition,
        genre: l.genre,
        year: l.year,
        label: l.label,
        views: l.views,
        isVerified: l.isVerified,
        authenticityScore: l.authenticityScore,
        priceLabel: l.priceLabel,
        pricePercentage: l.pricePercentage,
        seller: l.seller,
        score,
        matchReason,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { recommendations: scored, profile };
}
