"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Loader2, Package } from "lucide-react";

interface Seller {
  id: string;
  name: string | null;
  image: string | null;
}

interface Listing {
  id: string;
  title: string;
  artist: string;
  price: number;
  images: string;
  imageUrl: string | null;
  type: string;
  condition: string;
  isSold: boolean;
  seller: Seller;
}

interface Favorite {
  id: string;
  listingId: string;
  createdAt: string;
  listing: Listing;
}

const getFirstImage = (listing: Listing): string => {
  try {
    const images = JSON.parse(listing.images) as string[];
    return images[0] ?? listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  } catch {
    return listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  }
};

const getTypeLabel = (type: string) =>
  ({ VINYL: "Vinyl", CD: "CD", CASSETTE: "Cassette", MERCH: "Merch", EQUIPMENT: "Equipment" }[type] ?? type);

const getConditionLabel = (c: string) => c.replace(/_/g, " ");

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      const fetchFavorites = async () => {
        try {
          const res = await fetch("/api/favorites");
          if (res.ok) {
            const data = await res.json() as Favorite[];
            setFavorites(data);
          }
        } catch (err) {
          console.error("Failed to fetch favorites:", err);
        } finally {
          setIsLoading(false);
        }
      };
      void fetchFavorites();
    }
  }, [status, router]);

  const removeFavorite = async (listingId: string) => {
    setRemovingId(listingId);
    try {
      const res = await fetch(`/api/favorites?listingId=${listingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.listingId !== listingId));
      }
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    } finally {
      setRemovingId(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
          <p className="text-muted-foreground">
            {favorites.length === 0
              ? "You haven't added any favorites yet."
              : `${favorites.length} ${favorites.length === 1 ? "item" : "items"} saved`}
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
              <p className="text-muted-foreground text-center mb-6">
                Start exploring and add items you love to your favorites!
              </p>
              <Button asChild>
                <Link href="/listings">
                  <Package className="mr-2 h-4 w-4" />
                  Browse Marketplace
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="overflow-hidden group hover:shadow-lg transition-shadow py-0 gap-0">
                <Link href={`/listings/${favorite.listing.id}`}>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={getFirstImage(favorite.listing)}
                      alt={favorite.listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {favorite.listing.isSold && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="secondary" className="text-lg font-bold">
                          SOLD
                        </Badge>
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4 space-y-3 pt-4">
                  <Link href={`/listings/${favorite.listing.id}`}>
                    <div className="space-y-1">
                      <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
                        {favorite.listing.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {favorite.listing.artist}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(favorite.listing.type)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getConditionLabel(favorite.listing.condition)}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        ${favorite.listing.price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    {!favorite.listing.isSold && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/checkout/${favorite.listing.id}`)}
                      >
                        <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                        Buy Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className={favorite.listing.isSold ? "flex-1" : ""}
                      onClick={() => removeFavorite(favorite.listing.id)}
                      disabled={removingId === favorite.listing.id}
                    >
                      {removingId === favorite.listing.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Heart className="h-3.5 w-3.5 fill-current" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
