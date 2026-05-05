// Standard Google Fonts links are added in the <head> to bypass build-time fetch issues.

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Script from "next/script";
import GoogleOneTap from "@/components/GoogleOneTap";

export const metadata: Metadata = {
  title: "Bewa Homes | Short-Stay Marketplace & PMS",
  description: "Experience luxury short-stays, premium land plots, and high-end interior services all in one place. Manage your properties with our professional suite of tools.",
  keywords: ["short-stay", "marketplace", "real estate", "land for sale", "interior decoration", "PMS", "property management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Playfair+Display:wght@400..900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#004d40" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-inter-variable font-playfair-variable" suppressHydrationWarning>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LC2LYNSESH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-LC2LYNSESH');
          `}
        </Script>
        <ThemeProvider>
          <AuthProvider>
            <GoogleOneTap />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
