import type { VisualStyleOption, Project, StoryMemory } from '@/types/story';

export const VISUAL_STYLES: VisualStyleOption[] = [
  {
    id: 'bw_manga',
    label: 'Black & White Manga',
    description: 'High-contrast Japanese manga ink style with screentones',
    promptFragment:
      'High contrast black and white Japanese manga ink style, dramatic screentones, expressive faces, dynamic line work, cinematic framing',
  },
  {
    id: 'colored_manga',
    label: 'Colored Manga',
    description: 'Vibrant colored manga with cel-shading',
    promptFragment:
      'Colored manga style with vibrant cel-shading, clean linework, expressive character designs, dramatic color palettes',
  },
  {
    id: 'anime',
    label: 'Anime',
    description: 'Modern anime aesthetic with detailed backgrounds',
    promptFragment:
      'Modern anime art style, detailed backgrounds, expressive eyes, dynamic lighting, studio-quality animation key visual',
  },
  {
    id: 'cinematic_storyboard',
    label: 'Cinematic Storyboard',
    description: 'Film storyboard with camera and lighting notes',
    promptFragment:
      'Cinematic film storyboard style, rough but expressive sketch, annotated with camera direction, dramatic lighting, professional storyboard frame',
  },
  {
    id: 'graphic_novel',
    label: 'Graphic Novel',
    description: 'Western graphic novel style with rich shading',
    promptFragment:
      'Western graphic novel art style, rich ink shading, detailed illustrations, dramatic compositions, professional comic book page',
  },
  {
    id: 'webtoon',
    label: 'Webtoon',
    description: 'Korean webtoon style with soft colors',
    promptFragment:
      'Korean webtoon art style, soft digital coloring, clean lines, vertical scroll panel format, expressive character designs',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Define your own visual style',
    promptFragment: '',
  },
];

export function getStylePrompt(
  styleId: string,
  customStyle: string,
  mode: 'manga' | 'movie',
): string {
  if (styleId === 'custom' && customStyle) return customStyle;
  const found = VISUAL_STYLES.find((s) => s.id === styleId);
  const base = found?.promptFragment || VISUAL_STYLES[0].promptFragment;
  if (mode === 'movie') {
    return `Cinematic storyboard frame, 16:9 widescreen composition, professional film previsualization. ${base}`;
  }
  return base;
}

export function aspectRatioToDimensions(ratio: string): { width: number; height: number; label: string } {
  switch (ratio) {
    case 'square':
      return { width: 1024, height: 1024, label: '1:1' };
    case 'landscape':
      return { width: 1280, height: 720, label: '16:9' };
    default:
      return { width: 768, height: 1024, label: '3:4' };
  }
}

const now = Date.now();

const demoMemories: StoryMemory[] = [
  { id: 'mem_1', text: 'Arjun and Ravi are best friends and university classmates.', type: 'relationship', chapter: 1, scene: 0, characters: ['char_arjun', 'char_ravi'], timestamp: now - 80000 },
  { id: 'mem_2', text: 'Ravi possesses supernatural abilities he has kept hidden.', type: 'lore', chapter: 1, scene: 0, characters: ['char_ravi'], timestamp: now - 79000 },
  { id: 'mem_3', text: 'Ravi has hidden his abilities from Arjun for years, fearing discovery.', type: 'character', chapter: 1, scene: 0, characters: ['char_ravi'], timestamp: now - 78000 },
  { id: 'mem_4', text: 'Arjun becomes suspicious after Ravi behaves strangely during class.', type: 'event', chapter: 1, scene: 1, characters: ['char_arjun', 'char_ravi'], timestamp: now - 77000 },
  { id: 'mem_5', text: 'Arjun follows Ravi to an abandoned classroom after evening class.', type: 'event', chapter: 1, scene: 2, characters: ['char_arjun', 'char_ravi'], timestamp: now - 76000 },
  { id: 'mem_6', text: 'Arjun witnesses Ravi using supernatural powers in the abandoned classroom.', type: 'event', chapter: 1, scene: 3, characters: ['char_arjun', 'char_ravi'], timestamp: now - 75000 },
  { id: 'mem_7', text: 'Ravi fears what will happen if people discover his secret.', type: 'character', chapter: 1, scene: 3, characters: ['char_ravi'], timestamp: now - 74000 },
  { id: 'mem_8', text: 'Arjun does not initially know the full truth about Ravi.', type: 'character', chapter: 1, scene: 3, characters: ['char_arjun'], timestamp: now - 73000 },
];

