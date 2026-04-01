"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type Recommendation = {
  id: string;
  title: string;
  artist: string;
  price: number;
  images: string;
  imageUrl: string | null;
  type: string;
  condition: string;
  views: number;
  isVerified: boolean;
  score: number;
  matchReason: string;
  seller: { name: string | null };
};

type TasteSummary = {
  topGenres: string[];
  topArtists: string[];
  totalSignals: number;
};

const getFirstImage = (images: string, imageUrl: string | null): string => {
  try {
    const parsed = JSON.parse(images) as string[];
    return parsed[0] ?? imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  } catch {
    return imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  }
};

const getConditionLabel = (c: string) => c.replace(/_/g, " ");

export function Recommendations() {
  const { status } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [taste, setTaste] = useState<TasteSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

    const fetchRecs = async () => {
      try {
        const res = await fetch("/api/recommendations");
        if (!res.ok) return;
        const data = (await res.json()) as {
          recommendations: Recommendation[];
          taste: TasteSummary;
        };
        setRecommendations(data.recommendations);
        setTaste(data.taste);
      } catch {
        // Non-critical — silently fail
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRecs();
  }, [status]);

  // Don't render if not authenticated or no data
  if (status !== "authenticated" || isLoading) return null;
  if (recommendations.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold">Recommended for You</h2>
        </div>
        <p className="text-muted-foreground mb-8">
          {taste && taste.totalSignals > 0
            ? `Based on your interest in ${taste.topGenres.length > 0 ? taste.topGenres.join(", ") : "music"}`
            : "Popular picks from the community"}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {recommendations.slice(0, 6).map((rec) => (
            <Link
              key={rec.id}
              href={`/listings/${rec.id}`}
              className="group block rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={getFirstImage(rec.images, rec.imageUrl)}
                  alt={rec.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                {/* Match reason tag */}
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="inline-block rounded-full bg-primary/90 px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground backdrop-blur-sm">
                    {rec.matchReason}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{rec.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{rec.artist}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-bold text-primary text-sm">${rec.price.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {getConditionLabel(rec.condition)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  by {rec.seller.name ?? "Unknown"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
