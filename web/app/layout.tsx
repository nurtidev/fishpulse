import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fishpulse-production.up.railway.app"),
  title: {
    default: "FishPulse — Открытая карта клёва",
    template: "%s | FishPulse",
  },
  description:
    "Бесплатный прогноз клёва для любой точки на карте. Солнечные и лунные периоды, давление, температура воды. Open-source fishing intelligence.",
  openGraph: {
    type: "website",
    siteName: "FishPulse",
    title: "FishPulse — Открытая карта клёва",
    description:
      "Бесплатный прогноз клёва для любой точки на карте. Солнечные и лунные периоды, давление, температура воды.",
  },
  twitter: {
    card: "summary",
    title: "FishPulse — Открытая карта клёва",
    description: "Бесплатный прогноз клёва для любой точки на карте.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
