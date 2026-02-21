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
} from "lucide-react";

interface Seller {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
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
  verifiedByOfficial: boolean;
  authenticityScore: number | null;
  verificationSource: string | null;
  isSold: boolean;
  views: number;
  priceLabel: string | null;
  pricePercentage: number | null;
  priceDataUpdated: string | null;
  createdAt: string;
  seller: Seller;
}

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
          onClick={() => router.back()}
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
              {listing.verifiedByOfficial && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
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

            {/* Official Verification */}
            {listing.verifiedByOfficial && listing.verificationSource && (
              <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/30">
                <CardContent className="flex items-start gap-3 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                      Officially Verified
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Verified by <strong>{listing.verificationSource}</strong>
                    </p>
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      Highest authenticity assurance
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Authenticity */}
            {listing.isVerified && listing.authenticityScore !== null && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-primary">AI Verified Authentic</p>
                    <p className="text-sm text-muted-foreground">{listing.authenticityScore.toFixed(1)}% authenticity score</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No AI Verification */}
            {!listing.isVerified && listing.authenticityScore === null && (
              <Card className="border-gray-300 bg-gray-50 dark:bg-gray-900/30 dark:border-gray-700">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Not AI Verified</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This listing has not been verified by our AI authenticity system
                    </p>
                  </div>
                </CardContent>
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
                {listing.isSold && <Badge variant="destructive">Sold</Badge>}
              </div>
              <h1 className="text-3xl font-bold leading-tight">{listing.title}</h1>
              <p className="mt-1 text-xl text-muted-foreground">{listing.artist}</p>
              <p className="mt-4 text-4xl font-bold text-primary">${listing.price.toFixed(2)}</p>

              {/* Price Comparison */}
              {listing.priceLabel && listing.pricePercentage && (() => {
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
                  <Card className={`mt-3 ${priceInfo.borderColor} ${priceInfo.bgColor}`}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${priceInfo.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${priceInfo.color}`}>
                            {priceInfo.label}
                          </p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className={`h-4 w-4 cursor-help ${priceInfo.color}`} />
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
                        {formattedDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Data updated: {formattedDate}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
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

            <Separator />

            {/* Action buttons */}
            {session?.user?.id === listing.seller.id ? (
              // Owner view - Edit listing button
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="flex-1 gap-2" onClick={() => router.push(`/listings/${listing.id}/edit`)}>
                  <Edit className="h-5 w-5" />
                  Edit Listing
                </Button>
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
