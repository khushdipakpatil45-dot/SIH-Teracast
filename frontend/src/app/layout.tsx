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
  title: "TERRACAST-NER | AI-Powered Landslide Early Warning & Disaster Command Center",
  description: "MDoNER Problem Statement 26001: All-Weather InSAR + PINN Geotechnical Hazard Early Warning & Corridor Routing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">{children}</body>
    </html>
  );
}
