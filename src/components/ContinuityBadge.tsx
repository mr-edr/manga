import { ShieldCheck, ShieldAlert } from 'lucide-react';
import type { ContinuityReport } from '@/types/story';
import { cn } from '@/lib/utils';

interface ContinuityBadgeProps {
  report: ContinuityReport | null;
  size?: 'sm' | 'md';
}

export function ContinuityBadge({ report, size = 'sm' }: ContinuityBadgeProps) {
  if (!report) return null;

  const score = report.score;
  const isGood = score >= 80;
  const isMedium = score >= 60 && score < 80;
  const isBad = score < 60;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        isGood && 'bg-green-500/15 text-green-300 border-green-500/20',
        isMedium && 'bg-amber-500/15 text-amber-300 border-amber-500/20',
        isBad && 'bg-red-500/15 text-red-300 border-red-500/20',
      )}
      title={report.warnings.length > 0 ? report.warnings.join('\n') : undefined}
    >
      {isGood ? (
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      ) : (
        <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      )}
      Continuity {Math.round(score)}%
    </div>
  );
}
