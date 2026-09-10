import { useState } from 'react';
import { Sparkles, Film } from 'lucide-react';
import './App.css';
import type { PageId } from '@/types/story';
import { useProject } from '@/hooks/useProject';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { StoryPage } from '@/pages/StoryPage';
import { CharactersPage } from '@/pages/CharactersPage';
import { StoryboardPage } from '@/pages/StoryboardPage';
import { MemoryPage } from '@/pages/MemoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function App() {
  const [page, setPage] = useState<PageId>('story');
  const {
    project,
    isGenerating,
    genStep,
    genError,
    apiConnected,
    generatingCharId,
    loadDemo,
    newProject,
    setStory,
    updateSettings,
    handleAnalyzeStory,
    generateCharacterReference,
    generatePanel,
    handleContinueStory,
    deletePanel,
    regeneratePanel,
    setCanonicalImage,
    deleteCharacter,
    clearGenError,
  } = useProject();

  // Generate scene from the story page input
  const handleGenerateScene = (request: string) => {
    const req = request.trim() || project?.story || '';
    if (req) {
      generatePanel(req);
    }
  };

  // TopBar generate button — context-aware
  const handleTopGenerate = () => {
    if (page === 'story') {
      handleContinueStory();
    } else {
      setPage('story');
      handleContinueStory();
    }
  };

  // Welcome screen when no project loaded
  if (!project) {
    return <WelcomeScreen onLoadDemo={loadDemo} onNewProject={newProject} apiConnected={apiConnected} />;
  }

  const characterNames: Record<string, string> = {};
  project.characters.forEach((c) => { characterNames[c.id] = c.name; });

  return (
    <div className="flex min-h-screen bg-cinematic">
      <Sidebar
        current={page}
        onNavigate={setPage}
        memoryCount={project.memories.length}
        characterCount={project.characters.length}
        panelCount={project.panels.length}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          projectName={project.name}
          onGenerate={handleTopGenerate}
          apiConnected={apiConnected}
          isGenerating={isGenerating}
        />

        <main className="flex-1 overflow-y-auto">
          {page === 'story' && (
            <StoryPage
              project={project}
              genStep={genStep}
              genError={genError}
              isGenerating={isGenerating}
              onStoryChange={setStory}
              onAnalyze={handleAnalyzeStory}
              onGenerateScene={handleGenerateScene}
              onContinueStory={handleContinueStory}
              onGenerateCharacters={handleAnalyzeStory}
              onRegeneratePanel={regeneratePanel}
              onDeletePanel={deletePanel}
              onClearError={clearGenError}
            />
          )}

          {page === 'characters' && (
            <CharactersPage
              project={project}
              isGenerating={isGenerating}
              generatingCharId={generatingCharId}
              onGenerateReference={generateCharacterReference}
              onSetCanonical={setCanonicalImage}
              onDeleteCharacter={deleteCharacter}
              onAnalyze={handleAnalyzeStory}
            />
          )}

          {page === 'storyboard' && (
            <StoryboardPage
              project={project}
              isGenerating={isGenerating}
              onRegenerate={regeneratePanel}
              onDelete={deletePanel}
              onContinueStory={handleContinueStory}
            />
          )}

          {page === 'memory' && <MemoryPage project={project} />}

          {page === 'settings' && (
            <SettingsPage
              project={project}
              apiConnected={apiConnected}
              onUpdateSettings={updateSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function WelcomeScreen({
  onLoadDemo,
  onNewProject,
  apiConnected,
}: {
  onLoadDemo: () => void;
  onNewProject: () => void;
  apiConnected: boolean | null;
}) {
  return (
    <div className="min-h-screen bg-cinematic flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative max-w-2xl w-full text-center space-y-8 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30 pulse-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-4xl text-white tracking-tight">
              StoryForge <span className="gradient-text">AI</span>
            </h1>
            <p className="text-lg text-zinc-400 mt-2 font-display italic">"Give your story a memory."</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-[15px] text-zinc-400 leading-relaxed max-w-xl mx-auto">
          AI-powered visual storytelling. Write a story, generate consistent manga panels with persistent character memory,
          and let the AI continue your narrative scene by scene.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            'Story Analysis',
            'Character Memory',
            'Context-Aware Generation',
            'Continuity Checking',
            'Manga & Storyboard Modes',
          ].map((feat) => (
            <span key={feat} className="text-[11px] px-3 py-1.5 rounded-full glass text-zinc-400 font-medium">
              {feat}
            </span>
          ))}
        </div>

        {/* API status */}
        <div className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium',
          apiConnected
            ? 'bg-green-500/10 text-green-300 border border-green-500/20'
            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
        )}>
          <span className={cn(
            'w-2 h-2 rounded-full',
            apiConnected ? 'bg-green-400' : 'bg-amber-400',
          )} />
          {apiConnected
            ? 'Gemini API Connected'
            : 'Gemini API not configured — add your key to .env'}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={onLoadDemo}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-600/30 px-6 h-12 text-base"
          >
            <Sparkles className="w-5 h-5" />
            Load Demo Story
          </Button>
          <Button
            onClick={onNewProject}
            variant="outline"
            className="bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200 px-6 h-12 text-base"
          >
            <Film className="w-5 h-5" />
            Start New Story
          </Button>
        </div>

        <p className="text-[12px] text-zinc-600 pt-4">
          The demo includes characters, story memories, and a ready-to-generate narrative.
        </p>
      </div>
    </div>
  );
}
