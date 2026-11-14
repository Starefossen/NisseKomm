import type { Metadata } from "next";
import { Geist, Geist_Mono, VT323 } from "next/font/google";
import { AppProvider } from "@/lib/app-context";
import { Tidsmaskin } from "@/components/ui/Tidsmaskin";
import { isLanMode } from "@/lib/mode";
import { connection } from "next/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  title: "NisseKomm - Kommandosenter",
  description:
    "Julekalendergåte for barn - Et retro kommandosenter for kritiske Snøfall-operasjoner",
  icons: {
    icon: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read NISSEKOMM_MODE at request time, not at build time.
  await connection();
  return (
    <html lang="no">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vt323.variable} antialiased`}
      >
        <AppProvider>{children}</AppProvider>
        {isLanMode() && <Tidsmaskin />}
      </body>
    </html>
  );
}
