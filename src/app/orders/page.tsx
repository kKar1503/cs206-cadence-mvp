"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, DollarSign, User, ShoppingBag, MessageCircle } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  amount: number;
  status: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    artist: string;
    images: string;
    imageUrl: string | null;
    price: number;
  };
  seller: {
    id: string;
    name: string | null;
    email: string;
  };
};

const getFirstImage = (images: string, imageUrl: string | null): string => {
  try {
    const parsed = JSON.parse(images) as string[];
    return parsed[0] ?? imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  } catch {
    return imageUrl ?? "https://placehold.co/400x400/fc6736/ffffff?text=No+Image";
  }
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callbackUrl=/orders");
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      void fetchOrders();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json() as Order[];
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            View and track all your purchases
          </p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                When you purchase items, they&apos;ll appear here
              </p>
              <Button asChild>
                <Link href="/listings">Browse Marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base font-semibold">
                        Order #{order.orderNumber}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={
                        order.status === "processing"
                          ? "default"
                          : order.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${order.amount.toFixed(2)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Link
                      href={`/listings/${order.listing.id}`}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={getFirstImage(order.listing.images, order.listing.imageUrl)}
                        alt={order.listing.title}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listings/${order.listing.id}`}
                        className="font-semibold hover:underline line-clamp-1"
                      >
                        {order.listing.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {order.listing.artist}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          Sold by{" "}
                          <Link
                            href={`/users/${order.seller.id}`}
                            className="text-primary hover:underline"
                          >
                            {order.seller.name ?? "Anonymous"}
                          </Link>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/listings/${order.listing.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const event = new CustomEvent("startNewChat", {
                            detail: { otherUserId: order.seller.id, listingId: order.listing.id }
                          });
                          window.dispatchEvent(event);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
