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
          background: "linear-gradient(135deg, #1a1a1a 0%, #050505 50%, #1a1a1a 100%)",
          transition: "opacity 0.8s",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.05,
            backgroundImage: "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)",
            backgroundSize: "60px 60px",
            animation: "splashChecker 6s linear infinite",
          }} />
          <div style={{ position:"absolute", left:0, top:"25%", width:"100%", height:3, background:"linear-gradient(90deg, transparent, #EA580C, transparent)", animation:"splashSpeed 3s ease-out 0.5s both" }} />
          <div style={{ position:"absolute", left:0, top:"50%", width:"100%", height:2, background:"linear-gradient(90deg, transparent, #F97316, transparent)", animation:"splashSpeed 3s ease-out 1s both" }} />
          <div style={{ position:"absolute", left:0, top:"75%", width:"100%", height:3, background:"linear-gradient(90deg, transparent, #EA580C, transparent)", animation:"splashSpeed 3s ease-out 1.5s both" }} />
          <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{
              width: 140, height: 140, borderRadius: 36,
              background: "linear-gradient(135deg, #EA580C, #F97316)",
              boxShadow: "0 0 80px rgba(234,88,12,0.6), 0 0 160px rgba(234,88,12,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "splashLogo 1.5s cubic-bezier(0.16,1,0.3,1) both",
            }}>
              <img src="/logo-karting.png" alt="" width={120} height={120} style={{ objectFit: "contain" }} />
            </div>
            <h1 style={{
              marginTop: 28, fontSize: 40, fontWeight: 800, color: "white",
              letterSpacing: "-0.02em", textAlign: "center",
              animation: "splashText 1s cubic-bezier(0.16,1,0.3,1) 0.8s both",
            }}>Amigo Karting</h1>
            <p style={{
              marginTop: 10, fontSize: 14, fontWeight: 600, color: "#F97316",
              letterSpacing: "0.35em", textAlign: "center",
              animation: "splashText 1s cubic-bezier(0.16,1,0.3,1) 1.2s both",
            }}>PORTAIL DES EMPLOYÉS</p>
            <div style={{
              marginTop: 36, width: 220, height: 4, borderRadius: 4,
              background: "rgba(255,255,255,0.1)", overflow: "hidden",
              animation: "splashText 1s cubic-bezier(0.16,1,0.3,1) 1.6s both",
            }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: "linear-gradient(90deg, #EA580C, #F97316, #EA580C)",
                animation: "splashBar 2.5s ease-in-out 1.6s both",
              }} />
            </div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes splashLogo { from { opacity:0; transform:scale(0.2) translateY(40px); } to { opacity:1; transform:scale(1) translateY(0); } }
          @keyframes splashText { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes splashBar { from { width:0%; } to { width:100%; } }
          @keyframes splashSpeed { 0% { opacity:0; transform:translateX(-100%); } 30% { opacity:1; } 100% { opacity:0; transform:translateX(100%); } }
          @keyframes splashChecker { from { transform:translateX(0); } to { transform:translateX(60px); } }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('load', function() {
            setTimeout(function() {
              var s = document.getElementById('splash');
              if (s) { s.style.opacity = '0'; setTimeout(function() { s.remove(); }, 800); }
            }, 4000);
          });
        `}} />
        {children}
        <InstallBanner />
      </body>
    </html>
  );
}