import { useState, useMemo } from 'react';
import { Brain, Search, Clock } from 'lucide-react';
import type { StoryMemory, MemoryType } from '@/types/story';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MemoryTimelineProps {
  memories: StoryMemory[];
  characterNames: Record<string, string>;
}

const TYPE_COLORS: Record<MemoryType, string> = {
  character: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20',
  event: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
  relationship: 'bg-pink-500/20 text-pink-300 border-pink-500/20',
  location: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  object: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  dialogue: 'bg-green-500/20 text-green-300 border-green-500/20',
  lore: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  scene: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
};

const TYPE_FILTERS: (MemoryType | 'all')[] = ['all', 'event', 'character', 'relationship', 'location', 'lore', 'scene', 'dialogue'];

export function MemoryTimeline({ memories, characterNames }: MemoryTimelineProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MemoryType | 'all'>('all');

  const filtered = useMemo(() => {
    let result = [...memories].sort((a, b) => b.timestamp - a.timestamp);
    if (filter !== 'all') {
      result = result.filter((m) => m.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.text.toLowerCase().includes(q) ||
          m.characters.some((c) => (characterNames[c] || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [memories, search, filter, characterNames]);

  // Group by chapter
  const grouped = useMemo(() => {
    const map = new Map<number, StoryMemory[]>();
    for (const m of filtered) {
      if (!map.has(m.chapter)) map.set(m.chapter, []);
      map.get(m.chapter)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search story memory..."
            className="pl-9 bg-black/30 border-white/10 focus-visible:border-violet-500/40"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-full font-medium transition-all border',
                filter === t
                  ? 'bg-violet-500/20 text-violet-200 border-violet-500/30'
                  : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10 hover:text-zinc-300',
              )}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Memory count */}
      <div className="flex items-center gap-2 text-[12px] text-zinc-500">
        <Brain className="w-3.5 h-3.5 text-violet-400" />
        <span>{filtered.length} {filtered.length === 1 ? 'memory' : 'memories'}</span>
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <div className="rounded-xl glass p-8 text-center">
          <Brain className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-[13px] text-zinc-500">
            {memories.length === 0
              ? 'No story memories yet. Analyze a story or generate panels to build memory.'
              : 'No memories match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([chapter, mems]) => (
            <div key={chapter}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] uppercase tracking-wider font-bold text-violet-300 font-display">Chapter {chapter}</span>
                <span className="text-[10px] text-zinc-600">·</span>
                <span className="text-[10px] text-zinc-600">{mems.length} memories</span>
                <div className="flex-1 h-px bg-gradient-to-r from-violet-500/20 to-transparent" />
              </div>

              <div className="relative pl-6 space-y-3">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/30 via-violet-500/10 to-transparent" />

                {mems.map((mem) => (
                  <div key={mem.id} className="relative animate-fade-in-up">
                    {/* Timeline dot */}
                    <div className={cn(
                      'absolute -left-[19px] top-3 w-3 h-3 rounded-full border-2 border-black/60 z-10',
                      TYPE_COLORS[mem.type].split(' ')[0],
                    )} />

                    <div className="rounded-lg glass p-3 hover:border-violet-500/20 transition-all">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border',
                          TYPE_COLORS[mem.type],
                        )}>
                          {mem.type}
                        </span>
                        <span className="text-[10px] text-zinc-600">Scene {mem.scene}</span>
                        {mem.characters.length > 0 && (
                          <div className="flex gap-1">
                            {mem.characters.map((id) => (
                              <span key={id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300/80">
                                {characterNames[id] || id}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[13px] text-zinc-300 leading-relaxed">{mem.text}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-600">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(mem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
