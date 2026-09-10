import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Project,
  Panel,
  PanelSpecification,
  ContinuityReport,
  Character,
  StoryMemory,
  CharacterState,
  AnalysisResult,
} from '@/types/story';
import { createDemoProject, getStylePrompt } from '@/services/demoData';
import { loadProject, saveProject, dataUrlToBase64 } from '@/services/persistence';
import { buildGenerationContext, buildImagePrompt, buildCharacterReferencePrompt } from '@/services/contextBuilder';
import { addMemory, retrieveRelevantMemories } from '@/services/memory';
import {
  analyzeStory,
  generatePanelSpec,
  generateImage,
  checkContinuity,
  continueStory,
  parseJsonResponse,
  type ImageInput,
} from '@/services/gemini';

export type GenerationStep =
  | 'idle'
  | 'understanding'
  | 'retrieving'
  | 'loading_refs'
  | 'building'
  | 'generating'
  | 'checking'
  | 'done'
  | 'error';

export const STEP_LABELS: Record<GenerationStep, string> = {
  idle: 'Ready',
  understanding: 'Understanding story...',
  retrieving: 'Retrieving story memory...',
  loading_refs: 'Loading character references...',
  building: 'Building scene context...',
  generating: 'Generating panel...',
  checking: 'Checking continuity...',
  done: 'Complete',
  error: 'Generation failed',
};

export const STEP_ORDER: GenerationStep[] = [
  'understanding',
  'retrieving',
  'loading_refs',
  'building',
  'generating',
  'checking',
];

