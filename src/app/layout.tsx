import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { NavHeader } from "@/components/nav-header";

export const metadata: Metadata = {
  title: "Cadence - AI-Driven Music Marketplace Intelligence",
  description: "Empowering music collectors with AI-driven market intelligence to acquire vinyl, CDs, music merchandise, and turntables with confidence.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <Providers>
          <NavHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
