'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/**
 * PageTransition
 *
 * Strategy: intercept anchor‑tag clicks BEFORE Next.js navigates,
 * show the loader overlay immediately, then hide it once the new
 * pathname is active. This ensures the loader appears FIRST and the
 * new page only fades in after the loader disappears.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  // Track current pathname so click handler can compare
  const pathnameRef = useRef(pathname);

  // Keep ref in sync
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // ── Intercept clicks on internal <a> links ──────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Walk up the DOM to find the nearest <a> ancestor
      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== 'A') el = el.parentElement;
      if (!el) return;

      const anchor = el as HTMLAnchorElement;
      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore external, hash, mailto, and same‑page links
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href === pathnameRef.current
      ) return;

      // Show loader instantly on click
      setLoading(true);
    };

    // Use capture phase so we get the event before React handlers
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // ── Hide loader once the new route is active ────────────────────
  useEffect(() => {
    // Small delay so the page has time to mount before loader disappears
    const t = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      {/* ── Full-screen loader overlay ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="nav-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-surface"
          >
            {/* Ambient glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/15 rounded-full pointer-events-none"
              style={{ filter: 'blur(70px)' }}
            />

            <div className="relative z-10 flex flex-col items-center gap-5">
              {/* Spinning brand icon */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30"
              >
                <Sparkles className="w-7 h-7 text-white" />
              </motion.div>

              {/* Progress bar */}
              <div className="w-40 h-[3px] rounded-full bg-surface-container-highest overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              </div>

              <p className="text-on-surface-variant text-sm font-medium tracking-wide">
                Memuat halaman...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page content — fades in after loader disappears ── */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {children}
      </motion.div>
    </>
  );
}
