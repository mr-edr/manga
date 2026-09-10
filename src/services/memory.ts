import type { StoryMemory } from '@/types/story';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'on', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off',
  'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  's', 't', 'just', 'don', 'now', 'he', 'she', 'it', 'they', 'we', 'you', 'i',
  'his', 'her', 'its', 'their', 'our', 'your', 'my', 'this', 'that', 'these',
  'those', 'what', 'which', 'who', 'whom',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

export function retrieveRelevantMemories(
  query: string,
  memories: StoryMemory[],
  limit = 5,
): StoryMemory[] {
  if (memories.length === 0) return [];

  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return memories.slice(-limit);

  const scored = memories.map((mem) => {
    const memTokens = new Set(tokenize(mem.text + ' ' + mem.type));
    let overlap = 0;
    for (const t of queryTokens) {
      if (memTokens.has(t)) overlap++;
    }
    // Boost more recent memories slightly
    const recencyBoost = mem.timestamp ? 0.1 : 0;
    return { mem, score: overlap + recencyBoost };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.mem);
}

export function addMemory(
  memories: StoryMemory[],
  text: string,
  type: StoryMemory['type'],
  chapter: number,
  scene: number,
  characters: string[] = [],
): StoryMemory[] {
  const newMem: StoryMemory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text,
    type,
    chapter,
    scene,
    characters,
    timestamp: Date.now(),
  };
  // Avoid duplicates by text
  if (memories.some((m) => m.text === text)) return memories;
  return [...memories, newMem];
}
