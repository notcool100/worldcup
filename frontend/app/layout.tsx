import "./globals.css";
import type { ReactNode } from "react";
import NavBar from "@/app/components/NavBar";

export const metadata = {
  title: "World Cup Draft Arena",
  description: "Multiplayer live-draft + live-match football sim",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@700;900&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavBar />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
