"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SessionValidator() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Only run if user is authenticated
    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    const validateSession = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const response = await fetch("/api/auth/validate-session");
        const data = await response.json() as { valid: boolean; reason?: string };

        if (!data.valid && data.reason === "user_not_found") {
          // User no longer exists in database - show alert and sign out
          alert("Your session has expired because your account was removed from the system. Please sign in again.");
          await signOut({ redirect: false });
          router.push("/auth/signin");
        }
      } catch (error) {
        console.error("Error validating session:", error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Validate on window focus
    const handleFocus = () => {
      void validateSession();
    };

    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [session, status, router]);

  return null;
}
