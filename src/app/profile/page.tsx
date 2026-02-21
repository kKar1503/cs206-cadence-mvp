"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfileRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callbackUrl=/profile");
      return;
    }
    if (session?.user?.id) {
      router.replace(`/users/${session.user.id}`);
    }
  }, [session, status, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <p className="text-muted-foreground">Loading your profile...</p>
    </div>
  );
}
