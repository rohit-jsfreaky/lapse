import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../../fonts/SchibstedGrotesk-400.woff", weight: "400" },
    { path: "../../fonts/SchibstedGrotesk-500.woff", weight: "500" },
    { path: "../../fonts/SchibstedGrotesk-600.woff", weight: "600" },
    { path: "../../fonts/SchibstedGrotesk-700.woff", weight: "700" },
    { path: "../../fonts/SchibstedGrotesk-800.woff", weight: "800" },
  ],
  variable: "--font-schibsted",
});
const mono = localFont({
  src: [
    { path: "../../fonts/GeistMono-400.woff", weight: "400" },
    { path: "../../fonts/GeistMono-600.woff", weight: "600" },
  ],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Lapse · Every certificate on your domain, and the ones that won't renew",
  description:
    "Let's Encrypt stopped sending expiry emails. Lapse reads every certificate for your domain from Certificate Transparency, asks each host what it really serves, and tells you which renewals are stuck. Built with Hyper Elements.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
