import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Green Acres Society",
  description: "Together we celebrate, participate and connect",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Deliberately no maximum-scale / user-scalable=no: capping pinch-zoom
  // fails WCAG 1.4.4.
  themeColor: "#0e7b78",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* Keyboard users can jump past the sticky header and tab bar. */}
        <a href="#main" className="u-skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
