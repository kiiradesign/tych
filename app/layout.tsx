import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "dialkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemedDialRoot } from "@/components/themed-dial-root";

export const metadata: Metadata = {
  metadataBase: new URL("https://tych.kiira.in"),
  title: "Tych",
  description:
    "Recreate the classic Twitter polyptych as a single transparent PNG. Photographs never leave the browser.",
  openGraph: {
    title: "Tych",
    description:
      "Recreate the classic Twitter polyptych as a single transparent PNG. Photographs never leave the browser.",
    url: "https://tych.kiira.in",
    siteName: "Tych",
    type: "website",
    images: [
      {
        url: "/tych-opengraph.png",
        width: 1200,
        height: 630,
        alt: "Tych",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tych",
    description:
      "Recreate the classic Twitter polyptych as a single transparent PNG. Photographs never leave the browser.",
    images: ["/tych-opengraph.png"],
  },
  icons: {
    icon: [
      {
        url: "/tych-favicon-darkmode.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/tych-favicon-lightmode.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <ThemedDialRoot />
        </Providers>
      </body>
    </html>
  );
}
