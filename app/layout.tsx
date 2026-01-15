import type { Metadata, Viewport } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0891b2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Sahara Support",
  description: "Your AI-powered support assistant for bookings and services",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sahara",
  },
  formatDetection: {
    telephone: false,
  },
};

import { ChatProvider } from "@/lib/chat/chat-context";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body
        className={`${geistMono.variable} font-sans antialiased`}
      >
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
