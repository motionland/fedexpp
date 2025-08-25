import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import { Sidebar, SidebarProvider } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, AuthContext } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Receiving Track Logs",
  description: "Log FedEx tracking numbers daily",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/track-delivery.png" },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta
          name="apple-mobile-web-app-title"
          content="Receiving Track Logs"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <RealtimeProvider>
              <SidebarProvider defaultOpen={false}>
                <div className="flex min-h-screen">
                  <main className="flex-1">{children}</main>
                </div>
              </SidebarProvider>
            </RealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
