import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { cn } from './cn';

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  /** Duration per character in seconds */
  charDuration?: number;
}

export function TextGenerateEffect({
  words,
  className,
  charDuration = 0.05,
}: TextGenerateEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const totalChars = words.length;
    const controls = animate(count, totalChars, {
      duration: totalChars * charDuration,
      ease: 'linear',
    });

    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayedText(words.slice(0, latest));
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [words, charDuration, count, rounded]);

  return (
    <span className={cn(className)}>
      {displayedText}
      <motion.span
        className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-text-bottom"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
      />
    </span>
  );
}