export function createDemoProject(): Project {
  return {
    id: 'demo_the_last_class',
    name: 'THE LAST CLASS',
    story:
      'Arjun is a university student who notices that his best friend Ravi has been behaving strangely. One evening after class, Arjun follows Ravi into an abandoned classroom and discovers that Ravi possesses supernatural abilities. Ravi has been hiding this secret for years because he fears what will happen if people discover the truth.',
    title: 'THE LAST CLASS',
    genre: 'Supernatural Drama / Mystery',
    tone: 'Suspenseful, intimate, mysterious',
    visual_style: 'High contrast black and white Japanese manga style, dramatic screentones, expressive faces, cinematic framing',
    currentScene: 'The Abandoned Classroom',
    currentSceneDescription:
      'Evening light filters through dusty windows of an abandoned university classroom. Arjun confronts Ravi after witnessing his supernatural abilities.',
    characters: [
      {
        id: 'char_arjun',
        name: 'Arjun',
        age: 19,
        appearance:
          'Short black hair, brown eyes, slim athletic build. Curious and determined expression.',
        personality: 'Curious, skeptical, loyal, brave. Willing to follow the truth wherever it leads.',
        role: 'Protagonist',
        visual_traits: ['Short black hair', 'Brown eyes', 'Slim athletic build', 'Determined expression'],
        outfit: 'Dark hoodie over a casual t-shirt, jeans, sneakers',
        canonicalImage: null,
        referenceImages: [],
        isCanonical: false,
      },
      {
        id: 'char_ravi',
        name: 'Ravi',
        age: 19,
        appearance:
          'Messy dark hair, sharp intense eyes, tall and slender build. Quiet, mysterious demeanor.',
        personality: 'Quiet, mysterious, guarded. Deeply fears rejection due to his secret.',
        role: 'Supporting Character',
        visual_traits: ['Messy dark hair', 'Sharp eyes', 'Tall slender build', 'Mysterious demeanor'],
        outfit: 'University uniform — white shirt, dark trousers, loosened tie',
        canonicalImage: null,
        referenceImages: [],
        isCanonical: false,
      },
    ],
    characterStates: [
      {
        characterId: 'char_arjun',
        location: 'Abandoned classroom',
        outfit: 'Dark hoodie, jeans, sneakers',
        emotion: 'Suspicious',
        injuries: 'None',
        notes: 'Has just witnessed Ravi using supernatural powers',
        relationships: [
          { targetId: 'char_ravi', type: 'trust', description: 'Best friend → Suspicious and confused' },
        ],
      },
      {
        characterId: 'char_ravi',
        location: 'Abandoned classroom',
        outfit: 'University uniform, loosened tie',
        emotion: 'Nervous',
        injuries: 'None',
        notes: 'Secret has been discovered; fears the consequences',
        relationships: [
          { targetId: 'char_arjun', type: 'trust', description: 'Best friend → Hiding something, now exposed' },
        ],
      },
    ],
    locations: [
      {
        id: 'loc_classroom',
        name: 'Abandoned Classroom',
        description: 'A dusty, disused university classroom with old desks stacked against walls. Evening light filters through dirty windows.',
        visual_traits: ['Dusty old desks', 'Dirty windows with evening light', 'Stacked chairs', 'Chalkboard', 'Abandoned atmosphere'],
      },
      {
        id: 'loc_university',
        name: 'University Campus',
        description: 'A modern university campus with hallways and classrooms, transitioning to evening.',
        visual_traits: ['Modern university building', 'Hallway with lockers', 'Evening light', 'Students in background'],
      },
    ],
    objects: [
      { id: 'obj_hoodie', name: "Arjun's Dark Hoodie", description: 'A dark colored hoodie that Arjun wears throughout the story.' },
    ],
    relationships: [
      { from: 'char_arjun', to: 'char_ravi', type: 'best_friends', description: 'Arjun and Ravi are best friends, but trust is now strained.' },
    ],
    events: [
      { id: 'evt_1', description: 'Arjun notices Ravi behaving strangely', characters: ['char_arjun', 'char_ravi'], chapter: 1, scene: 1 },
      { id: 'evt_2', description: 'Arjun follows Ravi to the abandoned classroom', characters: ['char_arjun', 'char_ravi'], chapter: 1, scene: 2 },
      { id: 'evt_3', description: 'Arjun witnesses Ravi using supernatural powers', characters: ['char_arjun', 'char_ravi'], chapter: 1, scene: 3 },
    ],
    memories: demoMemories,
    panels: [],
    settings: {
      visualStyle: 'bw_manga',
      customStyle: '',
      aspectRatio: 'portrait',
      storyboardMode: 'manga',
    },
    chapter: 1,
    scene: 3,
    isDemo: true,
    createdAt: now,
    updatedAt: now,
  };
}
