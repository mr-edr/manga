import { useState } from 'react';
import { Film, Sparkles, RotateCcw, AlertCircle } from 'lucide-react';
import type { Project } from '@/types/story';
import { StoryEditor } from '@/components/StoryEditor';
import { ContextPanel } from '@/components/ContextPanel';
import { GenerationProgress } from '@/components/GenerationProgress';
import { Button } from '@/components/ui/button';
import type { GenerationStep } from '@/hooks/useProject';

interface StoryPageProps {
  project: Project;
  genStep: GenerationStep;
  genError: string | null;
  isGenerating: boolean;
  onStoryChange: (story: string) => void;
  onAnalyze: () => void;
  onGenerateScene: (request: string) => void;
  onContinueStory: () => void;
  onGenerateCharacters: () => void;
  onRegeneratePanel: (id: string) => void;
  onDeletePanel: (id: string) => void;
  onClearError: () => void;
}

export function StoryPage({
  project,
  genStep,
  genError,
  isGenerating,
  onStoryChange,
  onAnalyze,
  onGenerateScene,
  onContinueStory,
  onGenerateCharacters,
  onRegeneratePanel,
  onDeletePanel,
  onClearError,
}: StoryPageProps) {
  const [sceneRequest, setSceneRequest] = useState('');
  const characterNames: Record<string, string> = {};
  project.characters.forEach((c) => { characterNames[c.id] = c.name; });

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 h-full">
      {/* Error banner */}
      {genError && genStep === 'error' && (
        <div className="rounded-xl glass-strong p-4 border-red-500/20 flex items-start gap-3 animate-scale-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-300 font-medium">{genError}</p>
            <p className="text-[12px] text-red-400/60 mt-0.5">
              Check your Gemini API key in .env or try again.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onClearError} className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10">
            <RotateCcw className="w-3 h-3" />
            Retry
          </Button>
        </div>
      )}

      {/* Generation progress */}
      {genStep !== 'idle' && genStep !== 'done' && genStep !== 'error' && (
        <GenerationProgress step={genStep} error={genError} />
      )}

      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_300px] gap-4 flex-1 min-h-0">
        {/* Left: Story Editor */}
        <div className="rounded-xl glass p-4 flex flex-col min-h-[400px]">
          <StoryEditor
            story={project.story}
            onStoryChange={onStoryChange}
            onAnalyze={onAnalyze}
            onGenerateScene={() => onGenerateScene(sceneRequest)}
            onContinueStory={onContinueStory}
            onGenerateCharacters={onGenerateCharacters}
            isGenerating={isGenerating}
            hasProject={project.characters.length > 0 || project.story.length > 0}
          />
        </div>

        {/* Center: Storyboard Canvas */}
        <div className="rounded-xl glass p-4 flex flex-col min-h-[400px] overflow-hidden">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Film className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white font-display">Panel Canvas</h2>
            {project.panels.length > 0 && (
              <span className="text-[11px] text-zinc-500">{project.panels.length} panels generated</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {project.panels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/20">
                  <Sparkles className="w-7 h-7 text-violet-400" />
                </div>
                <div className="text-center max-w-xs">
                  <h3 className="font-display font-bold text-base text-white">No panels yet</h3>
                  <p className="text-[12px] text-zinc-500 mt-1">
                    Write a scene description below and click Generate Scene, or use Continue Story to let the AI advance the narrative.
                  </p>
                </div>
                <SceneInput
                  value={sceneRequest}
                  onChange={setSceneRequest}
                  onGenerate={() => onGenerateScene(sceneRequest)}
                  disabled={isGenerating}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <SceneInput
                  value={sceneRequest}
                  onChange={setSceneRequest}
                  onGenerate={() => onGenerateScene(sceneRequest)}
                  disabled={isGenerating}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {project.panels.map((panel) => (
                    <CompactPanel
                      key={panel.id}
                      number={panel.number}
                      image={panel.image}
                      description={panel.description}
                      continuity={panel.continuity?.score ?? null}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Context Inspector */}
        <div className="rounded-xl glass p-4 flex flex-col min-h-[400px] overflow-hidden">
          <ContextPanel project={project} query={project.currentSceneDescription || project.story} />
        </div>
      </div>
    </div>
  );
}

function SceneInput({
  value,
  onChange,
  onGenerate,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2 w-full max-w-lg">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the next scene..."
        className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !disabled) onGenerate();
        }}
      />
      <Button
        onClick={onGenerate}
        disabled={disabled}
        size="sm"
        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Generate
      </Button>
    </div>
  );
}

function CompactPanel({
  number,
  image,
  description,
  continuity,
}: {
  number: number;
  image: string | null;
  description: string;
  continuity: number | null;
}) {
  return (
    <div className="rounded-lg overflow-hidden glass group hover:border-violet-500/20 transition-all">
      <div className="relative aspect-[3/4] bg-black/40 overflow-hidden">
        {image ? (
          <img src={image} alt={`Panel ${number}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
            <Film className="w-6 h-6" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-violet-300 backdrop-blur-sm">
          P{number}
        </div>
        {continuity !== null && (
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm bg-green-500/20 text-green-300 border border-green-500/20">
            {Math.round(continuity)}%
          </div>
        )}
      </div>
      <p className="text-[11px] text-zinc-500 p-2 line-clamp-2 leading-relaxed">{description}</p>
    </div>
  );
}
