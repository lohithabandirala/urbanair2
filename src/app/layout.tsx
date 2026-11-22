import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { SkipLink } from "@/components/SkipLink";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Saaf Hawa — Urban Air Quality Assistant",
  description:
    "Live air quality, a personalised day plan, indoor-air actions and an evidence-grounded assistant for families coping with winter smog.",
  applicationName: "Saaf Hawa",
  keywords: [
    "air quality",
    "AQI",
    "smog",
    "Delhi",
    "PM2.5",
    "indoor air",
    "sustainability",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Saaf Hawa — Urban Air Quality Assistant",
    description:
      "Live AQI, a personalised day plan and evidence-backed indoor-air actions.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <SkipLink />
          <Header />
          {children}
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
