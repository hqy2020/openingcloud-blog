import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { AuroraBackground } from '../ui/AuroraBackground';
import { useReducedMotion } from '../hooks/useReducedMotion';

const phrases = ['云上牧场，日有所进', '代码如诗，生活如画', '每一行代码都是成长的痕迹'];

function TypewriterText() {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setText(phrases[0]);
      return;
    }

    const phrase = phrases[phraseIndex];

    if (!isDeleting) {
      if (charIndex < phrase.length) {
        const timeout = setTimeout(() => {
          setText(phrase.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 100);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsDeleting(true), 2500);
        return () => clearTimeout(timeout);
      }
    } else {
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setText(phrase.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 40);
        return () => clearTimeout(timeout);
      } else {
        setIsDeleting(false);
        setPhraseIndex((phraseIndex + 1) % phrases.length);
      }
    }
  }, [charIndex, isDeleting, phraseIndex, reduced]);

  return (
    <span>
      {text}
      <motion.span
        className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-text-bottom"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
      />
    </span>
  );
}

// SVG 云朵组件 (fallback / always present)
function CloudSVG({
  className,
  speed,
}: {
  className: string;
  speed: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed]);

  return (
    <motion.div className={className} style={{ y }}>
      <svg viewBox="0 0 160 96" fill="currentColor" className="w-full h-full">
        <ellipse cx="80" cy="56" rx="60" ry="28" />
        <ellipse cx="56" cy="42" rx="36" ry="24" />
        <ellipse cx="104" cy="38" rx="40" ry="26" />
      </svg>
    </motion.div>
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scrollIndicatorY = useTransform(scrollYProgress, [0, 0.3], [0, 20]);

  return (
    <section ref={sectionRef} className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Aurora 背景 */}
      <AuroraBackground className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50 via-white to-white dark:from-primary-900/20 dark:via-bg-dark dark:to-bg-dark" />
      </AuroraBackground>

      {/* 装饰云层 — Framer Motion 视差 */}
      <div className="absolute inset-0 pointer-events-none">
        <CloudSVG
          className="absolute top-[15%] left-[8%] w-48 h-28 text-primary-200/30 dark:text-primary-700/15"
          speed={0.3}
        />
        <CloudSVG
          className="absolute top-[25%] right-[5%] w-36 h-20 text-primary-200/25 dark:text-primary-700/12"
          speed={0.5}
        />
        <CloudSVG
          className="absolute bottom-[20%] left-[55%] w-24 h-14 text-primary-200/20 dark:text-primary-700/10"
          speed={0.7}
        />
        <CloudSVG
          className="absolute top-[40%] left-[30%] w-20 h-12 text-primary-200/15 dark:text-primary-700/8"
          speed={0.9}
        />
      </div>

      {/* 主内容 */}
      <motion.div
        className="relative z-10 text-center px-4 max-w-3xl mx-auto"
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h1
          className="text-editorial-xl mb-4"
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <span className="text-slate-800 dark:text-slate-100">opening</span>
          <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
            Clouds
          </span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 h-9 font-display"
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          <TypewriterText />
        </motion.p>

        <motion.p
          className="mt-6 text-sm text-slate-400 dark:text-slate-500 tracking-widest uppercase"
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Tech · Efficiency · Life
        </motion.p>
      </motion.div>

      {/* 滚动指示器 */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ opacity: scrollIndicatorOpacity, y: scrollIndicatorY }}
        animate={reduced ? {} : { y: [0, 8, 0] }}
        transition={reduced ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-xs text-slate-400 dark:text-slate-500 tracking-wider">SCROLL</span>
        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </section>
  );
}
