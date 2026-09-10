import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { GenerationStep } from '@/hooks/useProject';
import { STEP_LABELS, STEP_ORDER } from '@/hooks/useProject';
import { cn } from '@/lib/utils';

interface GenerationProgressProps {
  step: GenerationStep;
  error?: string | null;
}

export function GenerationProgress({ step, error }: GenerationProgressProps) {
  if (step === 'idle' || step === 'done') return null;

  const isError = step === 'error';
  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="rounded-xl glass-strong p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-3">
        {isError ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
        )}
        <span className={cn('text-sm font-semibold', isError ? 'text-red-300' : 'text-violet-200')}>
          {isError ? 'Generation Failed' : 'AI Pipeline'}
        </span>
      </div>

      {isError ? (
        <p className="text-[13px] text-red-300/80 leading-relaxed">
          {error || 'An error occurred during generation.'}
        </p>
      ) : (
        <div className="space-y-2">
          {STEP_ORDER.map((s, idx) => {
            const isCurrent = s === step;
            const isPast = idx < currentIdx;
            const isFuture = idx > currentIdx;
            return (
              <div key={s} className="flex items-center gap-2.5">
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all',
                  isPast && 'bg-violet-500/30 text-violet-300',
                  isCurrent && 'bg-violet-500 text-white pulse-glow',
                  isFuture && 'bg-white/5 text-zinc-600',
                )}>
                  {isPast ? (
                    <Check className="w-3 h-3" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-current" />
                  )}
                </div>
                <span className={cn(
                  'text-[13px] transition-colors',
                  isPast && 'text-zinc-400',
                  isCurrent && 'text-white font-medium',
                  isFuture && 'text-zinc-600',
                )}>
                  {STEP_LABELS[s]}
                </span>
                {isCurrent && (
                  <span className="flex gap-1 ml-auto">
                    <span className="w-1 h-1 rounded-full bg-violet-400 dot-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-violet-400 dot-pulse" style={{ animationDelay: '200ms' }} />
                    <span className="w-1 h-1 rounded-full bg-violet-400 dot-pulse" style={{ animationDelay: '400ms' }} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