export function useProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [genStep, setGenStep] = useState<GenerationStep>('idle');
  const [genError, setGenError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingCharId, setGeneratingCharId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from storage on mount
  useEffect(() => {
    const loaded = loadProject();
    if (loaded) {
      setProject(loaded);
    }
    checkApiHealth();
  }, []);

  // Debounced save
  useEffect(() => {
    if (!project) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProject(project), 500);
  }, [project]);

  const checkApiHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setApiConnected(data.configured === true);
    } catch {
      setApiConnected(false);
    }
  }, []);

  const updateProject = useCallback((updater: (prev: Project) => Project) => {
    setProject((prev) => (prev ? updater({ ...prev, updatedAt: Date.now() }) : prev));
  }, []);

  const loadDemo = useCallback(() => {
    setProject(createDemoProject());
    setGenStep('idle');
    setGenError(null);
  }, []);

  const newProject = useCallback(() => {
    const now = Date.now();
    setProject({
      id: `proj_${now}`,
      name: 'Untitled Story',
      story: '',
      title: '',
      genre: '',
      tone: '',
      visual_style: '',
      currentScene: '',
      currentSceneDescription: '',
      characters: [],
      characterStates: [],
      locations: [],
      objects: [],
      relationships: [],
      events: [],
      memories: [],
      panels: [],
      settings: {
        visualStyle: 'bw_manga',
        customStyle: '',
        aspectRatio: 'portrait',
        storyboardMode: 'manga',
      },
      chapter: 1,
      scene: 0,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    });
    setGenStep('idle');
    setGenError(null);
  }, []);

  const setStory = useCallback(
    (story: string) => {
      updateProject((prev) => ({ ...prev, story }));
    },
    [updateProject],
  );

  const updateSettings = useCallback(
    (settings: Partial<Project['settings']>) => {
      updateProject((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    },
    [updateProject],
  );

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Step 1: Analyze story
  const handleAnalyzeStory = useCallback(async (): Promise<boolean> => {
    if (!project || !project.story.trim()) {
      setGenError('Please write or paste a story first.');
      return false;
    }
    setIsGenerating(true);
    setGenError(null);
    setGenStep('understanding');
    try {
      const res = await analyzeStory(project.story);
      if (!res.ok || !res.data) throw new Error(res.error || 'Analysis failed');
      const parsed = parseJsonResponse<AnalysisResult>(res.data.result);
      if (!parsed) throw new Error('Could not parse story analysis');

      updateProject((prev) => {
        const existingCharIds = new Set(prev.characters.map((c) => c.id));
        const newChars: Character[] = (parsed.characters || []).map((c) => ({
          ...c,
          canonicalImage: null,
          referenceImages: [],
          isCanonical: false,
        }));
        // Merge: keep existing characters with images, add new ones
        const mergedChars = [
          ...prev.characters.filter((c) => existingCharIds.has(c.id)),
          ...newChars.filter((c) => !existingCharIds.has(c.id)),
        ];

        const newStates: CharacterState[] = newChars.map((c) => ({
          characterId: c.id,
          location: parsed.current_scene || '',
          outfit: c.outfit || '',
          emotion: 'neutral',
          injuries: 'None',
          notes: '',
          relationships: [],
        }));
        const existingStateIds = new Set(prev.characterStates.map((s) => s.characterId));
        const mergedStates = [
          ...prev.characterStates,
          ...newStates.filter((s) => !existingStateIds.has(s.characterId)),
        ];

        const newMemories: StoryMemory[] = (parsed.events || []).map((e) => ({
          id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: e.description,
          type: 'event' as const,
          chapter: e.chapter || prev.chapter,
          scene: e.scene || prev.scene,
          characters: e.characters || [],
          timestamp: Date.now(),
        }));

        // Add relationship memories
        const relMemories: StoryMemory[] = (parsed.relationships || []).map((r) => ({
          id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          text: r.description,
          type: 'relationship' as const,
          chapter: prev.chapter,
          scene: 0,
          characters: [r.from, r.to],
          timestamp: Date.now(),
        }));

        // Deduplicate memories by text
        const allNewMems = [...newMemories, ...relMemories];
        const existingTexts = new Set(prev.memories.map((m) => m.text));
        const deduped = allNewMems.filter((m) => !existingTexts.has(m.text));

        return {
          ...prev,
          title: parsed.title || prev.title,
          genre: parsed.genre || prev.genre,
          tone: parsed.tone || prev.tone,
          visual_style: parsed.visual_style || prev.visual_style,
          currentScene: parsed.current_scene || prev.currentScene,
          currentSceneDescription: parsed.current_scene_description || prev.currentSceneDescription,
          characters: mergedChars,
          characterStates: mergedStates,
          locations: parsed.locations || prev.locations,
          objects: parsed.objects || prev.objects,
          relationships: parsed.relationships || prev.relationships,
          events: parsed.events || prev.events,
          memories: [...prev.memories, ...deduped],
        };
      });

      setGenStep('done');
      setTimeout(() => setGenStep('idle'), 1500);
      return true;
    } catch (err: any) {
      setGenError(err?.message || 'Story analysis failed. Check your Gemini API key or try again.');
      setGenStep('error');
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [project, updateProject]);

  // Generate a character reference sheet
  const generateCharacterReference = useCallback(
    async (characterId: string): Promise<boolean> => {
      if (!project) return false;
      const character = project.characters.find((c) => c.id === characterId);
      if (!character) return false;

      setIsGenerating(true);
      setGeneratingCharId(characterId);
      setGenError(null);
      setGenStep('generating');
      try {
        const stylePrompt = getStylePrompt(
          project.settings.visualStyle,
          project.settings.customStyle,
          project.settings.storyboardMode,
        );
        const prompt = buildCharacterReferencePrompt(character, stylePrompt);
        const res = await generateImage(prompt, [], null);
        if (!res.ok || !res.data) throw new Error(res.error || 'Image generation failed');

        updateProject((prev) => ({
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === characterId
              ? {
                  ...c,
                  canonicalImage: res.data!.imageUrl,
                  isCanonical: true,
                  referenceImages: [...new Set([...c.referenceImages, res.data!.imageUrl])],
                }
              : c,
          ),
        }));

        setGenStep('done');
        setTimeout(() => setGenStep('idle'), 1500);
        return true;
      } catch (err: any) {
        setGenError(err?.message || 'Character image generation failed.');
        setGenStep('error');
        return false;
      } finally {
        setIsGenerating(false);
        setGeneratingCharId(null);
      }
    },
    [project, updateProject],
  );

  // Full panel generation pipeline
  const generatePanel = useCallback(
    async (request: string): Promise<boolean> => {
      if (!project) return false;
      if (!request.trim()) {
        setGenError('Please describe what should happen in the panel.');
        return false;
      }

      setIsGenerating(true);
      setGenError(null);

      try {
        // Step 1: Understanding story
        setGenStep('understanding');
        await sleep(300);

        // Step 2: Retrieving memory
        setGenStep('retrieving');
        await sleep(400);

        // Step 3: Loading character references
        setGenStep('loading_refs');
        await sleep(300);

        // Build context
        const context = buildGenerationContext(project, request);

        // Step 4: Building scene — get panel spec from Gemini
        setGenStep('building');
        const specRes = await generatePanelSpec(request, context);
        if (!specRes.ok || !specRes.data) throw new Error(specRes.error || 'Panel spec generation failed');
        const spec = parseJsonResponse<PanelSpecification>(specRes.data.result);
        if (!spec) throw new Error('Could not parse panel specification');

        // Step 5: Generating panel image
        setGenStep('generating');
        const imagePrompt = buildImagePrompt(spec, project);

        // Gather reference images (canonical character images)
        const refImages: ImageInput[] = [];
        for (const charId of spec.characters || []) {
          const char = project.characters.find((c) => c.id === charId);
          if (char?.canonicalImage) {
            refImages.push({
              data: dataUrlToBase64(char.canonicalImage),
              mimeType: 'image/png',
            });
          }
        }

        // Previous panel
        let prevPanel: ImageInput | null = null;
        if (project.panels.length > 0) {
          const lastPanel = project.panels[project.panels.length - 1];
          if (lastPanel.image) {
            prevPanel = {
              data: dataUrlToBase64(lastPanel.image),
              mimeType: 'image/png',
            };
          }
        }

        const imgRes = await generateImage(imagePrompt, refImages, prevPanel);
        if (!imgRes.ok || !imgRes.data) throw new Error(imgRes.error || 'Image generation failed');

        // Step 6: Checking continuity
        setGenStep('checking');
        let continuity: ContinuityReport | null = null;
        try {
          const contRes = await checkContinuity(
            dataUrlToBase64(imgRes.data.imageUrl),
            spec,
            context,
          );
          if (contRes.ok && contRes.data) {
            continuity = parseJsonResponse<ContinuityReport>(contRes.data.result);
          }
        } catch {
          // Continuity check is optional — don't fail the whole generation
        }

        // Create the panel
        const panelNumber = project.panels.length + 1;
        const newPanel: Panel = {
          id: `panel_${Date.now()}`,
          number: panelNumber,
          sceneNumber: project.scene + 1,
          image: imgRes.data.imageUrl,
          spec,
          description: spec.panel_description || spec.action,
          characters: spec.characters || [],
          continuity,
          generating: false,
          createdAt: Date.now(),
        };

        // Update project: add panel, memories, character states
        updateProject((prev) => {
          let memories = prev.memories;

          // Add events to remember from the spec
          const specEvents = (spec as any).events_to_remember;
          if (Array.isArray(specEvents)) {
            for (const evt of specEvents) {
              memories = addMemory(
                memories,
                evt.text,
                evt.type || 'event',
                prev.chapter,
                prev.scene + 1,
                evt.characters || spec.characters || [],
              );
            }
          }

          // Add a scene memory
          memories = addMemory(
            memories,
            `Scene ${prev.scene + 1}: ${spec.panel_description || spec.action}`,
            'scene',
            prev.chapter,
            prev.scene + 1,
            spec.characters || [],
          );

          // Update character states
          let characterStates = prev.characterStates;
          const stateUpdates = (spec as any).character_state_updates;
          if (Array.isArray(stateUpdates)) {
            characterStates = characterStates.map((s) => {
              const update = stateUpdates.find((u: any) => u.characterId === s.characterId);
              if (!update) return s;
              return {
                ...s,
                location: update.location || s.location,
                outfit: update.outfit || s.outfit,
                emotion: update.emotion || s.emotion,
                notes: update.notes || s.notes,
              };
            });
          }

          return {
            ...prev,
            panels: [...prev.panels, newPanel],
            memories,
            characterStates,
            scene: prev.scene + 1,
          };
        });

        setGenStep('done');
        setTimeout(() => setGenStep('idle'), 1500);
        return true;
      } catch (err: any) {
        setGenError(err?.message || 'Generation failed. Check your Gemini API key or try again.');
        setGenStep('error');
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [project, updateProject],
  );

  // Continue story — auto-propose next scene and generate panel
  const handleContinueStory = useCallback(async (): Promise<boolean> => {
    if (!project) return false;
    if (project.panels.length === 0 && !project.story) {
      setGenError('Load the demo story or write a story first.');
      return false;
    }

    setIsGenerating(true);
    setGenError(null);

    try {
      setGenStep('understanding');
      await sleep(300);

      setGenStep('retrieving');
      await sleep(400);

      setGenStep('loading_refs');
      await sleep(300);

      // Build context for continuation
      const context = buildGenerationContext(project, 'Continue the story to the next scene');
      const lastPanel = project.panels[project.panels.length - 1];
      const contextForContinue = {
        ...context,
        current_scene: project.currentScene,
        current_scene_description: project.currentSceneDescription,
        character_states: project.characterStates,
        last_panel_description: lastPanel?.description || '',
        chapter: project.chapter,
        scene: project.scene,
        panel_count: project.panels.length,
      };

      setGenStep('building');
      const contRes = await continueStory(contextForContinue);
      if (!contRes.ok || !contRes.data) throw new Error(contRes.error || 'Story continuation failed');
      const continuation = parseJsonResponse<{
        next_scene_description: string;
        panel_request: string;
        events_to_remember: { text: string; type: string; characters: string[] }[];
        character_state_updates: { characterId: string; location: string; outfit: string; emotion: string; notes: string }[];
        narrative_summary: string;
      }>(contRes.data.result);

      if (!continuation) throw new Error('Could not parse story continuation');

      // Update current scene before generating
      updateProject((prev) => ({
        ...prev,
        currentSceneDescription: continuation.next_scene_description,
      }));

      // Now generate the panel using the panel_request
      setGenStep('building');
      const panelContext = buildGenerationContext(
        { ...project, currentSceneDescription: continuation.next_scene_description },
        continuation.panel_request,
      );
      const specRes = await generatePanelSpec(continuation.panel_request, panelContext);
      if (!specRes.ok || !specRes.data) throw new Error(specRes.error || 'Panel spec generation failed');
      const spec = parseJsonResponse<PanelSpecification>(specRes.data.result);
      if (!spec) throw new Error('Could not parse panel specification');

      // Generate image
      setGenStep('generating');
      const imagePrompt = buildImagePrompt(spec, project);
      const refImages: ImageInput[] = [];
      for (const charId of spec.characters || []) {
        const char = project.characters.find((c) => c.id === charId);
        if (char?.canonicalImage) {
          refImages.push({ data: dataUrlToBase64(char.canonicalImage), mimeType: 'image/png' });
        }
      }
      let prevPanel: ImageInput | null = null;
      if (project.panels.length > 0) {
        const last = project.panels[project.panels.length - 1];
        if (last.image) {
          prevPanel = { data: dataUrlToBase64(last.image), mimeType: 'image/png' };
        }
      }

      const imgRes = await generateImage(imagePrompt, refImages, prevPanel);
      if (!imgRes.ok || !imgRes.data) throw new Error(imgRes.error || 'Image generation failed');

      // Check continuity
      setGenStep('checking');
      let continuity: ContinuityReport | null = null;
      try {
        const contRes2 = await checkContinuity(
          dataUrlToBase64(imgRes.data.imageUrl),
          spec,
          panelContext,
        );
        if (contRes2.ok && contRes2.data) {
          continuity = parseJsonResponse<ContinuityReport>(contRes2.data.result);
        }
      } catch {
        // Optional
      }

      const panelNumber = project.panels.length + 1;
      const newPanel: Panel = {
        id: `panel_${Date.now()}`,
        number: panelNumber,
        sceneNumber: project.scene + 1,
        image: imgRes.data.imageUrl,
        spec,
        description: spec.panel_description || spec.action,
        characters: spec.characters || [],
        continuity,
        generating: false,
        createdAt: Date.now(),
      };

      updateProject((prev) => {
        let memories = prev.memories;
        // Add continuation events
        if (Array.isArray(continuation.events_to_remember)) {
          for (const evt of continuation.events_to_remember) {
            memories = addMemory(memories, evt.text, (evt.type || 'event') as StoryMemory['type'], prev.chapter, prev.scene + 1, evt.characters || []);
          }
        }
        // Add scene memory
        memories = addMemory(memories, `Scene ${prev.scene + 1}: ${continuation.next_scene_description}`, 'scene', prev.chapter, prev.scene + 1, spec.characters || []);

        // Update character states
        let characterStates = prev.characterStates;
        if (Array.isArray(continuation.character_state_updates)) {
          characterStates = characterStates.map((s) => {
            const update = continuation.character_state_updates.find((u) => u.characterId === s.characterId);
            if (!update) return s;
            return {
              ...s,
              location: update.location || s.location,
              outfit: update.outfit || s.outfit,
              emotion: update.emotion || s.emotion,
              notes: update.notes || s.notes,
            };
          });
        }

        return {
          ...prev,
          panels: [...prev.panels, newPanel],
          memories,
          characterStates,
          scene: prev.scene + 1,
          currentSceneDescription: continuation.next_scene_description,
        };
      });

      setGenStep('done');
      setTimeout(() => setGenStep('idle'), 1500);
      return true;
    } catch (err: any) {
      setGenError(err?.message || 'Story continuation failed.');
      setGenStep('error');
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [project, updateProject]);

  const deletePanel = useCallback(
    (panelId: string) => {
      updateProject((prev) => ({
        ...prev,
        panels: prev.panels
          .filter((p) => p.id !== panelId)
          .map((p, i) => ({ ...p, number: i + 1 })),
      }));
    },
    [updateProject],
  );

  const regeneratePanel = useCallback(
    async (panelId: string): Promise<boolean> => {
      if (!project) return false;
      const panel = project.panels.find((p) => p.id === panelId);
      if (!panel) return false;
      // Regenerate using the panel's original spec/request
      const request = panel.description || panel.spec.action;
      setIsGenerating(true);
      setGenError(null);
      setGenStep('generating');
      try {
        const imagePrompt = buildImagePrompt(panel.spec, project);
        const refImages: ImageInput[] = [];
        for (const charId of panel.spec.characters || []) {
          const char = project.characters.find((c) => c.id === charId);
          if (char?.canonicalImage) {
            refImages.push({ data: dataUrlToBase64(char.canonicalImage), mimeType: 'image/png' });
          }
        }
        // Use the panel before this one as previous panel
        const panelIndex = project.panels.findIndex((p) => p.id === panelId);
        let prevPanel: ImageInput | null = null;
        if (panelIndex > 0) {
          const prev = project.panels[panelIndex - 1];
          if (prev.image) {
            prevPanel = { data: dataUrlToBase64(prev.image), mimeType: 'image/png' };
          }
        }

        const imgRes = await generateImage(imagePrompt, refImages, prevPanel);
        if (!imgRes.ok || !imgRes.data) throw new Error(imgRes.error || 'Image regeneration failed');

        updateProject((prev) => ({
          ...prev,
          panels: prev.panels.map((p) =>
            p.id === panelId ? { ...p, image: imgRes.data!.imageUrl } : p,
          ),
        }));

        setGenStep('done');
        setTimeout(() => setGenStep('idle'), 1500);
        return true;
      } catch (err: any) {
        setGenError(err?.message || 'Panel regeneration failed.');
        setGenStep('error');
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [project, updateProject],
  );

  const setCanonicalImage = useCallback(
    (characterId: string, imageUrl: string) => {
      updateProject((prev) => ({
        ...prev,
        characters: prev.characters.map((c) =>
          c.id === characterId
            ? { ...c, canonicalImage: imageUrl, isCanonical: true, referenceImages: [...new Set([...c.referenceImages, imageUrl])] }
            : c,
        ),
      }));
    },
    [updateProject],
  );

  const deleteCharacter = useCallback(
    (characterId: string) => {
      updateProject((prev) => ({
        ...prev,
        characters: prev.characters.filter((c) => c.id !== characterId),
        characterStates: prev.characterStates.filter((s) => s.characterId !== characterId),
      }));
    },
    [updateProject],
  );

  const updateCharacter = useCallback(
    (characterId: string, updates: Partial<Character>) => {
      updateProject((prev) => ({
        ...prev,
        characters: prev.characters.map((c) =>
          c.id === characterId ? { ...c, ...updates } : c,
        ),
      }));
    },
    [updateProject],
  );

  const searchMemories = useCallback(
    (query: string): StoryMemory[] => {
      if (!project) return [];
      if (!query.trim()) return project.memories;
      return retrieveRelevantMemories(query, project.memories, 50);
    },
    [project],
  );

  return {
    project,
    isGenerating,
    genStep,
    genError,
    apiConnected,
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
    updateCharacter,
    searchMemories,
    checkApiHealth,
    generatingCharId,
    clearGenError: () => { setGenError(null); setGenStep('idle'); },
  };
}
