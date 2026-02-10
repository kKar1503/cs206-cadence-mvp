import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Disc3, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
      <div className="text-center">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Disc3 className="h-16 w-16 text-primary" />
        </div>

        <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/listings">
              <Search className="mr-2 h-5 w-5" />
              Browse Marketplace
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
