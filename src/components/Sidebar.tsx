import { BookOpen, Users, Film, Brain, Settings, Sparkles } from 'lucide-react';
import type { PageId } from '@/types/story';
import { cn } from '@/lib/utils';

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  memoryCount: number;
  characterCount: number;
  panelCount: number;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof BookOpen }[] = [
  { id: 'story', label: 'Story', icon: BookOpen },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'storyboard', label: 'Storyboard', icon: Film },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ current, onNavigate, memoryCount, characterCount, panelCount }: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl z-30">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-[15px] text-white leading-none tracking-tight">StoryForge</h1>
          <p className="text-[10px] text-violet-300/60 leading-none mt-1 tracking-wide uppercase">AI Storytelling</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id;
          const count = item.id === 'memory' ? memoryCount : item.id === 'characters' ? characterCount : item.id === 'storyboard' ? panelCount : 0;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-violet-600/20 to-transparent text-white border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent',
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-violet-400 to-indigo-500" />
              )}
              <Icon className={cn('w-[18px] h-[18px] transition-transform', isActive ? 'text-violet-300' : 'group-hover:scale-110')} />
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                  isActive ? 'bg-violet-500/30 text-violet-200' : 'bg-white/10 text-zinc-400',
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <p className="text-[11px] text-zinc-500 leading-relaxed font-display italic">
          "Give your story a memory."
        </p>
      </div>
    </aside>
  );
}
