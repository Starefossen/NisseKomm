import type { Metadata, Viewport } from "next";
import { PwaRegistrering } from "./pwa";

export const metadata: Metadata = {
  title: "Nissemor-guiden",
  manifest: "/nissemor-guide/manifest.webmanifest",
  icons: { apple: "/nissemor-guide/ikon-180.png" },
  appleWebApp: {
    capable: true,
    title: "Nissemor-guiden",
    statusBarStyle: "black-translucent",
  },
};

// Same as --varm-bg in globals.css (a manifest/meta value cannot read a CSS variable).
export const viewport: Viewport = { themeColor: "#120c08" };

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PwaRegistrering />
    </>
  );
}
