"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-destructive/5 to-background px-4 py-12">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <Image
            src="/cadence-logo.png"
            alt="Cadence"
            width={280}
            height={112}
            className="h-20 w-auto sm:h-24"
          />
        </div>

        <h1 className="mb-4 text-6xl font-bold text-foreground">Oops!</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">Something went wrong</h2>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          We encountered an unexpected error. Don&apos;t worry, it&apos;s not your fault. Please try again.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-8 max-w-2xl rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-mono text-destructive">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <RefreshCw className="mr-2 h-5 w-5" />
            Try Again
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
