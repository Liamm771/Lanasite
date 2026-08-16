import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Meie_Script } from "next/font/google";
import "./globals.css";

// 1. Déclaration des polices
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const meieScript = Meie_Script({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-meie-script", 
});

// 2. Déclaration de la PWA et des métadonnées
export const metadata: Metadata = {
  title: "Maison",
  description: "Application de gestion des tâches de la maison",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Maison",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  colorScheme: "light", // Bloque le passage en mode sombre
};

// 3. Structure principale (RootLayout)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} ${meieScript.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}