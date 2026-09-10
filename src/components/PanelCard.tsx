import { useState } from 'react';
import {
  Trash2, Download, RefreshCw, Edit3, ImageIcon, Film,
} from 'lucide-react';
import type { Panel } from '@/types/story';
import { Button } from '@/components/ui/button';
import { ContinuityBadge } from './ContinuityBadge';
import { cn } from '@/lib/utils';

interface PanelCardProps {
  panel: Panel;
  characterNames: Record<string, string>;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  isGenerating: boolean;
}

export function PanelCard({
  panel,
  characterNames,
  onRegenerate,
  onDelete,
  isGenerating,
}: PanelCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleDownload = () => {
    if (!panel.image) return;
    const a = document.createElement('a');
    a.href = panel.image;
    a.download = `panel-${panel.number}.png`;
    a.click();
  };

  return (
    <div className="rounded-xl glass overflow-hidden transition-all duration-300 group hover:border-violet-500/20 animate-fade-in-up">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-violet-300 font-display">PANEL {panel.number}</span>
          <span className="text-[10px] text-zinc-600">·</span>
          <span className="text-[10px] text-zinc-500">Scene {panel.sceneNumber}</span>
        </div>
        <ContinuityBadge report={panel.continuity} />
      </div>

      {/* Image */}
      <div className={cn(
        'relative bg-black/40 overflow-hidden',
        'aspect-[3/4]',
      )}>
        {panel.image ? (
          <img
            src={panel.image}
            alt={`Panel ${panel.number}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-700">
            <ImageIcon className="w-8 h-8" />
            <p className="text-[11px] text-zinc-600">No image generated</p>
          </div>
        )}

        {/* Hover overlay actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center gap-2 pb-3">
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-white/10 border-white/20 hover:bg-violet-600/80 hover:border-violet-500 text-white"
            onClick={() => onRegenerate(panel.id)}
            disabled={isGenerating}
            title="Regenerate"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-white/10 border-white/20 hover:bg-violet-600/80 hover:border-violet-500 text-white"
            onClick={() => setShowDetails(!showDetails)}
            title="Edit / Details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-white/10 border-white/20 hover:bg-violet-600/80 hover:border-violet-500 text-white"
            onClick={handleDownload}
            disabled={!panel.image}
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-white/10 border-white/20 hover:bg-red-600/80 hover:border-red-500 text-white"
            onClick={() => onDelete(panel.id)}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-3 space-y-2">
        <p className="text-[12px] text-zinc-300 leading-relaxed line-clamp-2">{panel.description}</p>

        {/* Character tags */}
        {panel.characters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {panel.characters.map((id) => (
              <span key={id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
                {characterNames[id] || id}
              </span>
            ))}
          </div>
        )}

        {/* Shot info */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          <Film className="w-3 h-3" />
          <span>{panel.spec.shot_type}</span>
          <span>·</span>
          <span>{panel.spec.camera_angle}</span>
        </div>

        {/* Expanded details */}
        {showDetails && (
          <div className="space-y-2 pt-2 border-t border-white/5 animate-fade-in">
            <DetailRow label="Lighting" value={panel.spec.lighting} />
            <DetailRow label="Location" value={panel.spec.location} />
            <DetailRow label="Composition" value={panel.spec.composition} />
            {panel.spec.emotion && Object.keys(panel.spec.emotion).length > 0 && (
              <DetailRow label="Emotions" value={Object.entries(panel.spec.emotion).map(([k, v]) => `${k}: ${v}`).join(', ')} />
            )}
            {panel.spec.continuity_constraints.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Continuity Constraints</p>
                <ul className="space-y-0.5">
                  {panel.spec.continuity_constraints.slice(0, 4).map((c, i) => (
                    <li key={i} className="text-[11px] text-zinc-500 leading-relaxed flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-violet-400/50 mt-1.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {panel.continuity && panel.continuity.warnings.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-amber-500/70 mb-1">Warnings</p>
                <ul className="space-y-0.5">
                  {panel.continuity.warnings.map((w, i) => (
                    <li key={i} className="text-[11px] text-amber-400/60 leading-relaxed">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600 w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-[11px] text-zinc-400 leading-relaxed">{value}</span>
    </div>
  );
}
