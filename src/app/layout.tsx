import LoginButton from "@/components/LoginButton";
import Providers from "@/components/Providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Native static metadata export automatically parsed by Next.js App Router root layout.
// Automatically resolves src/app/icon.png as the standard workspace favicon artifact without manual link tags.
export const metadata: Metadata = {
  title: "Readora",
  description: "AI-Powered Premium README Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Premium tailored gradient canvas spanning absolute block heights dynamically */}
      {/* Decoupling standard static backgrounds to yield vibrant curated multi-stop palettes */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-linear-to-br from-slate-950 to-indigo-950 text-white min-h-screen selection:bg-indigo-500 selection:text-white`}
      >
        <Providers>
          {/* Navigation bar with native glassmorphism aesthetics */}
          {/* Enforcing sticky display logic alongside hardware-accelerated backdrop desaturation filters */}
          <nav className="border-b border-white/10 bg-slate-950/40 backdrop-blur-md px-8 py-4 sticky top-0 z-50">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <Link
                href="/"
                className="text-lg font-bold tracking-tight bg-linear-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent"
              >
                readora
              </Link>
              <div className="flex items-center gap-8">
                <div className="flex gap-6">
                  <Link
                    href="/generate"
                    className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Generate
                  </Link>

                  <Link
                    href="/history"
                    className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    History
                  </Link>
                </div>
                <div className="w-px h-4 bg-zinc-700" />
                <LoginButton />
              </div>
            </div>
          </nav>

          {/* Primary central application viewport wrapper */}
          {/* Leaving layout boundary decoupled to let interactive child blocks allocate flexible responsive spacing */}
          <main className="px-8 py-10 w-full">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
