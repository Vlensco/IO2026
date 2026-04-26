'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';

// ─── NumberTicker ──────────────────────────────────────────────────
interface NumberTickerProps {
  value: number;
  className?: string;
  delay?: number;
  suffix?: string;
  prefix?: string;
  formatK?: boolean; // if true, display 45200 as 45.2K
}

export function NumberTicker({
  value,
  className = '',
  delay = 0,
  suffix = '',
  prefix = '',
  formatK = false,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      const duration = 1500;
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        setDisplayed(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isInView, value, delay]);

  const format = (v: number) => {
    if (formatK && v >= 1000) {
      const k = v / 1000;
      return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    }
    return v.toString();
  };

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{format(displayed)}{suffix}
    </span>
  );
}

// ─── BlurFade ──────────────────────────────────────────────────────
interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  inView?: boolean;
  yOffset?: number;
  blur?: string;
}

export function BlurFade({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  inView = true,
  yOffset = 16,
  blur = '10px',
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldAnimate = inView ? isInView : true;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      animate={shouldAnimate ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

// ─── WordRotate ────────────────────────────────────────────────────
interface WordRotateProps {
  words: string[];
  className?: string;      // applied to wrapper span
  textClassName?: string;  // applied to inner text span (needed for bg-clip-text)
  duration?: number;
}

export function WordRotate({ words, className = '', textClassName = '', duration = 2500 }: WordRotateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, duration);
    return () => clearInterval(interval);
  }, [words.length, duration]);

  return (
    <span className={`inline relative ${className}`} style={{ verticalAlign: 'baseline' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          style={{ display: 'inline' }}
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ─── AnimatedGradientText ─────────────────────────────────────────
export function AnimatedGradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%] bg-clip-text text-transparent animate-gradient-x ${className}`}
    >
      {children}
    </span>
  );
}

// ─── ShimmerButton ────────────────────────────────────────────────
export function ShimmerButton({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      className={`relative overflow-hidden rounded-2xl ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </motion.button>
  );
}
