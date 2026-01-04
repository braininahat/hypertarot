import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HyperTarot - Quantum Tarot Readings",
  description: "Tarot readings powered by quantum randomness from the Australian National University QRNG. Break free from your probability tunnel.",
  keywords: ["tarot", "quantum", "QRNG", "divination", "fatum", "randonautica"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-starfield">
        {children}
      </body>
    </html>
  );
}
