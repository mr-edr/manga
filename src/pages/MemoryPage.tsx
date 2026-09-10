import { Brain } from 'lucide-react';
import type { Project } from '@/types/story';
import { MemoryTimeline } from '@/components/MemoryTimeline';

interface MemoryPageProps {
  project: Project;
}

export function MemoryPage({ project }: MemoryPageProps) {
  const characterNames: Record<string, string> = {};
  project.characters.forEach((c) => { characterNames[c.id] = c.name; });

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-violet-400" />
        <h1 className="font-display font-bold text-xl text-white">Story Memory</h1>
        <span className="text-[12px] text-zinc-500 ml-1">{project.memories.length} memories</span>
      </div>

      <p className="text-[13px] text-zinc-500 leading-relaxed -mt-2">
        This is what StoryForge AI currently remembers about your story. Memories are retrieved before each panel generation to maintain narrative and visual consistency.
      </p>

      <MemoryTimeline memories={project.memories} characterNames={characterNames} />
    </div>
  );
}
