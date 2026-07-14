import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sistem eAduan Kerosakan ICT | ADTEC JTM Kampus Pasir Gudang",
  description:
    "Sistem pengurusan aduan kerosakan ICT berintegrasi AI (GLM 5.2) untuk ADTEC JTM Kampus Pasir Gudang - Jabatan Tenaga Manusia.",
  keywords: [
    "eAduan", "ICT", "ADTEC", "JTM", "Kerosakan", "Jabatan Tenaga Manusia",
    "Pasir Gudang", "Complaint Management", "Glassmorphism",
  ],
  authors: [{ name: "Unit ICT, ADTEC JTM Kampus Pasir Gudang" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased min-h-screen`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
