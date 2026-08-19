import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "dialkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemedDialRoot } from "@/components/themed-dial-root";

export const metadata: Metadata = {
  title: "Tych",
  description:
    "Recreate the classic Twitter polyptych as a single transparent PNG. Photographs never leave the browser.",
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
