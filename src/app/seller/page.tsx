"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
    case "processing":
      return <Badge variant="default">Processing</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
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
        <p className="text-muted-foreground">Loading dashboard...</p>
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

  // Empty state — user has no listings and no sales
  if (data.listings.length === 0 && data.summary.totalSales === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8">
        <Card className="max-w-md mx-auto text-center">
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <Button asChild>
            <Link href="/listings/create">
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Link>
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${data.summary.totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.summary.totalSales}</p>
                  <p className="text-xs text-muted-foreground">Completed Sales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.summary.activeListings}</p>
                  <p className="text-xs text-muted-foreground">Active Listings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {data.summary.totalReviews > 0
                      ? `${data.summary.averageRating.toFixed(1)}/5`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.summary.totalReviews > 0
                      ? `From ${data.summary.totalReviews} review${data.summary.totalReviews !== 1 ? "s" : ""}`
                      : "No reviews yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasRevenue ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.revenueOverTime}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: number) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--background))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
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

        {/* Tables: Recent Sales + Listing Performance */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                            <div className="relative h-8 w-8 rounded overflow-hidden shrink-0">
                              <Image
                                src={getFirstImage(sale.listing.images)}
                                alt={sale.listing.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{sale.listing.title}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {sale.buyer.name ?? "Unknown"}
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="text-sm font-medium">
                            ${(sale.sellerPayout ?? sale.listing.price).toFixed(2)}
                          </p>
                          {sale.sellerFee != null && sale.sellerFee > 0 && (
                            <p className="text-xs text-muted-foreground">
                              -${sale.sellerFee.toFixed(2)} fee
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No sales yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listing Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Listing Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                              <p className="text-xs text-muted-foreground">{listing.artist}</p>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right text-sm">${listing.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm">{listing.views}</TableCell>
                          <TableCell>
                            {listing.isSold ? (
                              <Badge variant="secondary">Sold</Badge>
                            ) : listing.isPromoted ? (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                <Sparkles className="mr-1 h-3 w-3" />
                                Featured
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
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
