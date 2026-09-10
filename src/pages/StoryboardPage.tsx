import { Film } from 'lucide-react';
import type { Project } from '@/types/story';
import { Storyboard } from '@/components/Storyboard';

interface StoryboardPageProps {
  project: Project;
  isGenerating: boolean;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  onContinueStory: () => void;
}

export function StoryboardPage({
  project,
  isGenerating,
  onRegenerate,
  onDelete,
  onContinueStory,
}: StoryboardPageProps) {
  const characterNames: Record<string, string> = {};
  project.characters.forEach((c) => { characterNames[c.id] = c.name; });

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Film className="w-5 h-5 text-violet-400" />
        <h1 className="font-display font-bold text-xl text-white">Storyboard</h1>
        <span className="text-[12px] text-zinc-500 ml-1">
          {project.panels.length} {project.panels.length === 1 ? 'panel' : 'panels'}
        </span>
        <div className="ml-auto flex items-center gap-2 text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <span className={project.settings.storyboardMode === 'manga' ? 'text-violet-300 font-semibold' : 'text-zinc-500'}>MANGA</span>
          <span className="text-zinc-700">|</span>
          <span className={project.settings.storyboardMode === 'movie' ? 'text-violet-300 font-semibold' : 'text-zinc-500'}>MOVIE</span>
        </div>
      </div>

      <Storyboard
        panels={project.panels}
        characterNames={characterNames}
        onRegenerate={onRegenerate}
        onDelete={onDelete}
        onContinueStory={onContinueStory}
        isGenerating={isGenerating}
        mode={project.settings.storyboardMode}
      />
    </div>
  );
}
