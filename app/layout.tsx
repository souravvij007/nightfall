import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nightfall — Making friends isn't hard anymore",
  description:
    "The after-dark social club for Gen Z. Play games in live rooms, hit real meetups, travel with strangers who get you. Level up, unlock more.",
  openGraph: {
    title: "Nightfall — Making friends isn't hard anymore",
    description:
      "The after-dark social club for Gen Z. Live rooms, real meetups, stranger trips. Level up, unlock more.",
    siteName: "Nightfall",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col pb-16 sm:pb-0">
        {children}
      </body>
    </html>
  );
}
