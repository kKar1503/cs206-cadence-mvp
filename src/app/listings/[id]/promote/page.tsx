"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import validator from "validator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Megaphone,
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";

type Listing = {
  id: string;
  title: string;
  artist: string;
  price: number;
  images: string;
  imageUrl: string | null;
  isPromoted: boolean;
  isSold: boolean;
  sellerId: string;
};

const getFirstImage = (listing: Listing): string => {
  try {
    const images = JSON.parse(listing.images) as string[];
    return images[0] ?? listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  } catch {
    return listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  }
};

const PROMOTION_PLANS = [
  { days: 3, price: 2.99, label: "3 Days", description: "Quick boost" },
  { days: 7, price: 4.99, label: "7 Days", description: "Most popular", popular: true },
  { days: 14, price: 7.99, label: "14 Days", description: "Extended reach" },
  { days: 30, price: 12.99, label: "30 Days", description: "Maximum exposure" },
];

const PROMO_FEATURES = [
  { id: "featured", label: "Featured Badge", description: "Show a featured badge on your listing card", price: 0, included: true },
  { id: "homepage", label: "Homepage Placement", description: "Appear in the Featured Listings section on the homepage", price: 1.99, included: false },
  { id: "priority", label: "Priority in Search", description: "Rank higher in marketplace search results", price: 0.99, included: false },
];

