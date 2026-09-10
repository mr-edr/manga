import type {
  Project,
  GenerationContext,
  StoryMemory,
  Character,
} from '@/types/story';
import { retrieveRelevantMemories } from './memory';
import { getStylePrompt } from './demoData';

export function buildGenerationContext(
  project: Project,
  request: string,
): GenerationContext {
  const relevantMemories = retrieveRelevantMemories(
    `${request} ${project.currentScene}`,
    project.memories,
    8,
  );

  const previousPanel = project.panels.length > 0
    ? project.panels[project.panels.length - 1].image
    : null;

  const characters: GenerationContext['characters'] = project.characters.map((c) => ({
    id: c.id,
    name: c.name,
    appearance: c.appearance,
    outfit: c.outfit,
    visual_traits: c.visual_traits,
  }));

  const visualStyle = getStylePrompt(
    project.settings.visualStyle,
    project.settings.customStyle,
    project.settings.storyboardMode,
  );

  const continuityConstraints = buildContinuityConstraints(project);

  return {
    story_context: project.story,
    relevant_memories: relevantMemories,
    characters,
    locations: project.locations,
    objects: project.objects,
    previous_panel: previousPanel,
    visual_style: visualStyle,
    continuity_constraints: continuityConstraints,
  };
}

function buildContinuityConstraints(project: Project): string[] {
  const constraints: string[] = [];

  for (const char of project.characters) {
    if (char.isCanonical) {
      constraints.push(
        `${char.name} must retain their canonical appearance — preserve facial structure, hairstyle, eye color, and body proportions exactly`,
      );
    }
    constraints.push(`${char.name} must wear: ${char.outfit} (unless the story explicitly changes it)`);
  }

  if (project.panels.length > 0) {
    const lastPanel = project.panels[project.panels.length - 1];
    constraints.push(
      `Maintain visual continuity with the previous panel (Panel ${lastPanel.number}) — do not change the location unnecessarily`,
    );
  }

  constraints.push(`Maintain the established visual style: ${getStylePrompt(project.settings.visualStyle, project.settings.customStyle, project.settings.storyboardMode)}`);
  constraints.push('Do not introduce random characters not specified in the scene');
  constraints.push('Preserve distinctive character features across all panels');

  return constraints;
}

export function buildImagePrompt(
  spec: {
    shot_type: string;
    camera_angle: string;
    characters?: string[];
    action: string;
    emotion: Record<string, string>;
    location: string;
    lighting: string;
    composition: string;
    continuity_constraints: string[];
    panel_description: string;
  },
  project: Project,
): string {
  const charNames = (spec.characters || [])
    .map((id: string) => project.characters.find((c) => c.id === id))
    .filter(Boolean) as Character[];

  const charDescriptions = charNames
    .map((c) => {
      const state = project.characterStates.find((s) => s.characterId === c.id);
      const emotion = spec.emotion[c.name] || state?.emotion || 'neutral';
      return `${c.name}: ${c.appearance}. Wearing: ${c.outfit}. Expression: ${emotion}. Role: ${c.role}.`;
    })
    .join('\n');

  const emotionList = Object.entries(spec.emotion)
    .map(([name, emo]) => `${name}: ${emo}`)
    .join(', ');

  const stylePrompt = getStylePrompt(
    project.settings.visualStyle,
    project.settings.customStyle,
    project.settings.storyboardMode,
  );

  const modeNote =
    project.settings.storyboardMode === 'movie'
      ? 'Create a 16:9 widescreen cinematic storyboard frame. Include subtle indications of camera angle and shot type in the composition.'
      : 'Create a portrait-oriented manga panel with expressive manga visual language.';

  return `You are generating a ${project.settings.storyboardMode === 'movie' ? 'cinematic storyboard frame' : 'manga panel'}.

SCENE:
${spec.panel_description || spec.action}

SHOT: ${spec.shot_type}
CAMERA ANGLE: ${spec.camera_angle}
COMPOSITION: ${spec.composition}
LIGHTING: ${spec.lighting}
LOCATION: ${spec.location}
EMOTION: ${emotionList}

CHARACTERS IN THIS PANEL:
${charDescriptions || 'No specific characters — environmental/scene shot'}

VISUAL STYLE:
${stylePrompt}

${modeNote}

CRITICAL CONTINUITY RULES:
${spec.continuity_constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

- Preserve character identity: maintain facial structure, hairstyle, eye color, body proportions, and clothing exactly as described.
- Maintain continuity with the previous panel if provided as a reference image.
- Do not introduce random characters not specified above.
- Do not change the location unnecessarily.
- If reference character images are provided, match them exactly.`;
}

export function buildCharacterReferencePrompt(
  character: Character,
  visualStyle: string,
): string {
  const traits = character.visual_traits.join(', ');
  return `Create a clean character reference sheet for the following fictional manga character.

CHARACTER:
Name: ${character.name}
Age: ${character.age || 'young adult'}
Appearance: ${character.appearance}
Visual traits: ${traits}
Outfit: ${character.outfit}
Personality: ${character.personality}

Generate the same character consistently in multiple views on a single sheet:
- Front view (full body)
- Three-quarter view
- Side profile view
- Neutral expression close-up
- Smiling expression close-up
- Angry/determined expression close-up

Maintain EXACTLY the same facial structure, hairstyle, eye color, body proportions, clothing, and distinctive characteristics across every view.

${visualStyle}

Clean character design reference sheet. Plain white background. No text, no speech bubbles, no panels. Professional character turnaround sheet.`;
}
