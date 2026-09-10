import { useState, useRef } from 'react';
import {
  User, Wand2, Upload, Trash2, Check, Loader2, ImageIcon, RefreshCw,
} from 'lucide-react';
import type { Character } from '@/types/story';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fileToDataUrl } from '@/services/persistence';

interface CharacterCardProps {
  character: Character;
  onGenerateReference: (id: string) => void;
  onSetCanonical: (id: string, imageUrl: string) => void;
  onDelete: (id: string) => void;
  isGenerating: boolean;
  generatingCharId?: string | null;
  state?: {
    location: string;
    outfit: string;
    emotion: string;
    injuries: string;
    notes: string;
  };
}

export function CharacterCard({
  character,
  onGenerateReference,
  onSetCanonical,
  onDelete,
  isGenerating,
  generatingCharId,
  state,
}: CharacterCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isThisGenerating = isGenerating && generatingCharId === character.id;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onSetCanonical(character.id, dataUrl);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className={cn(
      'rounded-xl glass overflow-hidden transition-all duration-300 group hover:border-violet-500/20',
      character.isCanonical && 'border-violet-500/30 ring-1 ring-violet-500/10',
    )}>
      {/* Image / Placeholder */}
      <div className="relative aspect-[3/4] bg-black/40 overflow-hidden">
        {isThisGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="absolute inset-0 shimmer" />
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin z-10" />
            <p className="text-[11px] text-violet-300 z-10 font-medium">Generating reference sheet...</p>
          </div>
        ) : character.canonicalImage ? (
          <img
            src={character.canonicalImage}
            alt={character.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-700">
            <ImageIcon className="w-10 h-10" />
            <p className="text-[11px] text-zinc-600">No reference image</p>
          </div>
        )}

        {/* Canonical badge */}
        {character.isCanonical && !isThisGenerating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/90 text-white text-[10px] font-bold tracking-wide backdrop-blur-sm shadow-lg">
            <Check className="w-3 h-3" />
            CANONICAL
          </div>
        )}

        {/* Role badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 text-zinc-300 text-[10px] font-medium backdrop-blur-sm">
          {character.role}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base text-white truncate">{character.name}</h3>
            {character.age && <p className="text-[12px] text-zinc-500">{character.age} years old</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 shrink-0"
            onClick={() => onDelete(character.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Visual traits */}
        <div className="flex flex-wrap gap-1">
          {character.visual_traits.slice(0, 3).map((trait, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
              {trait}
            </span>
          ))}
          {character.visual_traits.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 text-zinc-600">+{character.visual_traits.length - 3} more</span>
          )}
        </div>

        {/* Current state */}
        {state && (
          <div className="rounded-md bg-amber-500/5 border border-amber-500/10 px-2.5 py-2 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-amber-400/60 w-12 shrink-0">Location</span>
              <span className="text-zinc-300">{state.location || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-amber-400/60 w-12 shrink-0">Outfit</span>
              <span className="text-zinc-300 truncate">{state.outfit || 'Default'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-amber-400/60 w-12 shrink-0">Emotion</span>
              <span className="text-zinc-300">{state.emotion || 'Neutral'}</span>
            </div>
          </div>
        )}

        {/* Toggle details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[11px] text-violet-400/70 hover:text-violet-300 transition-colors font-medium"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>

        {showDetails && (
          <div className="space-y-2 pt-1 animate-fade-in">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Appearance</p>
              <p className="text-[12px] text-zinc-400 leading-relaxed">{character.appearance}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Personality</p>
              <p className="text-[12px] text-zinc-400 leading-relaxed">{character.personality}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Outfit</p>
              <p className="text-[12px] text-zinc-400 leading-relaxed">{character.outfit}</p>
            </div>
            {state?.notes && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Notes</p>
                <p className="text-[12px] text-amber-300/70 leading-relaxed">{state.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-1.5 pt-1">
          <Button
            size="sm"
            onClick={() => onGenerateReference(character.id)}
            disabled={isGenerating}
            className="flex-1 bg-violet-600/80 hover:bg-violet-600 text-white border-0 text-[12px] h-8"
          >
            {isThisGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : character.canonicalImage ? <RefreshCw className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
            {character.canonicalImage ? 'Regenerate' : 'Generate'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 h-8 px-2.5"
          >
            <Upload className="w-3 h-3" />
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>
    </div>
  );
}
