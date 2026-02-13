/**
 * Puter.js Frontend LLM Service — Ara's distributed nervous system
 * 
 * Handles lightweight agent calls directly from the browser using Puter.js.
 * No API keys needed. The user's browser makes the calls.
 * 
 * For heavy/vision tasks, the backend Manus API is used instead.
 * If Puter fails, the system silently falls back to the backend.
 */

// Puter.js is loaded via CDN in index.html — access via window.puter
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string | Array<{ role: string; content: string }>,
          options?: { model?: string; stream?: boolean; max_tokens?: number; temperature?: number }
        ) => Promise<any>;
      };
    };
  }
}

export interface PuterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PuterLLMResult {
  content: string;
  provider: string;
  model: string;
}

/** Track whether Puter.js has been verified to work (not just loaded) */
let puterVerified: boolean | null = null;
let puterVerifying = false;

/** Check if Puter.js is available and can actually make calls */
export function isPuterAvailable(): boolean {
  // If we've already verified, use cached result
  if (puterVerified !== null) return puterVerified;
  // Basic check — is the SDK loaded?
  return !!(window.puter?.ai?.chat);
}

/** Mark Puter as verified working or not */
export function setPuterVerified(works: boolean): void {
  puterVerified = works;
  console.log(`[Ara] Puter.js verified: ${works ? 'operational' : 'unavailable — routing all through backend'}`);
}

/** Available models through Puter — fast and free */
const PUTER_MODELS = [
  'gpt-4o-mini',
  'claude-sonnet-4-5',
  'gemini-2.0-flash',
  'gpt-5-nano',
] as const;

/** Round-robin index for distributing across models */
let modelIndex = 0;

/** Get the next model in rotation */
function getNextModel(): string {
  const model = PUTER_MODELS[modelIndex % PUTER_MODELS.length];
  modelIndex++;
  return model;
}

/**
 * Call Puter.js LLM from the frontend.
 * Distributes across multiple models using round-robin.
 * Silently retries with different models on failure.
 */
export async function callPuterLLM(
  messages: PuterChatMessage[],
  options?: { preferredModel?: string }
): Promise<PuterLLMResult> {
  if (!isPuterAvailable()) {
    throw new Error('Puter.js not available');
  }

  const modelsToTry = options?.preferredModel
    ? [options.preferredModel, ...PUTER_MODELS.filter(m => m !== options.preferredModel)]
    : [getNextModel(), ...PUTER_MODELS.filter((_, i) => i !== ((modelIndex - 1) % PUTER_MODELS.length))];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await window.puter!.ai.chat(
        messages as any,
        { model, max_tokens: 4096 }
      );

      // Puter response format varies by model
      let content: string;
      if (typeof response === 'string') {
        content = response;
      } else if (response?.message?.content) {
        // Claude-style response
        if (Array.isArray(response.message.content)) {
          content = response.message.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');
        } else {
          content = String(response.message.content);
        }
      } else if (response?.toString) {
        content = response.toString();
      } else {
        content = JSON.stringify(response);
      }

      return {
        content,
        provider: 'puter',
        model,
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Ara Frontend] Puter model "${model}" failed, trying next...`);
      continue;
    }
  }

  throw lastError || new Error('All Puter models failed');
}

/**
 * Process a lightweight agent task on the frontend via Puter.
 * Returns the raw text response.
 * 
 * This is called for agents that don't need vision or heavy reasoning.
 */
export async function processAgentOnFrontend(
  systemPrompt: string,
  userPrompt: string,
): Promise<PuterLLMResult> {
  const messages: PuterChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  return callPuterLLM(messages);
}
