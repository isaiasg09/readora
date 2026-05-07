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

export const metadata: Metadata = {
  title: "Readora",
  description: "Gerador de README com IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen`}
      >
        {/* Navbar */}
        <nav className="border-b border-zinc-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              readora
            </Link>
            <div className="flex gap-6">
              <Link
                href="/"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Gerar
              </Link>

              <Link
                href="/history"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Histórico
              </Link>
            </div>
          </div>
        </nav>

        {/* Conteúdo sem largura máxima pra aproveitar a tela toda */}
        <main className="px-8 py-10">{children}</main>
      </body>
    </html>
  );
}
