"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ShieldCheck, Eye, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Listing {
  id: string;
  title: string;
  artist: string;
  description: string;
  type: string;
  condition: string;
  price: number;
  imageUrl: string | null;
  year: number | null;
  genre: string | null;
  isVerified: boolean;
  verifiedByOfficial: boolean;
  authenticityScore: number | null;
  views: number;
  seller: {
    name: string | null;
  };
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const listingTypes = ["VINYL", "CD", "CASSETTE", "MERCH", "EQUIPMENT"];
  const conditions = ["MINT", "NEAR_MINT", "VERY_GOOD_PLUS", "VERY_GOOD", "GOOD_PLUS", "GOOD"];

  useEffect(() => {
    void fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/listings");
      const data = await response.json() as Listing[];
      setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    // Search filter
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.genre?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(listing.type);

    // Condition filter
    const matchesCondition =
      selectedConditions.length === 0 || selectedConditions.includes(listing.condition);

    // Verified filter
    const matchesVerified = !verifiedOnly || listing.isVerified;

    return matchesSearch && matchesType && matchesCondition && matchesVerified;
  });

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="mb-4 text-3xl font-bold">Marketplace</h1>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, artist, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filter Panel - Left Side (Desktop) / Accordion (Mobile) */}
          <aside className="w-full lg:w-64 lg:shrink-0">
            {/* Desktop Filters */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {/* Type Filter */}
                <div>
                  <h3 className="mb-3 font-semibold">Type</h3>
                  <div className="space-y-2">
                    {listingTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Condition Filter */}
                <div>
                  <h3 className="mb-3 font-semibold">Condition</h3>
                  <div className="space-y-2">
                    {conditions.map((condition) => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={`condition-${condition}`}
                          checked={selectedConditions.includes(condition)}
                          onCheckedChange={() => toggleCondition(condition)}
                        />
                        <label
                          htmlFor={`condition-${condition}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {condition.replace(/_/g, " ")}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verified Filter */}
                <div>
                  <h3 className="mb-3 font-semibold">Authenticity</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified"
                      checked={verifiedOnly}
                      onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                    />
                    <label
                      htmlFor="verified"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Verified only
                    </label>
                  </div>
                </div>

                {/* Reset Filters */}
                {(selectedTypes.length > 0 || selectedConditions.length > 0 || verifiedOnly) && (
                  <button
                    onClick={() => {
                      setSelectedTypes([]);
                      setSelectedConditions([]);
                      setVerifiedOnly(false);
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Filters - Accordion */}
            <div className="lg:hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="filters" className="rounded-lg border px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="font-semibold">Filters</span>
                      {(selectedTypes.length > 0 || selectedConditions.length > 0 || verifiedOnly) && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {selectedTypes.length + selectedConditions.length + (verifiedOnly ? 1 : 0)}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    {/* Type Filter */}
                    <div>
                      <h3 className="mb-3 font-semibold">Type</h3>
                      <div className="space-y-2">
                        {listingTypes.map((type) => (
                          <div key={`mobile-type-${type}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mobile-type-${type}`}
                              checked={selectedTypes.includes(type)}
                              onCheckedChange={() => toggleType(type)}
                            />
                            <label
                              htmlFor={`mobile-type-${type}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Condition Filter */}
                    <div>
                      <h3 className="mb-3 font-semibold">Condition</h3>
                      <div className="space-y-2">
                        {conditions.map((condition) => (
                          <div key={`mobile-condition-${condition}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mobile-condition-${condition}`}
                              checked={selectedConditions.includes(condition)}
                              onCheckedChange={() => toggleCondition(condition)}
                            />
                            <label
                              htmlFor={`mobile-condition-${condition}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {condition.replace(/_/g, " ")}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verified Filter */}
                    <div>
                      <h3 className="mb-3 font-semibold">Authenticity</h3>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mobile-verified"
                          checked={verifiedOnly}
                          onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                        />
                        <label
                          htmlFor="mobile-verified"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Verified only
                        </label>
                      </div>
                    </div>

                    {/* Reset Filters */}
                    {(selectedTypes.length > 0 || selectedConditions.length > 0 || verifiedOnly) && (
                      <button
                        onClick={() => {
                          setSelectedTypes([]);
                          setSelectedConditions([]);
                          setVerifiedOnly(false);
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Reset all filters
                      </button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading listings...</div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No listings found. Try adjusting your filters.
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""} found
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredListings.map((listing) => (
                    <Link key={listing.id} href={`/listings/${listing.id}`}>
                      <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-lg py-0 gap-0">
                        <CardHeader className="p-0">
                          <div className="relative aspect-square overflow-hidden">
                            <Image
                              src={listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image"}
                              alt={listing.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            {listing.verifiedByOfficial && (
                              <div className="absolute right-2 top-2 rounded-full bg-primary p-1.5">
                                <ShieldCheck className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <CardTitle className="line-clamp-1 text-base">{listing.title}</CardTitle>
                              <CardDescription className="text-sm">{listing.artist}</CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">${listing.price.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="mb-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                              {listing.type}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
                              {listing.condition.replace(/_/g, " ")}
                            </span>
                          </div>

                          {listing.genre && (
                            <p className="mb-2 text-xs text-muted-foreground">{listing.genre}</p>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>by {listing.seller.name ?? "Anonymous"}</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{listing.views}</span>
                            </div>
                          </div>

                          {listing.isVerified && listing.authenticityScore && (
                            <div className="mt-2 text-xs text-primary">
                              {listing.authenticityScore.toFixed(1)}% authentic
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
