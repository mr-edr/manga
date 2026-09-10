import { Users, Sparkles, AlertCircle } from 'lucide-react';
import type { Project } from '@/types/story';
import { CharacterCard } from '@/components/CharacterCard';
import { Button } from '@/components/ui/button';

interface CharactersPageProps {
  project: Project;
  isGenerating: boolean;
  generatingCharId: string | null;
  onGenerateReference: (id: string) => void;
  onSetCanonical: (id: string, imageUrl: string) => void;
  onDeleteCharacter: (id: string) => void;
  onAnalyze: () => void;
}

export function CharactersPage({
  project,
  isGenerating,
  generatingCharId,
  onGenerateReference,
  onSetCanonical,
  onDeleteCharacter,
  onAnalyze,
}: CharactersPageProps) {
  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-400" />
          <h1 className="font-display font-bold text-xl text-white">Characters</h1>
          <span className="text-[12px] text-zinc-500 ml-1">{project.characters.length}</span>
        </div>
      </div>

      {project.characters.length === 0 ? (
        <div className="rounded-xl glass p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/20 mx-auto mb-4">
            <Users className="w-7 h-7 text-violet-400" />
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-1">No characters yet</h3>
          <p className="text-[13px] text-zinc-500 max-w-sm mx-auto mb-4">
            Write a story in the Story workspace and click "Analyze Story" to extract characters, or load the demo story.
          </p>
          <Button
            onClick={onAnalyze}
            disabled={isGenerating || !project.story.trim()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0"
          >
            <Sparkles className="w-4 h-4" />
            Analyze Story for Characters
          </Button>
        </div>
      ) : (
        <>
          {/* Info banner */}
          <div className="rounded-lg glass p-3 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-zinc-400 leading-relaxed">
              Generate canonical reference sheets for each character. These images are used as visual context when generating manga panels to maintain character consistency across scenes.
            </p>
          </div>

          {/* Character grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {project.characters.map((char) => {
              const state = project.characterStates.find((s) => s.characterId === char.id);
              return (
                <CharacterCard
                  key={char.id}
                  character={char}
                  state={state}
                  onGenerateReference={onGenerateReference}
                  onSetCanonical={onSetCanonical}
                  onDelete={onDeleteCharacter}
                  isGenerating={isGenerating}
                  generatingCharId={generatingCharId}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
