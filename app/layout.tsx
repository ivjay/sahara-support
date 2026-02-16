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
import { ServiceProvider } from "@/lib/services/service-context";
import { BookingProvider } from "@/lib/services/booking-context";
import { AuthProvider } from "@/lib/auth-context";

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
        <AuthProvider>
          <ServiceProvider>
            <BookingProvider>
              <ChatProvider>
                {children}
              </ChatProvider>
            </BookingProvider>
          </ServiceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
