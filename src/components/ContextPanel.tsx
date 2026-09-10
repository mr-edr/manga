import { Brain, Users, MapPin, Eye, AlertCircle, Layers } from 'lucide-react';
import type { Project } from '@/types/story';
import { retrieveRelevantMemories } from '@/services/memory';

interface ContextPanelProps {
  project: Project;
  query: string;
}

export function ContextPanel({ project, query }: ContextPanelProps) {
  const memories = query.trim()
    ? retrieveRelevantMemories(query, project.memories, 5)
    : project.memories.slice(-5);

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1">
      <div className="flex items-center gap-2 px-1">
        <Layers className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-white font-display">Context Inspector</h2>
      </div>

      {!project.story && project.characters.length === 0 ? (
        <div className="rounded-lg glass p-6 text-center">
          <AlertCircle className="w-5 h-5 text-zinc-600 mx-auto mb-2" />
          <p className="text-[13px] text-zinc-500">
            No context yet. Write a story and click Analyze, or load the demo.
          </p>
        </div>
      ) : (
        <>
          {/* Current Scene */}
          {project.currentScene && (
            <ContextSection icon={Eye} label="Current Scene" color="violet">
              <p className="text-[13px] text-zinc-300 leading-relaxed">{project.currentScene}</p>
              {project.currentSceneDescription && (
                <p className="text-[12px] text-zinc-500 leading-relaxed mt-1.5">{project.currentSceneDescription}</p>
              )}
            </ContextSection>
          )}

          {/* Characters */}
          {project.characters.length > 0 && (
            <ContextSection icon={Users} label="Characters" color="indigo" count={project.characters.length}>
              <div className="space-y-2">
                {project.characters.map((c) => (
                  <div key={c.id} className="rounded-md bg-white/5 px-2.5 py-2 border border-white/5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-semibold text-white">{c.name}</span>
                      {c.isCanonical && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold tracking-wide">CANONICAL</span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-snug">{c.outfit}</p>
                    {project.characterStates.find((s) => s.characterId === c.id) && (
                      <p className="text-[11px] text-amber-400/70 mt-0.5">
                        {project.characterStates.find((s) => s.characterId === c.id)?.emotion} · {project.characterStates.find((s) => s.characterId === c.id)?.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ContextSection>
          )}

          {/* Relevant Memories */}
          <ContextSection icon={Brain} label="Story Memory" color="violet" count={memories.length}>
            <div className="space-y-1.5">
              {memories.length === 0 ? (
                <p className="text-[12px] text-zinc-600">No relevant memories found.</p>
              ) : (
                memories.map((m) => (
                  <div key={m.id} className="flex items-start gap-2 text-[12px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60 mt-1.5 shrink-0" />
                    <span className="text-zinc-400 leading-relaxed">{m.text}</span>
                  </div>
                ))
              )}
            </div>
          </ContextSection>

          {/* Locations */}
          {project.locations.length > 0 && (
            <ContextSection icon={MapPin} label="Locations" color="blue" count={project.locations.length}>
              <div className="space-y-1.5">
                {project.locations.map((l) => (
                  <div key={l.id} className="text-[12px]">
                    <span className="text-zinc-300 font-medium">{l.name}</span>
                    <p className="text-zinc-600 leading-snug">{l.description.slice(0, 80)}...</p>
                  </div>
                ))}
              </div>
            </ContextSection>
          )}

          {/* Visual Style */}
          <ContextSection icon={Layers} label="Visual Style">
            <p className="text-[12px] text-zinc-400 leading-relaxed italic">
              {project.visual_style || project.settings.customStyle || 'Black & White Manga (default)'}
            </p>
          </ContextSection>
        </>
      )}
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  violet: 'text-violet-400',
  indigo: 'text-indigo-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
};

function ContextSection({
  icon: Icon,
  label,
  color = 'violet',
  count,
  children,
}: {
  icon: typeof Brain;
  label: string;
  color?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg glass p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${COLOR_MAP[color] || COLOR_MAP.violet}`} />
        <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">{label}</span>
        {count !== undefined && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500 font-medium">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}
