import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChartOracle Pro — Institutional Chart Intelligence",
  description:
    "Upload or capture a TradingView chart and receive a disciplined, evidence-bounded technical market briefing.",
  applicationName: "ChartOracle Pro",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#07110f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
