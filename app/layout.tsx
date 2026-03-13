import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

import Providers from "./providers";
import "./globals.css";
import AuthProvider from "./AuthProvider";
import "@/utils/consoleOverride";
import ConsoleProvider from "@/utils/ConsoleProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat-Box",
  description: "Social Media Chat Application",
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
        <ConsoleProvider>
          <Toaster richColors position="top-center" duration={3000} />
          <Providers>
            <AuthProvider>{children}</AuthProvider>
          </Providers>
        </ConsoleProvider>
      </body>
    </html>
  );
}
