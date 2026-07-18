import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export const metadata = {

  title: "MyGrocery",
  description: "Family shopping list",
  manifest: "/manifest.json",

  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png"
  },
  appleWebApp: {
    capable: true,
    title: "MyGrocery",
    statusBarStyle: "default",
  }

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <link
          rel="apple-touch-startup-image"
          href="/apple-splash.png"
        />
        {children}</body>
    </html>
  );
}
