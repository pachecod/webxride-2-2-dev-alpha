import { analyzeCodeWithAI, createFallbackResponse } from '../lib/openai';

// This is a simple API handler that can be used with Vite's proxy or a backend
export async function handleAIAssistantRequest(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { code, language, fileName, prompt, context } = body;

    if (!code || !prompt) {
      return new Response(JSON.stringify({ error: 'Code and prompt are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try to get AI response
    try {
      const response = await analyzeCodeWithAI({
        code,
        language,
        fileName,
        prompt,
        context
      });

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (aiError) {
      console.warn('AI service unavailable, using fallback:', aiError);
      
      // Use fallback response
      const fallbackResponse = createFallbackResponse(prompt, code, language);
      
      return new Response(JSON.stringify(fallbackResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('AI Assistant API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// For direct usage in the component (when API route is not available)
export async function callAIAssistantDirect(request: {
  code: string;
  language: string;
  fileName?: string;
  prompt: string;
  context: string;
  temperature?: number;
}) {
  // Don't swallow errors here; let the UI show the exact cause
  return analyzeCodeWithAI(request);
}
