import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  Sparkles,
  BarChart3,
  Users,
  Heart,
  Disc3,
  Target,
  Lightbulb,
} from "lucide-react";
import { StaggeredGrid } from "@/components/ui/fade-in-section";

export const metadata = {
  title: "About - Cadence",
  description:
    "Learn about Cadence, the AI-verified marketplace built by collectors, for collectors.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Built by collectors, for collectors
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Cadence was born from a simple frustration: buying vinyl online
              shouldn&apos;t feel like a gamble. We&apos;re building the
              marketplace we always wished existed — one where authenticity is
              verified, prices are transparent, and every collector can trade
              with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Our Story
              </h2>
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                Every vinyl collector knows the feeling — you find a rare
                pressing online, the photos look right, the price seems fair,
                but something nags at you. <em>Is it authentic? Am I overpaying?
                Can I trust this seller?</em>
              </p>
              <p>
                We&apos;ve been there too. After one too many questionable
                purchases and hours spent cross-referencing prices across
                platforms, we decided to build something better. Cadence
                combines AI-powered verification technology with real-time
                market data to bring transparency and trust to the vinyl
                marketplace.
              </p>
              <p>
                What started as a side project between music lovers has grown
                into a community of thousands of collectors who share our
                belief: the joy of collecting should be in the music, not in
                worrying about getting ripped off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              What Drives Us
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Every decision we make comes back to these core principles
            </p>
          </div>

          <StaggeredGrid className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="flex gap-4 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">Trust First</h3>
                  <p className="text-muted-foreground">
                    Every feature we build starts with one question: does this
                    make our marketplace more trustworthy? From AI verification
                    to seller ratings, trust isn&apos;t a feature — it&apos;s
                    our foundation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="flex gap-4 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">
                    Radical Transparency
                  </h3>
                  <p className="text-muted-foreground">
                    No hidden fees, no opaque pricing. We show you exactly how a
                    listing compares to the wider market so you can make
                    informed decisions every time.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="flex gap-4 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">
                    Community Over Commerce
                  </h3>
                  <p className="text-muted-foreground">
                    Cadence is a community of people who genuinely love music.
                    We design for collectors first and transactions second,
                    because great marketplaces are built on shared passion.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="flex gap-4 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">
                    AI With Purpose
                  </h3>
                  <p className="text-muted-foreground">
                    We use AI where it genuinely helps — verifying authenticity,
                    surfacing fair prices, and matching collectors with records
                    they&apos;ll love. Technology should serve the hobby, not
                    complicate it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </StaggeredGrid>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              What Makes Cadence Different
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              We&apos;re not just another marketplace — we&apos;re rethinking
              how collectors buy and sell
            </p>
          </div>

          <StaggeredGrid className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">
                AI Authenticity Verification
              </h3>
              <p className="text-muted-foreground">
                Our computer vision AI analyzes listing photos to detect
                counterfeits, bootlegs, and condition issues — giving you a
                confidence score before you buy.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">
                Real-Time Price Intelligence
              </h3>
              <p className="text-muted-foreground">
                We aggregate pricing data across platforms so you can see
                exactly where a listing stands relative to the market. No more
                guesswork.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">
                Smart Recommendations
              </h3>
              <p className="text-muted-foreground">
                Our recommendation engine learns your taste and surfaces records
                you&apos;ll love — including rare finds you might have missed.
              </p>
            </div>
          </StaggeredGrid>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <StaggeredGrid className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">10,000+</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verified Listings
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">5,000+</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Trusted Collectors
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">98%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verification Accuracy
                </p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">25%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Average Savings
                </p>
              </div>
            </StaggeredGrid>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              A Team of Collectors
            </h2>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              Cadence is built by a small team of music lovers, engineers, and
              vinyl enthusiasts based in Singapore. We spend our weekends crate
              digging and our weekdays building the tools we wish we had. Every
              feature is informed by our own experience as collectors — because
              the best products come from people who use them.
            </p>
            <div className="flex justify-center gap-3">
              <Disc3 className="h-5 w-5 text-primary/60" />
              <Disc3 className="h-5 w-5 text-primary/60" />
              <Disc3 className="h-5 w-5 text-primary/60" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Join the community
            </h2>
            <p className="mb-10 text-lg text-muted-foreground">
              Whether you&apos;re a seasoned collector or just getting into
              vinyl, Cadence is the marketplace that has your back. Sign up free
              and start exploring.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg" asChild>
                <Link href="/auth/signup">Create Free Account</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg" asChild>
                <Link href="/listings">Browse Marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
