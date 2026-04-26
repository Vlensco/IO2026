'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, TerminalSquare, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Pages where we never show logout (only login/register)
  const isPublicPage = pathname === '/' || pathname === '/auth';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-surface-container-highest bg-surface-container/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link href="/" className="flex items-center space-x-2 text-on-surface">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-xl tracking-wide">SIMULOKA</span>
        </Link>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* Show login button when: not logged in OR on public pages */}
          {(!session || isPublicPage) && pathname !== '/auth' && (
            <Link href="/auth" className="px-5 py-2.5 bg-primary border border-primary-container rounded-full text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg flex items-center space-x-2">
              <TerminalSquare className="w-4 h-4" />
              <span>Log In / Daftar</span>
            </Link>
          )}

          {/* Show logout ONLY when logged in and NOT on public pages */}
          {session && !isPublicPage && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-error hover:bg-error/10 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
