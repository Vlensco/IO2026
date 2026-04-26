import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIMULOKA | AI Simulator",
  description: "Kuasai soft-skill sebelum memasuki dunia kerja nyata. Simuloka menghadirkan roleplay imersif berbasis AI.",
};

import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import { ThemeProvider } from "@/components/ThemeProvider";
import SplashScreen from "@/components/SplashScreen";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider defaultTheme="dark">
          <SplashScreen />
          <PageTransition>
            <Navbar />
            {children}
          </PageTransition>
        </ThemeProvider>
      </body>
    </html>
  );
}
