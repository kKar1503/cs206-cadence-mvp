"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Sparkles, ArrowRight } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = searchParams.get("listingId");
  const [listingTitle, setListingTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) {
      router.push("/listings");
      return;
    }

    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (res.ok) {
          const data = await res.json() as { listing: { title: string } };
          setListingTitle(data.listing.title);
        }
      } catch (err) {
        console.error("Failed to fetch listing:", err);
      }
    };

    void fetchListing();
  }, [listingId, router]);

  if (!listingId) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Listing Created Successfully!</h1>
          <p className="text-lg text-muted-foreground">
            {listingTitle ? `"${listingTitle}"` : "Your listing"} has been created.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-6">
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Boost Your Listing with AI Verification
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Increase buyer confidence and stand out from other listings by getting your item AI-verified.
                Items with higher authenticity scores sell faster and command better prices.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium">The verification process includes:</p>
                <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
                  <li>Upload additional photos of your item</li>
                  <li>Provide a 360° video view</li>
                  <li>Upload any authenticity certifications (optional)</li>
                  <li>Receive an AI-generated authenticity score</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => router.push(`/listings/${listingId}/ai-verify`)}
              >
                <Sparkles className="h-5 w-5" />
                Start AI Verification
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href={`/listings/${listingId}`}>
                  <Package className="mr-2 h-5 w-5" />
                  Skip for Now - View Listing
                </Link>
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              You can always run AI verification later from your listing page
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/listings" className="text-sm text-primary hover:underline">
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ListingCreateSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
