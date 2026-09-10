export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, error: json.error || `Server error (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Network error — could not reach the server.',
    };
  }
}

export interface HealthResponse {
  configured: boolean;
}

export interface AnalyzeStoryResponse {
  result: string;
}

export interface GeneratePanelSpecResponse {
  result: string;
}

export interface ContinueStoryResponse {
  result: string;
}

export interface CheckContinuityResponse {
  result: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
  mimeType: string;
}

export async function checkHealth(): Promise<ApiResult<HealthResponse>> {
  try {
    const res = await fetch('/api/health');
    const json = await res.json();
    return { ok: true, data: json as HealthResponse };
  } catch {
    return { ok: false, error: 'Could not reach server.' };
  }
}

export async function analyzeStory(story: string): Promise<ApiResult<AnalyzeStoryResponse>> {
  return postJson<AnalyzeStoryResponse>('/api/analyze-story', { story });
}

export async function generatePanelSpec(
  request: string,
  context: unknown,
): Promise<ApiResult<GeneratePanelSpecResponse>> {
  return postJson<GeneratePanelSpecResponse>('/api/generate-panel-spec', { request, context });
}

export async function continueStory(
  context: unknown,
): Promise<ApiResult<ContinueStoryResponse>> {
  return postJson<ContinueStoryResponse>('/api/continue-story', { context });
}

export async function checkContinuity(
  panelImage: string,
  panelSpec: unknown,
  context: unknown,
): Promise<ApiResult<CheckContinuityResponse>> {
  return postJson<CheckContinuityResponse>('/api/check-continuity', {
    panelImage,
    panelSpec,
    context,
  });
}

export interface ImageInput {
  data: string;
  mimeType: string;
}

export async function generateImage(
  prompt: string,
  referenceImages: ImageInput[] = [],
  previousPanel: ImageInput | null = null,
): Promise<ApiResult<GenerateImageResponse>> {
  return postJson<GenerateImageResponse>('/api/generate-image', {
    prompt,
    referenceImages,
    previousPanel,
  });
}

// Helper to safely parse JSON from model responses (handles markdown code fences)
export function parseJsonResponse<T>(text: string): T | null {
  try {
    // Strip markdown code fences if present
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return JSON.parse(clean) as T;
  } catch {
    // Try to find JSON object in text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
