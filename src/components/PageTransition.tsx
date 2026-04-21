'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setLoading(true);
    setVisible(true);
    const t = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setVisible(false), 300);
    }, 400);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      {visible && (
        <div className={`fixed inset-0 z-[999] bg-slate-950 flex items-center justify-center transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium animate-pulse">Memuat halaman...</p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
