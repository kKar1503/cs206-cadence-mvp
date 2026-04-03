"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Star,
  Plus,
  Eye,
  TrendingUp,
  Sparkles,
  Megaphone,
  Clock,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type AnalyticsData = {
  summary: {
    totalRevenue: number;
    totalSales: number;
    activeListings: number;
    averageRating: number;
    totalReviews: number;
  };
  revenueOverTime: Array<{ month: string; revenue: number }>;
  recentSales: Array<{
    id: string;
    orderNumber: string;
    sellerPayout: number | null;
    sellerFee: number | null;
    status: string;
    createdAt: string;
    listing: {
      id: string;
      title: string;
      artist: string;
      images: string;
      price: number;
    };
    buyer: {
      id: string;
      name: string | null;
    };
  }>;
  listings: Array<{
    id: string;
    title: string;
    artist: string;
    price: number;
    views: number;
    isSold: boolean;
    isPromoted: boolean;
    promotedUntil: string | null;
    createdAt: string;
    images: string;
  }>;
};

const getFirstImage = (images: string): string => {
  try {
    const parsed = JSON.parse(images) as string[];
    return parsed[0] ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  } catch {
    return "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case "processing":
      return <Badge variant="default">Processing</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getDaysRemaining = (promotedUntil: string | null): number => {
  if (!promotedUntil) return 0;
  const diff = new Date(promotedUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function SellerDashboardPage() {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callbackUrl=/seller");
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/seller/analytics");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = (await res.json()) as AnalyticsData;
        setData(json);
      } catch (error) {
        console.error("Error fetching seller analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchAnalytics();
  }, [status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load dashboard</p>
      </div>
    );
  }

  // Empty state
  if (data.listings.length === 0 && data.summary.totalSales === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8">
        <Card className="max-w-md mx-auto text-center !py-0 !gap-0 overflow-hidden">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Start Selling on Cadence</h2>
            <p className="text-muted-foreground">
              You haven&apos;t listed any items yet. Create your first listing to start selling
              and track your performance here.
            </p>
            <Button asChild>
              <Link href="/listings/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasRevenue = data.revenueOverTime.some((m) => m.revenue > 0);
  const promotedListings = data.listings.filter((l) => l.isPromoted);
  const nonPromotedActive = data.listings.filter((l) => !l.isPromoted && !l.isSold);
  const avgViewsPromoted = promotedListings.length > 0
    ? Math.round(promotedListings.reduce((s, l) => s + l.views, 0) / promotedListings.length)
    : 0;
  const avgViewsNonPromoted = nonPromotedActive.length > 0
    ? Math.round(nonPromotedActive.reduce((s, l) => s + l.views, 0) / nonPromotedActive.length)
    : 0;
  const viewsMultiplier = avgViewsNonPromoted > 0
    ? (avgViewsPromoted / avgViewsNonPromoted).toFixed(1)
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your sales and listing performance</p>
          </div>
          <Button asChild>
            <Link href="/listings/create">
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Link>
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: DollarSign, iconBg: "bg-green-100", iconColor: "text-green-700", value: `$${data.summary.totalRevenue.toFixed(2)}`, label: "Total Revenue" },
            { icon: ShoppingBag, iconBg: "bg-blue-100", iconColor: "text-blue-700", value: String(data.summary.totalSales), label: "Completed Sales" },
            { icon: Package, iconBg: "bg-purple-100", iconColor: "text-purple-700", value: String(data.summary.activeListings), label: "Active Listings" },
            { icon: Star, iconBg: "bg-yellow-100", iconColor: "text-yellow-700", value: data.summary.totalReviews > 0 ? `${data.summary.averageRating.toFixed(1)}/5` : "N/A", label: data.summary.totalReviews > 0 ? `From ${data.summary.totalReviews} review${data.summary.totalReviews !== 1 ? "s" : ""}` : "No reviews yet" },
          ].map((stat) => (
            <Card key={stat.label} className="!py-0 !gap-0 overflow-hidden border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold truncate">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Promotion Performance */}
        {promotedListings.length > 0 && (
          <Card className="mb-8 !py-0 !gap-0 overflow-hidden border-0 shadow-sm">
            <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Megaphone className="h-4 w-4 text-amber-700" />
                </div>
                <h3 className="font-semibold text-amber-900">Promotion Performance</h3>
              </div>
              <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {promotedListings.length} active
              </span>
            </div>
            <CardContent className="p-5">
              {/* Summary stats row */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="rounded-xl bg-amber-50/80 ring-1 ring-amber-200 p-4 text-center">
                  <Zap className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-amber-800">{avgViewsPromoted}</p>
                  <p className="text-xs text-amber-700">Avg Views (Promoted)</p>
                </div>
                <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 p-4 text-center">
                  <Eye className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-700">{avgViewsNonPromoted}</p>
                  <p className="text-xs text-gray-500">Avg Views (Regular)</p>
                </div>
                <div className="rounded-xl bg-green-50 ring-1 ring-green-200 p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">
                    {viewsMultiplier ? `${viewsMultiplier}x` : "—"}
                  </p>
                  <p className="text-xs text-green-600">Boost Multiplier</p>
                </div>
              </div>

              {/* Per-listing breakdown */}
              <div className="space-y-2">
                {promotedListings.map((listing) => {
                  const daysLeft = getDaysRemaining(listing.promotedUntil);
                  const totalDays = listing.promotedUntil
                    ? Math.ceil((new Date(listing.promotedUntil).getTime() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : 7;
                  const progress = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 100;

                  return (
                    <Link key={listing.id} href={`/listings/${listing.id}`} className="block">
                      <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={getFirstImage(listing.images)}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">{listing.title}</p>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-sm font-bold tabular-nums">{listing.views}</span>
                              <Eye className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className={`text-xs font-medium ${daysLeft <= 1 ? "text-red-600" : "text-gray-600"}`}>
                                {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Chart */}
        <Card className="mb-8 !py-0 !gap-0 overflow-hidden border-0 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              Revenue Over Time
            </CardTitle>
          </div>
          <CardContent className="p-5">
            {hasRevenue ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.revenueOverTime}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(value: number) => `$${value}`} />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--background))",
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
                <p>No sales data yet</p>
                <p className="text-xs">Revenue will appear here once you make sales</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tables */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <Card className="!py-0 !gap-0 overflow-hidden border-0 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-5 w-5 text-gray-500" />
                Recent Sales
              </CardTitle>
            </div>
            <CardContent className="p-0">
              {data.recentSales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead className="text-right">Payout</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <Link href={`/listings/${sale.listing.id}`} className="flex items-center gap-2 hover:underline">
                            <div className="relative h-8 w-8 rounded-lg overflow-hidden shrink-0">
                              <Image src={getFirstImage(sale.listing.images)} alt={sale.listing.title} fill className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{sale.listing.title}</p>
                              <p className="text-xs text-gray-500">{formatDate(sale.createdAt)}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{sale.buyer.name ?? "Unknown"}</TableCell>
                        <TableCell className="text-right">
                          <p className="text-sm font-medium">${(sale.sellerPayout ?? sale.listing.price).toFixed(2)}</p>
                          {sale.sellerFee != null && sale.sellerFee > 0 && (
                            <p className="text-xs text-gray-500">-${sale.sellerFee.toFixed(2)} fee</p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No sales yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listing Performance */}
          <Card className="!py-0 !gap-0 overflow-hidden border-0 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-gray-500" />
                Listing Performance
              </CardTitle>
            </div>
            <CardContent className="p-0">
              {data.listings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...data.listings]
                      .sort((a, b) => b.views - a.views)
                      .map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell>
                            <Link href={`/listings/${listing.id}`} className="hover:underline">
                              <p className="text-sm font-medium truncate">{listing.title}</p>
                              <p className="text-xs text-gray-500">{listing.artist}</p>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right text-sm">${listing.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{listing.views}</TableCell>
                          <TableCell>
                            {listing.isSold ? (
                              <Badge variant="secondary">Sold</Badge>
                            ) : listing.isPromoted ? (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Sparkles className="mr-1 h-3 w-3" />
                                Featured
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Package className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No listings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
