"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, Package, ShoppingBag } from "lucide-react";

type Listing = {
  id: string;
  title: string;
  artist: string;
  price: number;
  images: string;
  imageUrl: string | null;
};

const getFirstImage = (listing: Listing): string => {
  try {
    const images = JSON.parse(listing.images) as string[];
    return images[0] ?? listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  } catch {
    return listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  }
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const orderNumber = searchParams.get("orderNumber") ?? `ORD-${Date.now().toString().slice(-8)}`;
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (!listingId) return;

    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error("Failed to fetch listing");
        const data = await res.json() as { listing: Listing };
        setListing(data.listing);
      } catch (error) {
        console.error(error);
      }
    }

    void fetchListing();
  }, [listingId]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Purchase Successful!</h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-6">
            <div className="border-b pb-4">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="text-2xl font-bold font-mono">{orderNumber}</p>
            </div>

            {listing && (
              <>
                <div>
                  <h2 className="font-semibold mb-3">Order Details</h2>
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={getFirstImage(listing)}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground">{listing.artist}</p>
                      <p className="text-lg font-semibold mt-2">${listing.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h2 className="font-semibold mb-3">What&apos;s Next?</h2>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>
                        You&apos;ll receive an email confirmation at your registered email address
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>The seller will be notified and will prepare your item for shipping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>
                        You can track your order status in your profile under &quot;My Orders&quot;
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>
                        Estimated delivery: 5-7 business days (tracking info will be provided)
                      </span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/orders">
              <ShoppingBag className="mr-2 h-5 w-5" />
              View My Orders
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/listings">
              <Package className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Need help? Contact us at{" "}
          <a href="mailto:support@cadence.com" className="text-primary hover:underline">
            support@cadence.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
