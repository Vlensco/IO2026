'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LayoutDashboard, TerminalSquare } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <Link href="/" className="flex items-center space-x-2 text-white">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-xl tracking-wide">SIMULACRA</span>
        </Link>

        <div className="flex items-center space-x-6">
          {pathname === '/' && (
            <Link href="/auth" className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-full text-white text-sm font-semibold hover:bg-white/20 transition-all shadow-lg flex items-center space-x-2">
              <TerminalSquare className="w-4 h-4" />
              <span>Log In / Daftar</span>
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
