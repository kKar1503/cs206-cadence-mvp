import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.user.id;

    // Run all queries in parallel
    const [orders, listings, reviews] = await Promise.all([
      db.order.findMany({
        where: { sellerId },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              artist: true,
              images: true,
              price: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.listing.findMany({
        where: { sellerId },
        select: {
          id: true,
          title: true,
          artist: true,
          price: true,
          views: true,
          isSold: true,
          isPromoted: true,
          createdAt: true,
          images: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.review.findMany({
        where: { sellerId },
        select: { rating: true },
      }),
    ]);

    // Summary stats
    const completedOrders = orders.filter((o) => o.status === "completed" || o.status === "processing");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.sellerPayout ?? o.amount), 0);
    const totalSales = completedOrders.length;
    const activeListings = listings.filter((l) => !l.isSold).length;
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Revenue over time — last 6 months, padded with zeros
    const now = new Date();
    const months: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthRevenue = completedOrders
        .filter((o) => {
          const created = new Date(o.createdAt);
          return created.getFullYear() === year && created.getMonth() === month;
        })
        .reduce((sum, o) => sum + (o.sellerPayout ?? o.amount), 0);
      months.push({ month: label, revenue: Math.round(monthRevenue * 100) / 100 });
    }

    // Recent sales — last 10
    const recentSales = orders.slice(0, 10).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      sellerPayout: o.sellerPayout,
      sellerFee: o.sellerFee,
      status: o.status,
      createdAt: o.createdAt,
      listing: o.listing,
      buyer: o.buyer,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalSales,
        activeListings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
      },
      revenueOverTime: months,
      recentSales,
      listings,
    });
  } catch (error) {
    console.error("Error fetching seller analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller analytics" },
      { status: 500 },
    );
  }
}
