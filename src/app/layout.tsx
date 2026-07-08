import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Aurora University — Learn boldly. Build what matters.",
    template: "%s · Aurora University",
  },
  description:
    "Aurora University is a NAAC A++ multidisciplinary university in Bengaluru offering engineering, management, sciences and humanities programs powered by the UnivOS platform.",
  keywords: ["Aurora University", "admissions", "B.Tech", "MBA", "Bengaluru", "university"],
  openGraph: {
    title: "Aurora University",
    description: "Learn boldly. Build what matters. Admissions 2026–27 are open.",
    type: "website",
  },
};

const themeInit = `(function(){try{var t=localStorage.getItem("univos-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} min-h-screen`}>{children}</body>
    </html>
  );
}
