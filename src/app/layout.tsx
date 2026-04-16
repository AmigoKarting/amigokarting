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
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div id="splash" style={{
          position: "fixed", inset: 0, zIndex: 99999, display: "flex",
          alignItems: "center", justifyContent: "center", flexDirection: "column",
          background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)",
          transition: "opacity 0.5s",
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: 32,
            background: "linear-gradient(135deg, #EA580C, #F97316)",
            boxShadow: "0 0 60px rgba(234,88,12,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "splashLogo 0.8s cubic-bezier(0.16,1,0.3,1) both",
          }}>
            <img src="/logo-karting.png" alt="" width={100} height={100} style={{ objectFit: "contain" }} />
          </div>
          <h1 style={{
            marginTop: 24, fontSize: 32, fontWeight: 700, color: "white",
            letterSpacing: "-0.02em",
            animation: "splashText 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both",
          }}>Amigo Karting</h1>
          <p style={{
            marginTop: 8, fontSize: 12, fontWeight: 500, color: "#F97316",
            letterSpacing: "0.3em",
            animation: "splashText 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both",
          }}>PORTAIL DES EMPLOYÉS</p>
          <div style={{
            marginTop: 32, width: 200, height: 3, borderRadius: 4,
            background: "rgba(255,255,255,0.1)", overflow: "hidden",
            animation: "splashText 0.6s cubic-bezier(0.16,1,0.3,1) 0.7s both",
          }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: "linear-gradient(90deg, #EA580C, #F97316)",
              animation: "splashBar 1.5s ease-in-out 0.8s both",
            }} />
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes splashLogo { from { opacity:0; transform:scale(0.3) translateY(30px); } to { opacity:1; transform:scale(1) translateY(0); } }
          @keyframes splashText { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
          @keyframes splashBar { from { width:0%; } to { width:100%; } }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('load', function() {
            setTimeout(function() {
              var s = document.getElementById('splash');
              if (s) { s.style.opacity = '0'; setTimeout(function() { s.remove(); }, 500); }
            }, 500);
          });
        `}} />
        {children}
        <InstallBanner />
      </body>
    </html>
  );
}