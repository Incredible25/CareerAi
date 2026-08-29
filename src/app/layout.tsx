import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "3Doors — Access. Excellence. Opportunity.",
    template: "%s · 3Doors",
  },
  description:
    "A personal AI career navigator for students, graduates, and young professionals in Africa — from self-discovery to career direction, skills, and opportunity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
