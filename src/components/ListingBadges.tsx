import { Badge } from "@/components/ui/badge";
import { TrendingDown, Megaphone, Clock } from "lucide-react";

interface ListingBadgesProps {
  isPromoted?: boolean;
  priceLabel?: string | null;
  createdAt?: string | Date;
  className?: string;
}

export function ListingBadges({
  isPromoted,
  priceLabel,
  createdAt,
  className = "",
}: ListingBadgesProps) {
  const badges: React.ReactNode[] = [];

  // "New" badge — listed within 48 hours
  if (createdAt) {
    const created = new Date(createdAt);
    const hoursAgo = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 48) {
      badges.push(
        <Badge
          key="new"
          variant="secondary"
          className="gap-1 bg-blue-500/10 text-blue-600 border-blue-200"
        >
          <Clock className="h-3 w-3" />
          New
        </Badge>,
      );
    }
  }

  // "Great Deal" badge
  if (priceLabel === "UNDERPRICED") {
    badges.push(
      <Badge
        key="deal"
        variant="secondary"
        className="gap-1 bg-green-500/10 text-green-600 border-green-200"
      >
        <TrendingDown className="h-3 w-3" />
        Great Deal
      </Badge>,
    );
  }

  // "Promoted" badge
  if (isPromoted) {
    badges.push(
      <Badge
        key="promoted"
        variant="secondary"
        className="gap-1 bg-amber-500/10 text-amber-600 border-amber-200"
      >
        <Megaphone className="h-3 w-3" />
        Featured
      </Badge>,
    );
  }

  if (badges.length === 0) return null;

  return <div className={`flex flex-wrap gap-1.5 ${className}`}>{badges}</div>;
}
