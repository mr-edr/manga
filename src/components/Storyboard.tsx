import { Film, ArrowDown, Sparkles } from 'lucide-react';
import type { Panel } from '@/types/story';
import { PanelCard } from './PanelCard';
import { Button } from '@/components/ui/button';

interface StoryboardProps {
  panels: Panel[];
  characterNames: Record<string, string>;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  onContinueStory: () => void;
  isGenerating: boolean;
  mode: 'manga' | 'movie';
}

export function Storyboard({
  panels,
  characterNames,
  onRegenerate,
  onDelete,
  onContinueStory,
  isGenerating,
  mode,
}: StoryboardProps) {
  if (panels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 rounded-xl glass p-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/20">
          <Film className="w-7 h-7 text-violet-400" />
        </div>
        <div className="text-center">
          <h3 className="font-display font-bold text-lg text-white">Your storyboard is empty</h3>
          <p className="text-[13px] text-zinc-500 mt-1 max-w-sm">
            Generate your first panel from the Story workspace, or click Continue Story to let the AI advance the narrative.
          </p>
        </div>
        <Button
          onClick={onContinueStory}
          disabled={isGenerating}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-600/20"
        >
          <Sparkles className="w-4 h-4" />
          Generate First Panel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white font-display">
            Storyboard · {mode === 'manga' ? 'Manga Mode' : 'Movie Storyboard'}
          </h2>
          <span className="text-[11px] text-zinc-500">{panels.length} panels</span>
        </div>
      </div>

      <div className={mode === 'manga'
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
      }>
        {panels.map((panel, idx) => (
          <div key={panel.id} className="relative">
            <PanelCard
              panel={panel}
              characterNames={characterNames}
              onRegenerate={onRegenerate}
              onDelete={onDelete}
              isGenerating={isGenerating}
            />
            {idx < panels.length - 1 && mode === 'manga' && (
              <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 items-center justify-center">
                <ArrowDown className="w-3 h-3 text-violet-400 -rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Continue story bar */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onContinueStory}
          disabled={isGenerating}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-600/20 px-6"
        >
          <Sparkles className="w-4 h-4" />
          Continue Story →
        </Button>
      </div>
    </div>
  );
}
