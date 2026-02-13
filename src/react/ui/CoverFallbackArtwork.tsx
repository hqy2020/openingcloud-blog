import { cn } from './cn';

type Variant = 'dark' | 'light';

interface CoverFallbackArtworkProps {
  category: string;
  seed?: number;
  variant?: Variant;
  className?: string;
}

const paletteMap: Record<string, { from: string; to: string; glow: string; icon: string }> = {
  journal: { from: '#6aa8ff', to: '#3a9aff', glow: 'rgba(255,255,255,0.42)', icon: '📓' },
  tech: { from: '#6cbf7d', to: '#3f9f61', glow: 'rgba(222,255,229,0.36)', icon: '💻' },
  learning: { from: '#ffbf70', to: '#e6850f', glow: 'rgba(255,240,214,0.36)', icon: '📚' },
  life: { from: '#8ea8ff', to: '#667eea', glow: 'rgba(233,237,255,0.4)', icon: '📷' },
};

function hashPoints(seed: number) {
  const base = (seed + 1) * 17;
  return [
    `${4 + (base % 16)},${16 - (base % 5)}`,
    `${17 + (base % 9)},${9 + (base % 7)}`,
    `${30 + (base % 11)},${13 - (base % 6)}`,
    `${44 + (base % 8)},${6 + (base % 9)}`,
    `${58 + (base % 10)},${11 + (base % 6)}`,
    `${72 + (base % 4)},${7 + (base % 8)}`,
  ].join(' ');
}

export function CoverFallbackArtwork({
  category,
  seed = 0,
  variant = 'dark',
  className,
}: CoverFallbackArtworkProps) {
  const palette = paletteMap[category] || paletteMap.journal;
  const linePoints = hashPoints(seed);
  const dark = variant === 'dark';

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(140deg, ${palette.from} 0%, ${palette.to} 100%)`,
        }}
      />

      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.26) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.26) 1px, transparent 1px)',
          backgroundSize: `${22 + (seed % 4) * 4}px ${22 + (seed % 4) * 4}px`,
        }}
      />

      <div
        className="absolute -top-16 -right-12 w-56 h-56 rounded-full blur-3xl opacity-70"
        style={{ background: palette.glow }}
      />
      <div
        className="absolute -bottom-14 -left-10 w-40 h-40 rounded-full blur-2xl opacity-60"
        style={{ background: 'rgba(255,255,255,0.26)' }}
      />

      <div className="absolute right-4 top-3 text-4xl opacity-45 select-none">{palette.icon}</div>
      <div className="absolute left-4 top-4 text-[10px] tracking-[0.16em] uppercase text-white/75">
        No Cover
      </div>

      <div className="absolute left-3 right-3 bottom-3 rounded-xl bg-white/18 backdrop-blur-sm px-2 py-1.5">
        <svg viewBox="0 0 76 20" className={cn('w-full h-6', dark ? 'text-white/80' : 'text-slate-700/60')} fill="none" stroke="currentColor" strokeWidth={1.6}>
          <polyline points={linePoints} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
