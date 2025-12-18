import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "DoseFinder",
  description:
    "A simple tool for calculating and scaling drug doses across different species",
};

// Inline script to prevent theme flash - runs before React hydration
const themeScript = `
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = theme === 'dark' || (!theme && prefersDark);
      document.documentElement.classList.toggle('dark', shouldBeDark);
    } catch (e) {
      // Fallback to light mode if theme detection fails
      try {
        document.documentElement.classList.remove('dark');
      } catch (_) {
        // If even this fails, let the browser's default styling apply
      }
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
