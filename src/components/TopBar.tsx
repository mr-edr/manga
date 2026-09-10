import { Sparkles, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  projectName: string;
  onGenerate: () => void;
  apiConnected: boolean | null;
  isGenerating: boolean;
}

export function TopBar({ projectName, onGenerate, apiConnected, isGenerating }: TopBarProps) {
  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-black/30 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Project</span>
        <span className="text-sm font-display font-semibold text-white truncate max-w-[200px]">{projectName}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* API Status */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          {apiConnected === null ? (
            <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />
          ) : apiConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="text-green-300">Connected</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <WifiOff className="w-3 h-3 text-zinc-500" />
              <span className="text-zinc-400">Not configured</span>
            </>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
            isGenerating
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 hover:shadow-violet-500/40 hover:scale-[1.02]',
          )}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>

        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center text-[11px] font-semibold text-zinc-400">
          SF
        </div>
      </div>
    </header>
  );
}
