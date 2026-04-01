import { Clock } from "lucide-react";

interface ListingBadgesProps {
  createdAt?: string | Date;
  className?: string;
}

function getListingAge(createdAt: string | Date): string {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 31) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function ListingBadges({
  createdAt,
  className = "",
}: ListingBadgesProps) {
  if (!createdAt) return null;

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
      <Clock className="h-3 w-3" />
      <span>{getListingAge(createdAt)}</span>
    </div>
  );
}
