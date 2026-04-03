"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ShieldCheck,
  ShieldAlert,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ShoppingCart,
  Calendar,
  Music,
  Tag,
  ArrowLeft,
  AlertCircle,
  Star,
  Edit,
  Heart,
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
  Megaphone,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { getScoringLabels } from "@/lib/scoring-labels";
import { ConditionGradingGuide } from "@/components/ConditionGradingGuide";
import { ListingBadges } from "@/components/ListingBadges";

interface Seller {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

interface PlatformPrice {
  id: string;
  platform: string;
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
  priceLabel: string | null;
  currency: string;
}

interface Listing {
  id: string;
  title: string;
  artist: string;
  description: string;
  type: string;
  condition: string;
  price: number;
  images: string;
  imageUrl: string | null;
  year: number | null;
  genre: string | null;
  label: string | null;
  isVerified: boolean;
  authenticityScore: number | null;
  isSold: boolean;
  views: number;
  priceLabel: string | null;
  pricePercentage: number | null;
  priceDataUpdated: string | null;
  labelMatchScore: number | null;
  matrixNumberScore: number | null;
  typographyScore: number | null;
  serialRangeScore: number | null;
  authenticityNotes: string | null;
  conditionScore: number | null;
  vinylSurfaceScore: number | null;
  sleeveScore: number | null;
  labelConditionScore: number | null;
  edgesScore: number | null;
  conditionNotes: string | null;
  authenticityJustifications: string | null;
  conditionJustifications: string | null;
  tracklist: string | null;
  isPromoted: boolean;
  createdAt: string;
  seller: Seller;
  platformPrices?: PlatformPrice[];
}

type Justifications = Record<string, string | undefined>;

interface RelatedListing {
  id: string;
  title: string;
  artist: string;
  price: number;
  images: string;
  imageUrl: string | null;
  type: string;
  condition: string;
  seller: { name: string | null };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { id: string; name: string | null; image: string | null };
  listing: { id: string; title: string; artist: string; images: string; imageUrl: string | null };
}

interface SellerStats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: { star: number; count: number }[];
  totalListings: number;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const getConditionLabel = (c: string) => c.replace(/_/g, " ");

const getConditionDescription = (c: string) => {
  const d: Record<string, string> = {
    BRAND_NEW: "Never used. May come with original packaging or tag.",
    LIKE_NEW: "Used once or twice. As good as new.",
    LIGHTLY_USED: "Used with care. Flaws, if any, are barely noticeable.",
    WELL_USED: "Has minor flaws or defects.",
    HEAVILY_USED: "Has obvious signs of use or defects.",
  };
  return d[c] ?? "";
};

const getFirstImage = (images: string, imageUrl: string | null): string => {
  try {
    const p = JSON.parse(images) as string[];
    return p[0] ?? imageUrl ?? "https://placehold.co/600x600/fc6736/ffffff?text=No+Image";
  } catch {
    return imageUrl ?? "https://placehold.co/600x600/fc6736/ffffff?text=No+Image";
  }
};

const getAllImages = (images: string, imageUrl: string | null): string[] => {
  try {
    const p = JSON.parse(images) as string[];
    if (p.length > 0) return p;
  } catch { /* fallback */ }
  if (imageUrl) return [imageUrl];
  return ["https://placehold.co/600x600/fc6736/ffffff?text=No+Image"];
};

const getTypeLabel = (type: string) =>
  ({ VINYL: "Vinyl", CD: "CD", CASSETTE: "Cassette", MERCH: "Merch", EQUIPMENT: "Equipment" }[type] ?? type);

const getPriceLabelInfo = (priceLabel: string | null) => {
  if (!priceLabel) return null;

  switch (priceLabel) {
    case "UNDERPRICED":
      return {
        icon: TrendingDown,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        label: "Great Deal",
        description: "below market average",
      };
    case "OVERPRICED":
      return {
        icon: TrendingUp,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: "Above Market",
        description: "above market average",
      };
    case "FAIR":
      return {
        icon: Minus,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        label: "Fair Price",
        description: "within market average",
      };
    default:
      return null;
  }
};

// Renders 1–5 filled/empty stars
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${px} ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [listing, setListing] = useState<Listing | null>(null);
  const [related, setRelated] = useState<RelatedListing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [showAuthenticityDetails, setShowAuthenticityDetails] = useState(false);
  const [showConditionDetails, setShowConditionDetails] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Listing not found." : "Failed to load listing.");
          return;
        }
        const data = await res.json() as { listing: Listing; related: RelatedListing[] };
        setListing(data.listing);
        setRelated(data.related);
        setAllImages(getAllImages(data.listing.images, data.listing.imageUrl));

        // Fetch seller reviews — cap at 3 for the listing page preview
        try {
          const reviewsRes = await fetch(`/api/users/${data.listing.seller.id}/reviews?limit=3`);
          if (reviewsRes.ok) {
            const reviewData = await reviewsRes.json() as { reviews: Review[]; stats: SellerStats };
            setReviews(reviewData.reviews);
            setSellerStats(reviewData.stats);
          }
        } catch (err) {
          console.error("Failed to fetch seller reviews:", err);
        }
      } catch {
        setError("Failed to load listing.");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchAll();
  }, [id]);

  // Check if listing is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const favorites = await res.json() as Array<{ listingId: string }>;
          setIsFavorited(favorites.some((f) => f.listingId === id));
        }
      } catch (err) {
        console.error("Failed to check favorite status:", err);
      }
    };
    void checkFavorite();
  }, [id, session]);

  const toggleFavorite = async () => {
    if (!session?.user?.id) {
      router.push("/auth/signin");
      return;
    }

    setIsFavoriting(true);
    try {
      if (isFavorited) {
        // Remove from favorites
        const res = await fetch(`/api/favorites?listingId=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsFavorited(false);
        }
      } else {
        // Add to favorites
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: id }),
        });
        if (res.ok) {
          setIsFavorited(true);
        }
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    } finally {
      setIsFavoriting(false);
    }
  };

  const prevImage = () => setActiveImageIndex((i) => (i - 1 + allImages.length) % allImages.length);
  const nextImage = () => setActiveImageIndex((i) => (i + 1) % allImages.length);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading listing...</p>
      </div>
    );
  }

  if (error ?? !listing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">{error ?? "Listing not found."}</p>
        <Button variant="outline" onClick={() => router.push("/listings")}>Back to Marketplace</Button>
      </div>
    );
  }

  const memberSince = new Date(listing.seller.createdAt).getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* Back */}
        <button
          onClick={() => router.push("/listings")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* ── Main 2-col grid ── */}
        <div className="grid gap-8 lg:grid-cols-2">

          {/* LEFT – Image gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              <Image
                src={allImages[activeImageIndex] ?? "https://placehold.co/600x600/fc6736/ffffff?text=No+Image"}
                alt={`${listing.title} – image ${activeImageIndex + 1}`}
                fill
                className="object-cover"
                priority
              />
              {listing.isVerified && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> AI Verified
                </div>
              )}
              {listing.isSold && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="rounded-full bg-background px-6 py-2 text-lg font-bold">SOLD</span>
                </div>
              )}
              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow hover:bg-background transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextImage} aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow hover:bg-background transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button key={i} onClick={() => setActiveImageIndex(i)} aria-label={`Image ${i + 1}`}
                        className={`h-2 w-2 rounded-full transition-colors ${i === activeImageIndex ? "bg-white" : "bg-white/50"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImageIndex(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === activeImageIndex ? "border-primary" : "border-transparent"}`}>
                    <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* AI Insights Overview */}
            {!showAuthenticityDetails && !showConditionDetails && (listing.authenticityScore ?? listing.conditionScore) && (
              <Card className="overflow-hidden border-0 shadow-md !py-0 !gap-0">
                <div className="bg-orange-50 border-b border-orange-100 px-5 py-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                    <ShieldCheck className="h-4 w-4 text-orange-700" />
                  </div>
                  <h3 className="font-semibold text-sm tracking-wide uppercase text-orange-900">AI Insight Overview</h3>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Authenticity Score */}
                    {listing.authenticityScore && (
                      <div className={`rounded-xl p-4 text-center ${listing.authenticityScore >= 80 ? "bg-green-50 ring-1 ring-green-200" : listing.authenticityScore >= 50 ? "bg-yellow-50 ring-1 ring-yellow-200" : "bg-red-50 ring-1 ring-red-200"}`}>
                        <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Authenticity</p>
                        <p className={`text-3xl font-bold tabular-nums ${listing.authenticityScore >= 80 ? "text-green-700" : listing.authenticityScore >= 50 ? "text-yellow-700" : "text-red-700"}`}>
                          {listing.authenticityScore.toFixed(1)}
                          <span className="text-base font-semibold">%</span>
                        </p>
                        <div className="mt-2.5 h-1.5 bg-white/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${listing.authenticityScore >= 80 ? "bg-green-500" : listing.authenticityScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${listing.authenticityScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Condition Score */}
                    {listing.conditionScore && (
                      <div className={`rounded-xl p-4 text-center ${listing.conditionScore >= 80 ? "bg-green-50 ring-1 ring-green-200" : listing.conditionScore >= 50 ? "bg-yellow-50 ring-1 ring-yellow-200" : "bg-red-50 ring-1 ring-red-200"}`}>
                        <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Condition</p>
                        <p className={`text-3xl font-bold tabular-nums ${listing.conditionScore >= 80 ? "text-green-700" : listing.conditionScore >= 50 ? "text-yellow-700" : "text-red-700"}`}>
                          {listing.conditionScore.toFixed(1)}
                          <span className="text-base font-semibold">%</span>
                        </p>
                        <div className="mt-2.5 h-1.5 bg-white/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${listing.conditionScore >= 80 ? "bg-green-500" : listing.conditionScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${listing.conditionScore}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Details Link */}
                  {(listing.authenticityNotes ?? listing.conditionNotes) && (
                    <button
                      onClick={() => setShowAuthenticityDetails(true)}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      View Detailed Breakdown
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Authenticity Details */}
            {showAuthenticityDetails && listing.authenticityScore && (
              <Card className="overflow-hidden border-0 shadow-md !py-0 !gap-0">
                <div className="bg-orange-50 border-b border-orange-100 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                      <ShieldCheck className="h-4 w-4 text-orange-700" />
                    </div>
                    <h3 className="font-semibold text-sm tracking-wide uppercase text-orange-900">Authenticity Analysis</h3>
                  </div>
                  <button
                    onClick={() => setShowAuthenticityDetails(false)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-2.5 py-1 rounded-md hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
                <CardContent className="p-5 space-y-5">
                  {/* Overall score */}
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${listing.authenticityScore >= 80 ? "bg-green-100 text-green-800 ring-1 ring-green-200" : listing.authenticityScore >= 50 ? "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200" : "bg-red-100 text-red-800 ring-1 ring-red-200"}`}>
                      <span className="text-2xl font-bold tabular-nums">{Math.round(listing.authenticityScore)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{listing.authenticityScore >= 80 ? "High Authenticity" : listing.authenticityScore >= 50 ? "Moderate Authenticity" : "Low Authenticity"}</p>
                      {listing.authenticityNotes && (
                        <p className="text-sm text-gray-600 mt-0.5 leading-snug">{listing.authenticityNotes}</p>
                      )}
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-2">
                    {(() => {
                      const labels = getScoringLabels(listing.type);
                      const justifications: Justifications = listing.authenticityJustifications
                        ? JSON.parse(listing.authenticityJustifications) as Justifications
                        : {};
                      const items = [
                        { label: labels.authenticity.labelMatch, score: listing.labelMatchScore, justification: justifications.labelMatch },
                        { label: labels.authenticity.matrixNumber, score: listing.matrixNumberScore, justification: justifications.matrixNumber },
                        { label: labels.authenticity.typography, score: listing.typographyScore, justification: justifications.typography },
                        { label: labels.authenticity.serialRange, score: listing.serialRangeScore, justification: justifications.serialRange },
                      ];
                      return items.map(({ label, score, justification }) => score !== null && (
                        <div key={label} className={`rounded-lg p-3 ${score >= 70 ? "bg-green-50/80" : "bg-orange-50/80"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              {score >= 70
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                : <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                              }
                              <span className="text-sm font-medium text-gray-800">{label}</span>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${score >= 70 ? "text-green-700" : "text-orange-700"}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-white rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${score >= 70 ? "bg-green-500" : "bg-orange-500"}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          {justification && (
                            <p className="mt-1.5 text-xs text-gray-600 leading-snug">{justification}</p>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Navigation */}
                  {listing.conditionScore && (
                    <button
                      onClick={() => {
                        setShowAuthenticityDetails(false);
                        setShowConditionDetails(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      View Condition Details
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Condition Details */}
            {showConditionDetails && listing.conditionScore && (
              <Card className="overflow-hidden border-0 shadow-md !py-0 !gap-0">
                <div className="bg-orange-50 border-b border-orange-100 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                      <Eye className="h-4 w-4 text-orange-700" />
                    </div>
                    <h3 className="font-semibold text-sm tracking-wide uppercase text-orange-900">Condition Analysis</h3>
                  </div>
                  <button
                    onClick={() => setShowConditionDetails(false)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-2.5 py-1 rounded-md hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
                <CardContent className="p-5 space-y-5">
                  {/* Overall score */}
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${listing.conditionScore >= 80 ? "bg-green-100 text-green-800 ring-1 ring-green-200" : listing.conditionScore >= 50 ? "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200" : "bg-red-100 text-red-800 ring-1 ring-red-200"}`}>
                      <span className="text-2xl font-bold tabular-nums">{Math.round(listing.conditionScore)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{listing.conditionScore >= 80 ? "Excellent Condition" : listing.conditionScore >= 50 ? "Fair Condition" : "Poor Condition"}</p>
                      {listing.conditionNotes && (
                        <p className="text-sm text-gray-600 mt-0.5 leading-snug">{listing.conditionNotes}</p>
                      )}
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-2">
                    {(() => {
                      const labels = getScoringLabels(listing.type);
                      const justifications: Justifications = listing.conditionJustifications
                        ? JSON.parse(listing.conditionJustifications) as Justifications
                        : {};
                      const items = [
                        { label: labels.condition.surface, score: listing.vinylSurfaceScore, justification: justifications.surface },
                        { label: labels.condition.sleeve, score: listing.sleeveScore, justification: justifications.sleeve },
                        { label: labels.condition.label, score: listing.labelConditionScore, justification: justifications.label },
                        { label: labels.condition.edges, score: listing.edgesScore, justification: justifications.edges },
                      ];
                      return items.map(({ label, score, justification }) => score !== null && (
                        <div key={label} className={`rounded-lg p-3 ${score >= 70 ? "bg-green-50/80" : "bg-orange-50/80"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              {score >= 70
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                : <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                              }
                              <span className="text-sm font-medium text-gray-800">{label}</span>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${score >= 70 ? "text-green-700" : "text-orange-700"}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-white rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${score >= 70 ? "bg-green-500" : "bg-orange-500"}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          {justification && (
                            <p className="mt-1.5 text-xs text-gray-600 leading-snug">{justification}</p>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Navigation */}
                  {listing.authenticityScore && (
                    <button
                      onClick={() => {
                        setShowConditionDetails(false);
                        setShowAuthenticityDetails(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      View Authenticity Details
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No AI Verification */}
            {!showAuthenticityDetails && !showConditionDetails && !listing.isVerified && listing.authenticityScore === null && (
              <Card className="overflow-hidden border-0 shadow-md !py-0 !gap-0">
                <div className="bg-gray-100 border-b border-gray-200 px-5 py-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    <ShieldAlert className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Not AI Verified</p>
                    <p className="text-xs text-gray-600">
                      This listing has not been verified by our AI authenticity system
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT – Details + Actions + Seller */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{getTypeLabel(listing.type)}</Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">{getConditionLabel(listing.condition)}</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{getConditionDescription(listing.condition)}</p>
                  </TooltipContent>
                </Tooltip>
                <ConditionGradingGuide />
                {listing.isSold && <Badge variant="destructive">Sold</Badge>}
              </div>
              <ListingBadges
                createdAt={listing.createdAt}
                className="mt-2"
              />
              <h1 className="text-3xl font-bold leading-tight">{listing.title}</h1>
              <p className="mt-1 text-xl text-muted-foreground">{listing.artist}</p>
              <p className="mt-4 text-4xl font-bold text-primary">${listing.price.toFixed(2)}</p>

              {/* Price Comparison Overview */}
              {!showPriceDetails && listing.priceLabel && listing.pricePercentage && (() => {
                const priceInfo = getPriceLabelInfo(listing.priceLabel);
                if (!priceInfo) return null;
                const Icon = priceInfo.icon;
                const formattedDate = listing.priceDataUpdated
                  ? new Date(listing.priceDataUpdated).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : null;
                return (
                  <Card className={`mt-3 overflow-hidden border-0 shadow-md !py-0 !gap-0`}>
                    <div className={`${priceInfo.bgColor} border-b ${priceInfo.borderColor} px-5 py-3 flex items-center gap-3`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${priceInfo.borderColor} border-2 bg-white`}>
                        <Icon className={`h-5 w-5 ${priceInfo.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${priceInfo.color}`}>
                            {priceInfo.label}
                          </p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className={`h-3.5 w-3.5 cursor-help ${priceInfo.color}`} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs text-xs">
                                Price comparison based on market data from similar listings
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className={`text-sm ${priceInfo.color}`}>
                          {listing.pricePercentage.toFixed(1)}% {priceInfo.description}
                        </p>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      {formattedDate && (
                        <p className="text-xs text-gray-500">
                          Market data updated {formattedDate}
                        </p>
                      )}
                      {listing.platformPrices && listing.platformPrices.length > 0 && (
                        <button
                          onClick={() => setShowPriceDetails(true)}
                          className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Compare Platform Prices
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Price Comparison Details */}
              {showPriceDetails && listing.platformPrices && listing.platformPrices.length > 0 && (
                <Card className="mt-3 overflow-hidden border-0 shadow-md !py-0 !gap-0">
                  <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <BarChart3 className="h-4 w-4 text-blue-700" />
                      </div>
                      <h3 className="font-semibold text-sm tracking-wide uppercase text-blue-900">Price Comparison</h3>
                    </div>
                    <button
                      onClick={() => setShowPriceDetails(false)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-2.5 py-1 rounded-md hover:bg-gray-100"
                    >
                      Close
                    </button>
                  </div>
                  <CardContent className="p-5">
                    <div className="space-y-2">
                      {listing.platformPrices.map((platformPrice) => {
                        const priceRange = platformPrice.minPrice && platformPrice.maxPrice
                          ? `$${platformPrice.minPrice.toFixed(2)} – $${platformPrice.maxPrice.toFixed(2)}`
                          : platformPrice.avgPrice
                          ? `$${platformPrice.avgPrice.toFixed(2)}`
                          : "N/A";

                        const isOptimal = platformPrice.priceLabel === "Optimal";
                        const isFair = platformPrice.priceLabel === "Fair";
                        const isHigh = platformPrice.priceLabel === "Slightly High" || platformPrice.priceLabel === "High";

                        const labelColorClass = isOptimal
                          ? "bg-primary/10 text-primary"
                          : isFair
                          ? "bg-green-100 text-green-700"
                          : isHigh
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700";

                        return (
                          <div
                            key={platformPrice.id}
                            className={`flex items-center justify-between rounded-lg p-3.5 ${
                              isOptimal ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isOptimal && <Star className="h-4 w-4 text-primary fill-primary" />}
                              <span className={`font-medium ${isOptimal ? "text-primary" : ""}`}>
                                {platformPrice.platform}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className={`text-sm font-semibold tabular-nums ${isOptimal ? "text-primary" : ""}`}>
                                {priceRange}
                              </span>
                              {platformPrice.priceLabel && (
                                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${labelColorClass}`}>
                                  {platformPrice.priceLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {listing.priceDataUpdated && (
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Market data updated {new Date(listing.priceDataUpdated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>

            <Separator />

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {listing.year && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" /><span>{listing.year}</span>
                </div>
              )}
              {listing.genre && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Music className="h-4 w-4 shrink-0" /><span>{listing.genre}</span>
                </div>
              )}
              {listing.label && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4 shrink-0" /><span>{listing.label}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4 shrink-0" /><span>{listing.views} views</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="mb-2 font-semibold">Description</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {listing.description}
              </p>
            </div>

            {/* Tracklist */}
            {listing.tracklist && (() => {
              try {
                const tracks = JSON.parse(listing.tracklist) as Array<{ side: string; tracks: string[] }>;
                if (tracks.length === 0) return null;
                return (
                  <div>
                    <h3 className="mb-3 font-semibold flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Tracklist
                    </h3>
                    <div className="space-y-4">
                      {tracks.map((side, sideIndex) => (
                        <div key={sideIndex}>
                          <p className="mb-2 text-sm font-semibold text-primary">
                            {side.side}
                          </p>
                          <ol className="space-y-1 pl-4">
                            {side.tracks.map((track, trackIndex) => (
                              <li key={trackIndex} className="flex items-baseline gap-2 text-sm text-muted-foreground">
                                <span className="text-xs font-medium text-muted-foreground/60 min-w-[20px]">
                                  {trackIndex + 1}.
                                </span>
                                {track}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()}

            <Separator />

            {/* Action buttons */}
            {session?.user?.id === listing.seller.id ? (
              // Owner view - Edit and Promote buttons
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="flex-1 gap-2" onClick={() => router.push(`/listings/${listing.id}/edit`)}>
                  <Edit className="h-5 w-5" />
                  Edit Listing
                </Button>
                {!listing.isPromoted ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 gap-2"
                    disabled={isPromoting}
                    onClick={async () => {
                      setIsPromoting(true);
                      try {
                        const res = await fetch(`/api/listings/${listing.id}/promote`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ days: 7 }),
                        });
                        if (res.ok) {
                          setListing({ ...listing, isPromoted: true });
                        }
                      } catch (err) {
                        console.error("Failed to promote:", err);
                      } finally {
                        setIsPromoting(false);
                      }
                    }}
                  >
                    <Megaphone className="h-5 w-5" />
                    {isPromoting ? "Promoting..." : "Promote Listing"}
                  </Button>
                ) : (
                  <Button size="lg" variant="outline" className="flex-1 gap-2" disabled>
                    <Megaphone className="h-5 w-5" />
                    Promoted
                  </Button>
                )}
              </div>
            ) : !listing.isSold ? (
              // Buyer view - Buy, Chat, and Favorite buttons
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="flex-1 gap-2" onClick={() => router.push(`/checkout/${listing.id}`)}>
                    <ShoppingCart className="h-5 w-5" />
                    Buy Now — ${listing.price.toFixed(2)}
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 gap-2"
                    onClick={() => {
                      const event = new CustomEvent("startNewChat", {
                        detail: { otherUserId: listing.seller.id, listingId: listing.id }
                      });
                      window.dispatchEvent(event);
                    }}>
                    <MessageCircle className="h-5 w-5" />
                    Chat with Seller
                  </Button>
                </div>
                <Button
                  size="lg"
                  variant={isFavorited ? "default" : "outline"}
                  className="w-full gap-2"
                  onClick={toggleFavorite}
                  disabled={isFavoriting}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                  {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                  This item has been sold.
                </div>
                {session?.user?.id && (
                  <Button
                    size="lg"
                    variant={isFavorited ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={toggleFavorite}
                    disabled={isFavoriting}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                    {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                  </Button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Seller + Reviews (Carousell-style 2-col) ── */}
        <div className="mt-12">
          <Separator className="mb-8" />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

            {/* LEFT — compact seller card */}
            <div className="lg:w-64 lg:shrink-0">
              <Card>
                <CardContent className="p-5 space-y-4">
                  {/* Avatar + name */}
                  <Link href={`/users/${listing.seller.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold">
                      {(listing.seller.name ?? "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{listing.seller.name ?? "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                        Profile details <ChevronRight className="h-3 w-3" />
                      </p>
                    </div>
                  </Link>

                  <Separator />

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-sm">
                    {sellerStats && sellerStats.totalReviews > 0 ? (
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-1 font-semibold">
                          <span>{sellerStats.averageRating.toFixed(1)}</span>
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        </div>
                        <p className="text-xs text-muted-foreground">{sellerStats.totalReviews} review{sellerStats.totalReviews !== 1 ? "s" : ""}</p>
                      </div>
                    ) : (
                      <div className="flex-1 text-center">
                        <p className="text-xs text-muted-foreground">No reviews yet</p>
                      </div>
                    )}
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex-1 text-center">
                      <p className="font-semibold">{memberSince}</p>
                      <p className="text-xs text-muted-foreground">joined</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT — reviews list */}
            <div className="flex-1 min-w-0">
              {reviews.length > 0 ? (
                <>
                  {/* Header */}
                  <div className="mb-5 flex items-center gap-3">
                    <h2 className="text-xl font-bold">
                      Reviews for {listing.seller.name ?? "this seller"}
                    </h2>
                    {sellerStats && sellerStats.totalReviews > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{sellerStats.averageRating.toFixed(1)}</span>
                        <StarRating rating={Math.round(sellerStats.averageRating)} size="sm" />
                        <span className="text-sm text-muted-foreground">({sellerStats.totalReviews})</span>
                      </div>
                    )}
                  </div>

                  {/* Review list — no card borders, just dividers */}
                  <div className="space-y-6">
                    {reviews.map((review, i) => (
                      <div key={review.id}>
                        {/* Reviewer row */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                            {(review.reviewer.name ?? "A").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{review.reviewer.name ?? "Anonymous"}</span>
                          <span className="text-muted-foreground text-sm">·</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("en-SG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Stars */}
                        <StarRating rating={review.rating} size="sm" />

                        {/* Comment */}
                        <p className="mt-2 text-sm leading-relaxed text-foreground">
                          {review.comment}
                        </p>

                        {/* Listing reference */}
                        <Link
                          href={`/listings/${review.listing.id}`}
                          className="mt-3 flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={getFirstImage(review.listing.images, review.listing.imageUrl)}
                              alt={review.listing.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{review.listing.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{review.listing.artist}</p>
                          </div>
                        </Link>

                        {i < reviews.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                  </div>

                  {/* Read all reviews link — shown when there are more than 3 */}
                  {sellerStats && sellerStats.totalReviews > 3 && (
                    <Link
                      href={`/users/${listing.seller.id}/reviews`}
                      className="mt-6 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Read all {sellerStats.totalReviews} reviews
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground pt-2">This seller has no reviews yet.</p>
              )}
            </div>

          </div>
        </div>

        {/* ── Related Listings ── */}
        {related.length > 0 && (
          <div className="mt-12">
            <Separator className="mb-8" />
            <h2 className="mb-6 text-2xl font-bold">Related Listings</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <Link key={item.id} href={`/listings/${item.id}`}>
                  <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-lg py-0 gap-0">
                    <CardHeader className="p-0">
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={getFirstImage(item.images, item.imageUrl)}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <p className="line-clamp-1 font-medium text-sm">{item.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{item.artist}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">${item.price.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">{getTypeLabel(item.type)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
