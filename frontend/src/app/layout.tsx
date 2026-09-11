import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased dark">
      <head>
        {/* Inter (300/400/500) + JetBrains Mono (300/400) — non-blocking, graceful degradation */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
