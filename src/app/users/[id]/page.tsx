"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, AlertCircle, ShieldCheck, Eye, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserListing {
  id: string;
  title: string;
  artist: string;
  price: number;
  images: string;
  imageUrl: string | null;
  type: string;
  condition: string;
  isVerified: boolean;
  verifiedByOfficial: boolean;
  views: number;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  listings: UserListing[];
  _count: { listings: number; reviewsReceived: number };
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFirstImage = (images: string, imageUrl: string | null): string => {
  try {
    const p = JSON.parse(images) as string[];
    return p[0] ?? imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  } catch {
    return imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  }
};

const getTypeLabel = (type: string) =>
  ({ VINYL: "Vinyl", CD: "CD", CASSETTE: "Cassette", MERCH: "Merch", EQUIPMENT: "Equipment" }[type] ?? type);

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

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const px = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${px} ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          fetch(`/api/users/${id}`),
          fetch(`/api/users/${id}/reviews`),
        ]);

        if (!profileRes.ok) {
          setError(profileRes.status === 404 ? "User not found." : "Failed to load profile.");
          return;
        }

        const profileData = await profileRes.json() as UserProfile;
        setProfile(profileData);

        if (reviewsRes.ok) {
          const reviewData = await reviewsRes.json() as { reviews: Review[]; stats: SellerStats };
          setReviews(reviewData.reviews);
          setStats(reviewData.stats);
        }
      } catch {
        setError("Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchAll();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error ?? !profile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">{error ?? "User not found."}</p>
        <Button variant="outline" onClick={() => router.push("/listings")}>Back to Marketplace</Button>
      </div>
    );
  }

  const joinYear = new Date(profile.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsOnPlatform = currentYear - joinYear;
  const initial = (profile.name ?? "A").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">

      {/* ── Banner ── */}
      <div className="h-36 bg-gradient-to-br from-primary/80 to-primary/40" />

      {/* ── Profile header card ── */}
      <div className="container mx-auto max-w-5xl px-4">
        <div className="-mt-8 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-4 ring-background">
              {initial}
            </div>

            {/* Name + stats */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{profile.name ?? "Anonymous"}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {stats && stats.totalReviews > 0 && (
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <span className="font-semibold text-foreground">{stats.averageRating.toFixed(1)}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}</span>
                  </button>
                )}
                <span>
                  {yearsOnPlatform > 0 ? `${yearsOnPlatform}y` : "< 1y"} · Joined {joinYear}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-6 flex border-b">
          {(["listings", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {tab === "reviews" && stats && stats.totalReviews > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({stats.totalReviews})</span>
              )}
              {tab === "listings" && (
                <span className="ml-1.5 text-xs text-muted-foreground">({profile.listings.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="py-8">

          {/* LISTINGS TAB */}
          {activeTab === "listings" && (
            <>
              {profile.listings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active listings.</p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {profile.listings.map((listing) => (
                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                      <div className="group cursor-pointer overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <Image
                            src={getFirstImage(listing.images, listing.imageUrl)}
                            alt={listing.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          {listing.verifiedByOfficial && (
                            <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                              <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <p className="line-clamp-1 text-sm font-medium">{listing.title}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{listing.artist}</p>
                          <p className="mt-1.5 font-bold text-primary">${listing.price.toFixed(2)}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground cursor-help">
                                  {getConditionLabel(listing.condition)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{getConditionDescription(listing.condition)}</p>
                              </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              <span>{listing.views}</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {getTypeLabel(listing.type)}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <>
                  {/* Aggregate header */}
                  {stats && (
                    <div className="mb-8 flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold">{stats.averageRating.toFixed(2)}</p>
                        <StarRating rating={Math.round(stats.averageRating)} size="md" />
                        <p className="mt-1 text-sm text-muted-foreground">({stats.totalReviews} reviews)</p>
                      </div>
                      <Separator orientation="vertical" className="h-16" />
                      <div className="flex-1 space-y-1.5">
                        {stats.ratingBreakdown.map(({ star, count }) => {
                          const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-3 text-right text-muted-foreground">{star}</span>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                              <div className="flex-1 h-1.5 max-w-48 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-muted-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Review list */}
                  <div className="space-y-6 max-w-2xl">
                    {reviews.map((review, i) => (
                      <div key={review.id}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                            {(review.reviewer.name ?? "A").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{review.reviewer.name ?? "Anonymous"}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("en-SG", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                        </div>
                        <StarRating rating={review.rating} />
                        <p className="mt-2 text-sm leading-relaxed">{review.comment}</p>
                        <Link
                          href={`/listings/${review.listing.id}`}
                          className="mt-3 flex items-center gap-3 rounded-lg border p-3 hover:bg-muted transition-colors w-full"
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
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                        </Link>
                        {i < reviews.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