export default function PromotePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [listingId, setListingId] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Plan & features
  const [selectedPlan, setSelectedPlan] = useState(1); // Default to 7-day plan
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set(["featured"]));

  // Payment form
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [savePayment, setSavePayment] = useState(false);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [usingSavedCard, setUsingSavedCard] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resolve params
  useEffect(() => {
    void params.then((p) => setListingId(p.id));
  }, [params]);

  // Fetch listing
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
      } finally {
        setIsLoading(false);
      }
    }

    void fetchListing();
  }, [listingId]);

  // Load saved card
  useEffect(() => {
    if (status !== "authenticated") return;

    const loadSavedCard = async () => {
      try {
        const res = await fetch("/api/saved-cards");
        if (!res.ok) return;
        const cards = (await res.json()) as Array<{
          id: string;
          cardNumber: string;
          cardName: string;
          expiryDate: string;
          cardType: string;
          last4: string;
        }>;
        if (cards.length > 0) {
          const card = cards[0]!;
          setSavedCardId(card.id);
          setCardNumber(formatCardNumber(card.cardNumber));
          setCardName(card.cardName);
          setExpiryDate(card.expiryDate);
          setUsingSavedCard(true);
        }
      } catch (err) {
        console.error("Failed to load saved card:", err);
      }
    };

    void loadSavedCard();
  }, [status]);

  const getCardType = (number: string): "visa" | "mastercard" | null => {
    const cleaned = number.replace(/\s/g, "");
    if (cleaned.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(cleaned)) return "mastercard";
    return null;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardNumber(formatted);
      if (errors.cardNumber) setErrors({ ...errors, cardNumber: "" });
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.replace(/\D/g, "").length <= 4) {
      setExpiryDate(formatted);
      if (errors.expiryDate) setErrors({ ...errors, expiryDate: "" });
    }
  };

  const toggleFeature = (featureId: string) => {
    const feature = PROMO_FEATURES.find((f) => f.id === featureId);
    if (feature?.included) return; // Can't toggle included features
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) next.delete(featureId);
      else next.add(featureId);
      return next;
    });
  };

  const plan = PROMOTION_PLANS[selectedPlan]!;
  const addonsTotal = PROMO_FEATURES
    .filter((f) => selectedFeatures.has(f.id) && !f.included)
    .reduce((sum, f) => sum + f.price, 0);
  const totalPrice = plan.price + addonsTotal;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const cleanedCard = cardNumber.replace(/\s/g, "");

    if (!cleanedCard || !validator.isCreditCard(cleanedCard)) {
      newErrors.cardNumber = "Enter a valid card number";
    } else {
      const type = getCardType(cleanedCard);
      if (!type) newErrors.cardNumber = "Only Visa and Mastercard are accepted";
    }

    if (!cardName.trim()) {
      newErrors.cardName = "Enter the cardholder name";
    }

    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = "Enter a valid expiry date (MM/YY)";
    } else {
      const [month, year] = expiryDate.split("/").map(Number);
      const now = new Date();
      const expiry = new Date(2000 + year!, month! - 1 + 1, 0);
      if (expiry < now) newErrors.expiryDate = "Card has expired";
    }

    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = "Enter a valid CVV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm() || !listing) return;

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Save card if requested
      if (savePayment && !usingSavedCard) {
        const cleanedCard = cardNumber.replace(/\s/g, "");
        await fetch("/api/saved-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardNumber: cleanedCard,
            cardName,
            expiryDate,
            cardType: getCardType(cleanedCard),
          }),
        });
      }

      // Promote the listing
      const res = await fetch(`/api/listings/${listing.id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: plan.days }),
      });

      if (!res.ok) throw new Error("Failed to promote listing");

      setPaymentSuccess(true);
    } catch (err) {
      console.error("Payment failed:", err);
      setErrors({ payment: "Payment failed. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  if (isLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Listing not found</p>
      </div>
    );
  }

  if (listing.sellerId !== session?.user?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">You can only promote your own listings</p>
      </div>
    );
  }

  if (listing.isPromoted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Megaphone className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Already Promoted</h1>
        <p className="text-muted-foreground mb-6">This listing is already being promoted.</p>
        <Button onClick={() => router.push(`/listings/${listing.id}`)}>Back to Listing</Button>
      </div>
    );
  }

  // Success state
  if (paymentSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Promotion Activated!</h1>
        <p className="text-muted-foreground mb-2">
          Your listing &ldquo;{listing.title}&rdquo; is now promoted for {plan.days} days.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Total charged: <span className="font-semibold text-foreground">${totalPrice.toFixed(2)}</span>
        </p>
        <div className="space-y-3">
          <Button className="w-full" onClick={() => router.push(`/listings/${listing.id}`)}>
            View Listing
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/listings")}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const cardType = getCardType(cardNumber);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Listing
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Promote Your Listing</h1>
        <p className="text-muted-foreground mt-1">Boost visibility and reach more buyers</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column - Plan & Options */}
        <div className="space-y-6">
          {/* Listing Preview */}
          <Card className="py-0 gap-0 overflow-hidden">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                <Image src={getFirstImage(listing)} alt={listing.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{listing.title}</p>
                <p className="text-sm text-muted-foreground">{listing.artist}</p>
                <p className="text-sm font-medium text-primary">${listing.price.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Duration Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Choose Duration</h2>
            <div className="grid grid-cols-2 gap-3">
              {PROMOTION_PLANS.map((p, i) => (
                <button
                  key={p.days}
                  onClick={() => setSelectedPlan(i)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPlan === i
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-muted hover:border-gray-300"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2.5 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                      Popular
                    </span>
                  )}
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-bold text-lg">{p.label}</span>
                    <span className="font-bold text-primary">${p.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${(p.price / p.days).toFixed(2)}/day
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Promotion Features */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Promotion Features</h2>
            <div className="space-y-2">
              {PROMO_FEATURES.map((feature) => {
                const isSelected = selectedFeatures.has(feature.id);
                return (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : feature.included
                        ? "border-green-200 bg-green-50/50"
                        : "border-muted hover:border-gray-300"
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary/10" : "bg-muted"
                    }`}>
                      {feature.id === "featured" && <Sparkles className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />}
                      {feature.id === "homepage" && <Star className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />}
                      {feature.id === "priority" && <TrendingUp className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{feature.label}</span>
                        {feature.included && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                            Included
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                    {!feature.included && (
                      <span className="text-sm font-semibold text-muted-foreground">
                        +${feature.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Payment Method</h2>
            <Card className="py-0 gap-0 overflow-hidden">
              <CardContent className="p-5 space-y-4">
                {usingSavedCard && (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 p-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-700" />
                      <span className="text-sm font-medium text-green-800">
                        Using saved {cardType === "visa" ? "Visa" : "Mastercard"} ending in {cardNumber.slice(-4)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setUsingSavedCard(false);
                        setCardNumber("");
                        setCardName("");
                        setExpiryDate("");
                        setCvv("");
                        setSavedCardId(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Use different card
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative mt-1">
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        readOnly={usingSavedCard}
                        className={`pl-10 ${errors.cardNumber ? "border-red-500" : ""} ${usingSavedCard ? "bg-muted/50" : ""}`}
                      />
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      {cardType && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-muted-foreground">
                          {cardType}
                        </span>
                      )}
                    </div>
                    {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>}
                  </div>

                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => { setCardName(e.target.value); if (errors.cardName) setErrors({ ...errors, cardName: "" }); }}
                      readOnly={usingSavedCard}
                      className={`mt-1 ${errors.cardName ? "border-red-500" : ""} ${usingSavedCard ? "bg-muted/50" : ""}`}
                    />
                    {errors.cardName && <p className="mt-1 text-xs text-red-500">{errors.cardName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                        readOnly={usingSavedCard}
                        className={`mt-1 ${errors.expiryDate ? "border-red-500" : ""} ${usingSavedCard ? "bg-muted/50" : ""}`}
                      />
                      {errors.expiryDate && <p className="mt-1 text-xs text-red-500">{errors.expiryDate}</p>}
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => { if (/^\d{0,4}$/.test(e.target.value)) { setCvv(e.target.value); if (errors.cvv) setErrors({ ...errors, cvv: "" }); } }}
                        type="password"
                        className={`mt-1 ${errors.cvv ? "border-red-500" : ""}`}
                      />
                      {errors.cvv && <p className="mt-1 text-xs text-red-500">{errors.cvv}</p>}
                    </div>
                  </div>

                  {!usingSavedCard && (
                    <div className="flex items-center space-x-2 pt-1">
                      <Checkbox
                        id="savePayment"
                        checked={savePayment}
                        onCheckedChange={(checked) => setSavePayment(checked === true)}
                      />
                      <Label htmlFor="savePayment" className="text-sm cursor-pointer">
                        Save card for future purchases
                      </Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:sticky lg:top-8 h-fit space-y-4">
          <Card className="py-0 gap-0 overflow-hidden">
            <div className="bg-orange-50 border-b border-orange-100 px-5 py-3">
              <h2 className="font-semibold text-orange-900">Order Summary</h2>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Promotion ({plan.label})</span>
                  <span className="font-medium">${plan.price.toFixed(2)}</span>
                </div>
                {PROMO_FEATURES.filter((f) => selectedFeatures.has(f.id) && !f.included).map((f) => (
                  <div key={f.id} className="flex justify-between">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium">${f.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Featured Badge</span>
                  <span className="text-green-600 font-medium">Included</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>Promotion starts immediately after payment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Megaphone className="h-3 w-3" />
                  <span>Active for {plan.days} days from activation</span>
                </div>
              </div>

              {errors.payment && (
                <p className="text-sm text-red-500 font-medium">{errors.payment}</p>
              )}

              <Button
                className="w-full gap-2"
                size="lg"
                disabled={isProcessing}
                onClick={handlePayment}
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay ${totalPrice.toFixed(2)}
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Secure payment powered by Cadence
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
