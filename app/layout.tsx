import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SystemCommandListener } from "@/components/layout/system-command-listener";
import { GlobalConfirmDialog } from "@/components/ui/global-confirm-dialog";

export const metadata: Metadata = {
  title: "CADD Centre Lanka",
  description: "Academic & Student Management System - Institute Management System",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Cadd Centre",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background"
        style={{
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {children}
        <Toaster position="top-center" richColors />
        <SystemCommandListener />
        <GlobalConfirmDialog />
      </body>
    </html>
  );
}
