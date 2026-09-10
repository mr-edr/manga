import { Settings as SettingsIcon, Key, Image, Palette, Film, Check, X, Info } from 'lucide-react';
import type { Project, VisualStyle, AspectRatio, StoryboardMode } from '@/types/story';
import { VISUAL_STYLES } from '@/services/demoData';
import { cn } from '@/lib/utils';

interface SettingsPageProps {
  project: Project;
  apiConnected: boolean | null;
  onUpdateSettings: (settings: Partial<Project['settings']>) => void;
}

export function SettingsPage({ project, apiConnected, onUpdateSettings }: SettingsPageProps) {
  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-5 h-5 text-violet-400" />
        <h1 className="font-display font-bold text-xl text-white">Settings</h1>
      </div>

      {/* Gemini API */}
      <SettingsSection icon={Key} title="Gemini API" description="Backend AI model configuration">
        <div className="space-y-3">
          <div className="rounded-lg bg-black/30 border border-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-400">API Key</span>
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold',
                apiConnected
                  ? 'bg-green-500/15 text-green-300'
                  : 'bg-zinc-500/15 text-zinc-400',
              )}>
                {apiConnected ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {apiConnected ? 'Connected' : 'Not configured'}
              </div>
            </div>
            <p className="text-[12px] text-zinc-600 mt-1.5 leading-relaxed">
              Gemini API configured through environment variables. Set <code className="text-violet-300/80 bg-violet-500/10 px-1 rounded text-[11px]">GEMINI_API_KEY</code> in your <code className="text-violet-300/80 bg-violet-500/10 px-1 rounded text-[11px]">.env</code> file.
            </p>
          </div>

          <div className="rounded-lg bg-black/30 border border-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-400">Image Model</span>
              <span className="text-[12px] text-violet-300 font-medium">Gemini 3.1 Flash Image</span>
            </div>
          </div>

          <div className="rounded-lg bg-black/30 border border-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-400">Text Model</span>
              <span className="text-[12px] text-violet-300 font-medium">Gemini 3.6 Flash</span>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Visual Style */}
      <SettingsSection icon={Palette} title="Visual Style" description="Choose the art style for generated panels">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VISUAL_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => onUpdateSettings({ visualStyle: style.id as VisualStyle })}
              className={cn(
                'text-left rounded-lg p-3 border transition-all',
                project.settings.visualStyle === style.id
                  ? 'bg-violet-500/15 border-violet-500/30 text-white'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:border-white/10',
              )}
            >
              <span className="text-[13px] font-semibold block">{style.label}</span>
              <span className="text-[11px] text-zinc-500 leading-relaxed">{style.description}</span>
            </button>
          ))}
        </div>

        {project.settings.visualStyle === 'custom' && (
          <div className="mt-3 animate-fade-in">
            <label className="text-[12px] text-zinc-400 font-medium block mb-1.5">Custom Style Description</label>
            <textarea
              value={project.settings.customStyle}
              onChange={(e) => onUpdateSettings({ customStyle: e.target.value })}
              placeholder="e.g. High contrast Japanese manga ink style, dramatic screentones, expressive faces, cinematic framing."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors resize-none min-h-[80px]"
            />
          </div>
        )}
      </SettingsSection>

      {/* Aspect Ratio */}
      <SettingsSection icon={Image} title="Image Aspect Ratio" description="Dimensions for generated panels">
        <div className="grid grid-cols-3 gap-2">
          {(['portrait', 'square', 'landscape'] as AspectRatio[]).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onUpdateSettings({ aspectRatio: ratio })}
              className={cn(
                'rounded-lg p-3 border text-center transition-all',
                project.settings.aspectRatio === ratio
                  ? 'bg-violet-500/15 border-violet-500/30 text-white'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5',
              )}
            >
              <div className="flex items-center justify-center mb-1.5">
                <div className={cn(
                  'border-2 rounded',
                  ratio === 'portrait' && 'w-6 h-8',
                  ratio === 'square' && 'w-7 h-7',
                  ratio === 'landscape' && 'w-8 h-5',
                  project.settings.aspectRatio === ratio ? 'border-violet-400' : 'border-zinc-600',
                )} />
              </div>
              <span className="text-[12px] font-medium capitalize">{ratio}</span>
              <span className="text-[10px] text-zinc-600 block">
                {ratio === 'portrait' ? '3:4' : ratio === 'square' ? '1:1' : '16:9'}
              </span>
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Storyboard Mode */}
      <SettingsSection icon={Film} title="Storyboard Mode" description="Switch between manga and movie previsualization">
        <div className="grid grid-cols-2 gap-2">
          {(['manga', 'movie'] as StoryboardMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdateSettings({ storyboardMode: mode })}
              className={cn(
                'rounded-lg p-3 border text-center transition-all',
                project.settings.storyboardMode === mode
                  ? 'bg-violet-500/15 border-violet-500/30 text-white'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5',
              )}
            >
              <span className="text-[13px] font-semibold block capitalize">
                {mode === 'manga' ? 'Manga' : 'Movie Storyboard'}
              </span>
              <span className="text-[11px] text-zinc-500">
                {mode === 'manga' ? 'Portrait panels, B&W default' : '16:9 frames, cinematic'}
              </span>
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Info */}
      <div className="rounded-lg glass p-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <p className="text-[12px] text-zinc-500 leading-relaxed">
          StoryForge AI uses Google's Gemini models for story analysis, panel specification, and image generation.
          Your API key is kept secure on the server and never exposed to the browser. All project data is stored locally in your browser.
        </p>
      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Key;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl glass p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-violet-400" />
        <div>
          <h2 className="text-sm font-semibold text-white font-display">{title}</h2>
          <p className="text-[11px] text-zinc-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
