'use client';

import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%'.split('');
const rand = () => CHARS[Math.floor(Math.random() * CHARS.length)];

interface HyperTextProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  startOnView?: boolean;
  animateOnHover?: boolean;
}

export function HyperText({
  children,
  className = '',
  duration = 900,
  delay = 0,
  startOnView = false,
  animateOnHover = true,
}: HyperTextProps) {
  const [displayText, setDisplayText] = useState<string[]>(children.split(''));
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  const trigger = () => { if (!isAnimating) setIsAnimating(true); };

  useEffect(() => {
    if (startOnView) {
      const observer = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setTimeout(() => setIsAnimating(true), delay); observer.disconnect(); } },
        { threshold: 0.1 }
      );
      if (elementRef.current) observer.observe(elementRef.current);
      return () => observer.disconnect();
    } else {
      const t = setTimeout(() => setIsAnimating(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay, startOnView]);

  useEffect(() => {
    if (!isAnimating) return;
    const startTime = performance.now();
    let rafId: number;
    const go = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const revealed = Math.floor(progress * children.length);
      setDisplayText(
        children.split('').map((char, i) =>
          char === ' ' ? ' ' : i < revealed ? char : rand()
        )
      );
      if (progress < 1) {
        rafId = requestAnimationFrame(go);
      } else {
        setDisplayText(children.split(''));
        setIsAnimating(false);
      }
    };
    rafId = requestAnimationFrame(go);
    return () => cancelAnimationFrame(rafId);
  }, [isAnimating, children, duration]);

  return (
    <span
      ref={elementRef}
      className={`inline-block font-mono ${className}`}
      onMouseEnter={animateOnHover ? trigger : undefined}
    >
      {displayText.map((char, i) => (
        <span key={i} className={char === ' ' ? 'inline-block w-[0.35em]' : 'inline-block'}>
          {char}
        </span>
      ))}
    </span>
  );
}
