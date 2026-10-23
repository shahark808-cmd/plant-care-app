import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });

export const metadata: Metadata = {
  title: "התקציב שלנו",
  description: "תקציב זוגי: פרטי ומשותף, בלי אשמה",
  appleWebApp: { capable: true, title: "התקציב שלנו", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1515" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
