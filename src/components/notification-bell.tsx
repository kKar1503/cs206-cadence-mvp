"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Bell,
  DollarSign,
  ShoppingBag,
  ShieldCheck,
  Tag,
  Heart,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  listingId: string | null;
  orderId: string | null;
  createdAt: string;
};

const typeIcons: Record<string, React.ReactNode> = {
  LISTING_SOLD: <DollarSign className="h-4 w-4 text-green-600" />,
  ORDER_CONFIRMED: <ShoppingBag className="h-4 w-4 text-blue-600" />,
  FAVORITED_LISTING_SOLD: <Tag className="h-4 w-4 text-orange-600" />,
  LISTING_VERIFIED: <ShieldCheck className="h-4 w-4 text-purple-600" />,
  PRICE_CHANGED: <DollarSign className="h-4 w-4 text-amber-600" />,
  LISTING_UPDATED: <RefreshCw className="h-4 w-4 text-blue-500" />,
  NEW_FAVORITE: <Heart className="h-4 w-4 text-red-500" />,
};

export function NotificationBell() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = (await res.json()) as {
          notifications: Notification[];
          unreadCount: number;
        };
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // Silently fail — notifications are non-critical
      }
    };

    void fetchNotifications();
  }, [status]);

  const handleOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      // Mark all as read when dropdown opens
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAllRead: true }),
        });
      } catch {
        // Non-critical
      }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.listingId) {
      router.push(`/listings/${notification.listingId}`);
    } else if (notification.orderId) {
      router.push("/orders");
    }
    setIsOpen(false);
  };

  if (status !== "authenticated") return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {notifications.length > 0 && (
            <button
              onClick={async () => {
                setUnreadCount(0);
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true })),
                );
                try {
                  await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ markAllRead: true }),
                  });
                } catch {
                  // Non-critical
                }
              }}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                  !notification.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {typeIcons[notification.type] ?? (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{notification.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
