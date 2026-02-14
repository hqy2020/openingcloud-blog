import { motion, useReducedMotion } from "motion/react";

type TextGenerateEffectProps = {
  text: string;
  className?: string;
  delay?: number;
};

export function TextGenerateEffect({ text, className = "", delay = 0 }: TextGenerateEffectProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(/(\s+)/).filter((token) => token.length > 0);

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((token, index) => (
        <motion.span
          key={`${token}-${index}`}
          initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.35, delay: delay + index * 0.04, ease: "easeOut" }}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {token}
        </motion.span>
      ))}
    </span>
  );
}
