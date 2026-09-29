import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Gift, Sparkles, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Sorteo de Regalos | Intercambio de Amigo Secreto",
  description: "Organiza intercambios de regalos y sorteos de amigo secreto de forma fácil, con 3 opciones de regalo y notificaciones automáticas por correo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-festive-gradient flex flex-col min-h-screen text-slate-800 antialiased selection:bg-festive-100 selection:text-festive-900">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-festive-600 to-festive-400 flex items-center justify-center text-white shadow-md shadow-festive-500/20 group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5 animate-pulse-subtle" />
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-festive-700 via-festive-600 to-pine-700 bg-clip-text text-transparent">
                  Sorteo de Regalos
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-festive-50 text-festive-700 border border-festive-200">
                  Amigo Secreto
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-festive-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
              >
                Crear Sorteo
              </Link>
              <a
                href="#admin-login"
                className="text-sm font-semibold text-pine-700 bg-pine-50 hover:bg-pine-100 border border-pine-200 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-pine-600" />
                Acceso Admin
              </a>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/60 py-6 mt-12 text-center text-sm text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
              <span>Hecho con</span>
              <Heart className="w-3.5 h-3.5 text-festive-500 fill-festive-500" />
              <span>para intercambios y celebraciones por</span>
              <strong className="font-extrabold text-slate-800 tracking-wide">ASSEGURA AI SOLUTIONS</strong>
            </div>
            <p className="text-xs text-slate-400">
              &copy; 2026 Sorteo de Regalos • Privacidad garantizada
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
