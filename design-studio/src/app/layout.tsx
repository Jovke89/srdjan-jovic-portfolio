import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Fonts from srdjan-jovic.com START */
const syne = localFont({
  src: "./fonts/Syne-ExtraBold.woff2",
  weight: "800",
  variable: "--font-syne",
  display: "swap",
});

const splineMono = localFont({
  src: "./fonts/SplineSansMono-Regular.woff2",
  weight: "400",
  variable: "--font-spline-mono",
  display: "swap",
});
/* Fonts from srdjan-jovic.com END */

export const metadata: Metadata = {
  title: { default: "Design Studio", template: "%s | Design Studio" },
  description: "Private sitemap and copy workspace.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#060501",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${syne.variable} ${splineMono.variable}`}>
      {/* Browser extensions (e.g. ColorZilla) inject body attributes before hydration */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
