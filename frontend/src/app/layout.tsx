import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/Inter-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Inter-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Inter-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Inter-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Smart Triage System | Next-Gen Healthcare",
  description: "A state-of-the-art smart triage system built with modern web technologies, providing seamless and efficient patient care.",
  keywords: ["Triage", "Healthcare", "Smart Health", "Next.js", "React"],
  authors: [{ name: "Smart Triage Team" }],
  openGraph: {
    title: "Smart Triage System",
    description: "Revolutionizing patient care with smart triage.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
