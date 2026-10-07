import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "./lib/theme";

// Main text font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Monospace accents: wordmark, safety codes, venue codes, timestamps
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Obsidian Drop · Encrypted chat with people nearby",
    template: "%s · Obsidian Drop",
  },
  description:
    "Anonymous, end-to-end encrypted chat with whoever is on your Wi-Fi. No accounts, no history. Close the chat and it's gone.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      // The theme script sets data-theme before React hydrates
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
