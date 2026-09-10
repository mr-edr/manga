import { useState, useRef, useEffect } from 'react';
import { BookOpen, Sparkles, Users, Wand2, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface StoryEditorProps {
  story: string;
  onStoryChange: (story: string) => void;
  onAnalyze: () => void;
  onGenerateScene: () => void;
  onContinueStory: () => void;
  onGenerateCharacters: () => void;
  isGenerating: boolean;
  hasProject: boolean;
}

export function StoryEditor({
  story,
  onStoryChange,
  onAnalyze,
  onGenerateScene,
  onContinueStory,
  onGenerateCharacters,
  isGenerating,
  hasProject,
}: StoryEditorProps) {
  const [localStory, setLocalStory] = useState(story);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalStory(story);
  }, [story]);

  const handleChange = (val: string) => {
    setLocalStory(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onStoryChange(val), 300);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-2 px-1">
        <BookOpen className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-white font-display">Story Editor</h2>
        <span className="text-[11px] text-zinc-500 ml-auto">{localStory.length} chars</span>
      </div>

      <Textarea
        value={localStory}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Describe your story, paste a script, or tell StoryForge what should happen next..."
        className={cn(
          'flex-1 min-h-[300px] resize-none text-[14px] leading-relaxed bg-black/30 border-white/10',
          'focus-visible:border-violet-500/40 focus-visible:ring-violet-500/20',
          'placeholder:text-zinc-600 font-normal',
        )}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onAnalyze}
          disabled={isGenerating || !localStory.trim()}
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/30 text-zinc-200"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Analyze Story
        </Button>
        <Button
          onClick={onGenerateCharacters}
          disabled={isGenerating || !localStory.trim()}
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/30 text-zinc-200"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
          Generate Characters
        </Button>
        <Button
          onClick={onGenerateScene}
          disabled={isGenerating || !hasProject}
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-violet-500/30 text-zinc-200"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          Generate Scene
        </Button>
        <Button
          onClick={onContinueStory}
          disabled={isGenerating || !hasProject}
          size="sm"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-600/20"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          Continue Story
        </Button>
      </div>
    </div>
  );
}
