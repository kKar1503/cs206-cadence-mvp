import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disc3, ShieldCheck, Search, Sparkles, Package, CheckCircle2, BarChart3 } from "lucide-react";
import { StaggeredGrid } from "@/components/ui/fade-in-section";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <Disc3 className="h-14 w-14 text-primary sm:h-16 sm:w-16" />
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Cadence
              </h1>
            </div>
            <h2 className="mb-6 text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Where every record comes with peace of mind
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              The AI-verified marketplace for vinyl collectors. Buy and sell with confidence
              using our authenticity verification, real-time price insights, and smart recommendations.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg" asChild>
                <Link href="/auth/signup">Start Collecting</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg" asChild>
                <Link href="/listings">Browse Listings</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 grid grid-cols-3 gap-8 border-t pt-12">
              <div>
                <p className="text-3xl font-bold text-primary">10,000+</p>
                <p className="text-sm text-muted-foreground">Verified Listings</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">5,000+</p>
                <p className="text-sm text-muted-foreground">Trusted Collectors</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">25%</p>
                <p className="text-sm text-muted-foreground">Average Savings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              How Cadence Works
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Four simple steps to buying and selling vinyl with confidence
            </p>
          </div>

          <StaggeredGrid className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">1. Search & Discover</h3>
              <p className="text-sm text-muted-foreground">
                Browse thousands of verified vinyl listings. Get smart recommendations based on your taste.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">2. Verify Authenticity</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes each listing for authenticity. Look for the verified checkmark.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">3. Compare Prices</h3>
              <p className="text-sm text-muted-foreground">
                See real-time market insights and price comparisons across platforms.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">4. Buy or Sell</h3>
              <p className="text-sm text-muted-foreground">
                Complete your purchase securely, or list your own collection with confidence.
              </p>
            </div>
          </StaggeredGrid>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Why Collectors Choose Cadence
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Powerful features designed to protect your investment and enhance your collecting experience
            </p>
          </div>

          <StaggeredGrid className="grid gap-8 md:grid-cols-3">
            <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">AI-Powered Authenticity Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Every listing analyzed by our computer vision AI, trained in collaboration with industry professionals.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Instant authenticity probability scores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Official verification service available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Verified checkmark for trusted sellers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Real-Time Market Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Never overpay again. Compare prices across platforms and understand true market value.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Internal and external price comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Historical pricing trends and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Fair price indicators on every listing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Smart Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  Discover your next favorite record with personalized suggestions based on your searches.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>AI-curated recommendations for you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Based on your browsing and taste</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Discover rare finds before they sell out</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </StaggeredGrid>
        </div>
      </section>

      {/* For Buyers & Sellers Section */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Built For Buyers and Sellers
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Whether you&apos;re growing your collection or listing your own vinyl, Cadence has you covered
            </p>
          </div>

          <StaggeredGrid className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
            {/* For Buyers */}
            <div>
              <div className="mb-6">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">For Buyers</h3>
                <p className="text-muted-foreground">
                  Shop with confidence knowing every purchase is protected by our AI verification system.
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Verified Authenticity</p>
                    <p className="text-sm text-muted-foreground">
                      Buy only from verified listings or request our official verification service
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Price Transparency</p>
                    <p className="text-sm text-muted-foreground">
                      See how each listing compares to market prices across all platforms
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Personalized Discovery</p>
                    <p className="text-sm text-muted-foreground">
                      Get recommendations tailored to your taste and search history
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Secure Transactions</p>
                    <p className="text-sm text-muted-foreground">
                      Protected checkout with buyer guarantees and dispute resolution
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* For Sellers */}
            <div>
              <div className="mb-6">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">For Sellers</h3>
                <p className="text-muted-foreground">
                  List your collection and reach thousands of verified buyers actively searching for vinyl.
                </p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Get Verified</p>
                    <p className="text-sm text-muted-foreground">
                      Prove authenticity with our verification service and earn the trusted checkmark
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Smart Pricing</p>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered pricing suggestions based on current market data
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Increased Visibility</p>
                    <p className="text-sm text-muted-foreground">
                      Your listings appear in personalized recommendations for relevant buyers
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold">Easy Management</p>
                    <p className="text-sm text-muted-foreground">
                      Simple listing tools and dashboard to track your sales and inventory
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </StaggeredGrid>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="border-t bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ready to start collecting with confidence?
            </h2>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
              Join thousands of collectors who trust Cadence for authentic vinyl and smart market insights.
              Sign up free and get access to verified listings today.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg" asChild>
                <Link href="/auth/signup">Create Free Account</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg" asChild>
                <Link href="/listings">Browse Listings</Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              No credit card required • Free to browse • Start buying or selling today
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-center gap-3">
              <Disc3 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Cadence</span>
            </div>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              The AI-verified marketplace for vinyl collectors. Buy and sell with confidence.
            </p>
            <div className="border-t pt-8 text-center text-sm text-muted-foreground">
              <p>© 2026 Cadence. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
