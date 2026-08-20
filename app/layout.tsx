import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "dialkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemedDialRoot } from "@/components/themed-dial-root";

const OG_IMAGE_VERSION = createHash("sha256")
  .update(readFileSync(join(process.cwd(), "public/tych-opengraph.png")))
  .digest("hex")
  .slice(0, 10);

const OG_IMAGE = {
  url: `/tych-opengraph.png?v=${OG_IMAGE_VERSION}`,
  width: 1200,
  height: 630,
  alt: "Tych",
  type: "image/png",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL("https://tych.kiira.in"),
  title: "Tych",
  description:
    "Make image grids for X(Twitter) posts.",
  openGraph: {
    title: "Tych",
    description:
      "Make image grids for X(Twitter) posts.",
    url: "https://tych.kiira.in",
    siteName: "Tych",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tych",
    description:
      "Make image grids for X(Twitter) posts.",
    images: [OG_IMAGE],
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
      <head>
        <link rel="preload" as="image" href="/placeholders/1.jpg" type="image/jpeg" />
        <link rel="preload" as="image" href="/placeholders/2.jpg" type="image/jpeg" />
        <link rel="preload" as="image" href="/placeholders/3.jpg" type="image/jpeg" />
        <link rel="preload" as="image" href="/placeholders/4.jpg" type="image/jpeg" />
      </head>
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
