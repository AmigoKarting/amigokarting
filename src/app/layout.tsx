import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { InstallBanner } from "@/components/layout/InstallBanner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#EA580C",
};

export const metadata: Metadata = {
  title: "Amigo Karting — Portail Employés",
  description: "Formation et gestion des employés d'Amigo Karting",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Amigo Karting",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
        <InstallBanner />
      </body>
    </html>
  );
}
