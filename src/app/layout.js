import { Playpen_Sans_Arabic, Playwrite_HU, Winky_Sans } from "next/font/google";
import "../styles/globals.css";

const winkySans = Winky_Sans({
  variable: "--font-primary",
  subsets: ["latin"],
  preload: false,
  adjustFontFallback: false,
});

const playwriteHU = Playwrite_HU({
  variable: "--font-notes",
  preload: false,
});

const playpenSansArabic = Playpen_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  preload: false,
  adjustFontFallback: false,
});

export const metadata = {
  title: "OrthoConnect",
  description: "Outils de suivi et d'accompagnement orthophonique.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      dir="ltr"
      className={`${winkySans.variable} ${playwriteHU.variable} ${playpenSansArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
