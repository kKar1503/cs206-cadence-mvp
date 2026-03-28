"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import validator from "validator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, AlertTriangle, ShieldAlert, CreditCard, Lock, AlertCircle, MapPin, Truck } from "lucide-react";

type Listing = {
  id: string;
  title: string;
  artist: string;
  price: number;
  images: string;
  imageUrl: string | null;
  authenticityScore: number | null;
  verifiedByOfficial: boolean;
  verificationSource: string | null;
};

const getFirstImage = (listing: Listing): string => {
  try {
    const images = JSON.parse(listing.images) as string[];
    return images[0] ?? listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  } catch {
    return listing.imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  }
};

export default function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [listingId, setListingId] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [savePayment, setSavePayment] = useState(false);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [usingSavedCard, setUsingSavedCard] = useState(false);

  // Shipping state
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingInfo, setShippingInfo] = useState<{
    cost: number;
    tier: string;
    estimate: string;
    distance: number | null;
    buyerAddress: string | null;
  } | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void params.then((p) => setListingId(p.listingId));
  }, [params]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(`/auth/signin?callbackUrl=/checkout/${listingId ?? ""}`);
      return;
    }
  }, [status, router, listingId]);

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

  // Load saved card if available
  // NOTE: This loads full card details because the payment system is fake/simulated.
  // A real system would use tokenized payment methods from Stripe, etc.
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
      if (errors.cardNumber) {
        setErrors({ ...errors, cardNumber: "" });
      }
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.replace(/\//g, "").length <= 4) {
      setExpiryDate(formatted);
      if (errors.expiryDate) {
        setErrors({ ...errors, expiryDate: "" });
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setCvv(value);
      if (errors.cvv) {
        setErrors({ ...errors, cvv: "" });
      }
    }
  };

  const calculateShipping = async () => {
    if (!shippingPostalCode || !listingId) {
      setErrors((prev) => ({ ...prev, shipping: "Postal code is required" }));
      return;
    }
    if (!/^\d{6}$/.test(shippingPostalCode)) {
      setErrors((prev) => ({ ...prev, shipping: "Invalid postal code (must be 6 digits)" }));
      return;
    }

    setIsCalculatingShipping(true);
    setErrors((prev) => ({ ...prev, shipping: "" }));

    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerPostalCode: shippingPostalCode, listingId }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        setErrors((prev) => ({ ...prev, shipping: data.error }));
        setShippingInfo(null);
        return;
      }

      const data = (await res.json()) as {
        cost: number;
        tier: string;
        estimate: string;
        distance: number | null;
        buyerAddress: string | null;
      };
      setShippingInfo(data);
    } catch {
      setErrors((prev) => ({ ...prev, shipping: "Failed to calculate shipping" }));
      setShippingInfo(null);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate card number
    const cleanedCardNumber = cardNumber.replace(/\s/g, "");
    if (!cleanedCardNumber) {
      newErrors.cardNumber = "Card number is required";
    } else if (!validator.isCreditCard(cleanedCardNumber)) {
      newErrors.cardNumber = "Invalid card number";
    } else if (!getCardType(cleanedCardNumber)) {
      newErrors.cardNumber = "Only Visa and Mastercard are accepted";
    }

    // Validate cardholder name
    if (!cardName.trim()) {
      newErrors.cardName = "Cardholder name is required";
    }

    // Validate expiry date
    if (!expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else {
      const [month, year] = expiryDate.split("/");
      const monthNum = parseInt(month ?? "0", 10);
      const yearNum = parseInt(`20${year ?? "0"}`, 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (monthNum < 1 || monthNum > 12) {
        newErrors.expiryDate = "Invalid month";
      } else if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
        newErrors.expiryDate = "Card has expired";
      }
    }

    // Validate CVV
    if (!cvv) {
      newErrors.cvv = "CVV is required";
    } else if (cvv.length < 3) {
      newErrors.cvv = "CVV must be 3 or 4 digits";
    }

    // Validate shipping
    if (!shippingAddress.trim()) {
      newErrors.shippingAddress = "Shipping address is required";
    }
    if (shippingPostalCode?.length !== 6) {
      newErrors.shipping = "Postal code is required (6 digits)";
    } else if (!shippingInfo) {
      newErrors.shipping = "Please calculate shipping cost first";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !listingId) return;

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Save card if checkbox is checked
      // NOTE: Saving raw card details because this is a fake/simulated payment system.
      // In production, NEVER store raw card numbers — use Stripe tokens instead.
      if (savePayment) {
        const cleanedNumber = cardNumber.replace(/\s/g, "");
        const cardType = getCardType(cleanedNumber);
        await fetch("/api/saved-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardNumber: cleanedNumber,
            cardName,
            expiryDate,
            cardType: cardType ?? "unknown",
          }),
        });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

      // Create order in database
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          orderNumber,
          shippingCost: shippingInfo?.cost ?? 0,
          shippingAddress: `${shippingAddress.trim()}, Singapore ${shippingPostalCode}`,
        }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create order");
      }

      // Redirect to success page with order number and shipping info
      const shippingParam = shippingInfo ? `&shippingCost=${shippingInfo.cost}&shippingEstimate=${encodeURIComponent(shippingInfo.estimate)}` : "";
      router.push(`/checkout/success?listingId=${listingId}&orderNumber=${orderNumber}${shippingParam}`);
    } catch (error) {
      console.error("Order creation failed:", error);
      setErrors({ ...errors, submit: "Failed to complete order. Please try again." });
      setIsProcessing(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Listing not found</p>
      </div>
    );
  }

  const cardType = getCardType(cardNumber);
  const verificationScore = listing.authenticityScore ?? 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Official Verification Alert (if available) */}
            {listing.verifiedByOfficial && listing.verificationSource && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-200">
                  Officially Verified
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  This listing has been officially verified by{" "}
                  <strong>{listing.verificationSource}</strong>. This is the highest level of
                  authenticity assurance.
                </AlertDescription>
              </Alert>
            )}

            {/* AI Verification Alert */}
            {verificationScore >= 80 && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  AI Verified Authentic
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Our AI authenticity verification scored this listing at{" "}
                  {verificationScore.toFixed(1)}%. You can purchase with confidence.
                </AlertDescription>
              </Alert>
            )}

            {verificationScore >= 50 && verificationScore < 80 && (
              <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                  Proceed with Caution
                </AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                  Our AI verification scored this listing at {verificationScore.toFixed(1)}%. We
                  recommend contacting the seller for additional verification before purchasing.
                </AlertDescription>
              </Alert>
            )}

            {verificationScore < 50 && verificationScore > 0 && (
              <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-800 dark:text-red-200">
                  Authenticity Concerns
                </AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300">
                  Our AI verification scored this listing at {verificationScore.toFixed(1)}%. We strongly
                  recommend requesting official verification before completing this purchase.
                </AlertDescription>
              </Alert>
            )}

            {/* No AI Verification Alert */}
            {verificationScore === 0 && !listing.verifiedByOfficial && (
              <Alert className="border-gray-300 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                <AlertCircle className="h-5 w-5 text-gray-500" />
                <AlertTitle className="text-gray-800 dark:text-gray-200">
                  Not AI Verified
                </AlertTitle>
                <AlertDescription className="text-gray-700 dark:text-gray-300">
                  This listing has not been verified by our AI authenticity system. Please exercise
                  caution and consider requesting verification before purchase.
                </AlertDescription>
              </Alert>
            )}

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Address</Label>
                  <Input
                    id="shippingAddress"
                    type="text"
                    placeholder="e.g., Block 123 Ang Mo Kio Ave 6, #08-1234"
                    value={shippingAddress}
                    onChange={(e) => {
                      setShippingAddress(e.target.value);
                      if (errors.shippingAddress) setErrors((prev) => ({ ...prev, shippingAddress: "" }));
                    }}
                    className={errors.shippingAddress ? "border-red-500" : ""}
                  />
                  {errors.shippingAddress && (
                    <p className="text-sm text-red-500">{errors.shippingAddress}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="postalCode"
                      type="text"
                      placeholder="e.g., 520123"
                      value={shippingPostalCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setShippingPostalCode(value);
                        if (errors.shipping) setErrors((prev) => ({ ...prev, shipping: "" }));
                        // Reset shipping info when postal code changes
                        if (shippingInfo) setShippingInfo(null);
                      }}
                      className={errors.shipping ? "border-red-500" : ""}
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void calculateShipping()}
                      disabled={isCalculatingShipping || shippingPostalCode.length !== 6}
                    >
                      {isCalculatingShipping ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Truck className="mr-2 h-4 w-4" />
                      )}
                      {isCalculatingShipping ? "Calculating..." : "Calculate Shipping"}
                    </Button>
                  </div>
                  {errors.shipping && (
                    <p className="text-sm text-red-500">{errors.shipping}</p>
                  )}
                </div>

                {shippingInfo && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Truck className="h-4 w-4 text-primary" />
                      {shippingInfo.tier} Delivery
                    </div>
                    {shippingInfo.buyerAddress && (
                      <p className="text-sm text-muted-foreground">
                        Nearest landmark: {shippingInfo.buyerAddress}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {shippingInfo.distance != null && `${shippingInfo.distance} km • `}
                        Est. {shippingInfo.estimate}
                      </span>
                      <span className="font-semibold text-primary">
                        S${shippingInfo.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Card Number */}
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className={errors.cardNumber ? "border-red-500" : ""}
                      />
                      {cardType && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {cardType === "visa" && (
                            <Image
                              src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/visa.svg"
                              alt="Visa"
                              width={40}
                              height={24}
                              className="h-6 w-auto"
                              unoptimized
                            />
                          )}
                          {cardType === "mastercard" && (
                            <Image
                              src="https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/mastercard.svg"
                              alt="Mastercard"
                              width={40}
                              height={24}
                              className="h-6 w-auto"
                              unoptimized
                            />
                          )}
                        </div>
                      )}
                    </div>
                    {errors.cardNumber && (
                      <p className="text-sm text-red-500">{errors.cardNumber}</p>
                    )}
                  </div>

                  {/* Cardholder Name */}
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      type="text"
                      placeholder="JOHN DOE"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value.toUpperCase());
                        if (errors.cardName) {
                          setErrors({ ...errors, cardName: "" });
                        }
                      }}
                      className={errors.cardName ? "border-red-500" : ""}
                    />
                    {errors.cardName && (
                      <p className="text-sm text-red-500">{errors.cardName}</p>
                    )}
                  </div>

                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                        className={errors.expiryDate ? "border-red-500" : ""}
                      />
                      {errors.expiryDate && (
                        <p className="text-sm text-red-500">{errors.expiryDate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={handleCvvChange}
                        className={errors.cvv ? "border-red-500" : ""}
                      />
                      {errors.cvv && <p className="text-sm text-red-500">{errors.cvv}</p>}
                    </div>
                  </div>

                  {/* Save Payment Checkbox / Saved Card Info */}
                  <div className="pt-4 border-t space-y-2">
                    {usingSavedCard && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Using saved card ending in {cardNumber.slice(-4)}
                        </span>
                        <button
                          type="button"
                          className="text-primary hover:underline text-sm"
                          onClick={async () => {
                            if (savedCardId) {
                              await fetch(`/api/saved-cards?id=${savedCardId}`, { method: "DELETE" });
                            }
                            setCardNumber("");
                            setCardName("");
                            setExpiryDate("");
                            setCvv("");
                            setUsingSavedCard(false);
                            setSavedCardId(null);
                          }}
                        >
                          Use a different card
                        </button>
                      </div>
                    )}
                    {!usingSavedCard && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="savePayment"
                          checked={savePayment}
                          onCheckedChange={(checked) => setSavePayment(checked === true)}
                        />
                        <label
                          htmlFor="savePayment"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Save payment information for future purchases
                        </label>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isProcessing || !shippingInfo}>
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isProcessing ? "Processing..." : `Pay $${(listing.price + (shippingInfo?.cost ?? 0)).toFixed(2)}`}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Your payment information is encrypted and secure
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={getFirstImage(listing)}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-semibold">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground">{listing.artist}</p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Item Price</span>
                    <span>${listing.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                      {shippingInfo
                        ? `S$${shippingInfo.cost.toFixed(2)}`
                        : "Enter postal code"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${(listing.price + (shippingInfo?.cost ?? 0)).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.replace(`/listings/${listing.id}`)}
                  className="text-sm text-primary hover:underline block text-center w-full"
                >
                  Back to listing
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
