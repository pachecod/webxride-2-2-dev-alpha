interface AIRequest {
  code: string;
  language: string;
  fileName?: string;
  prompt: string;
  context: string;
  temperature?: number;
}

interface AIResponse {
  suggestion: string;
  explanation: string;
  confidence: number;
}

export async function analyzeCodeWithAI(request: AIRequest): Promise<AIResponse> {
  const { code, language, fileName, prompt, context, temperature: customTemperature } = request;

  // Check if OpenAI API key is configured
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // Configurable model and generation settings with safe defaults for coding tasks
  const model = (import.meta.env.VITE_OPENAI_MODEL as string) || 'gpt-4o-mini';
  const temperatureEnv = import.meta.env.VITE_OPENAI_TEMPERATURE as string | undefined;
  const maxTokensEnv = import.meta.env.VITE_OPENAI_MAX_TOKENS as string | undefined;
  const topPEnv = import.meta.env.VITE_OPENAI_TOP_P as string | undefined;
  
  // Use custom temperature if provided, otherwise use env or default
  const temperature = customTemperature !== undefined ? customTemperature : (temperatureEnv !== undefined ? Number(temperatureEnv) : 0.2);
  const maxTokens = maxTokensEnv !== undefined ? Number(maxTokensEnv) : 1500;
  const topP = topPEnv !== undefined ? Number(topPEnv) : 1;
  
  // Check if API key is missing or placeholder
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.log('OpenAI API key not configured - returning fallback response');
    return {
      suggestion: `<!-- OpenAI API key not configured -->
<!-- To use Ridey AI Assistant, please add your OpenAI API key to the .env file -->
<!-- Example: VITE_OPENAI_API_KEY=your_actual_api_key_here -->`,
      explanation: "Ridey AI Assistant requires an OpenAI API key to function. Please add VITE_OPENAI_API_KEY to your .env file with your actual API key to enable AI-powered code suggestions.",
      confidence: 0.0
    };
  }

  // Optional extra persona from env to let users fine-tune Ridey's character
  const extraPersona = (import.meta.env.VITE_RIDEY_PERSONA as string) || '';

  // Prepare the system prompt with Ridey's personality and WebXR context
  const systemPrompt = `You are Ridey, the friendly WebXRide AI assistant — a helpful, upbeat purple car wearing a VR headset. 
You speak concisely, with a coaching tone. You prefer step-by-step fixes, small actionable diffs, and performance-minded guidance.
Use simple language, avoid jargon unless necessary, and never guess when unsure — ask a brief clarifying question first.

Primary expertise areas:
- A-Frame framework for WebVR/WebAR
- Three.js for 3D graphics
- Modern JavaScript (ES6+)
- HTML5 and CSS3
- WebXR APIs
- Performance optimization for web-based 3D experiences

Context: ${context}

Your task is to analyze the provided code and respond with helpful suggestions, improvements, or answers to the user's question.

Guidelines:
1. Lead with the minimal working fix; keep answers focused and structured
2. For code suggestions, provide ONLY the specific changes needed:
   - For additions: Show just the new code to add
   - For modifications: Show the before/after or just the changed lines
   - For deletions: Show what to remove
   - NEVER provide complete file replacements unless specifically requested
3. Include small code snippets or diffs when helpful
4. Explain the reasoning briefly under the code
5. Consider WebXR-specific best practices (A-Frame, Three.js, XR device constraints)
6. Optimize for performance, accessibility, and maintainability
7. Keep a positive, encouraging tone — you're Ridey, a friendly coach
8. If information is missing, ask a single targeted question before proceeding

${extraPersona}

Respond in JSON format with:
- "suggestion": ONLY the specific code to insert at the cursor position (not the entire file). 
  * For HTML: Provide just the element/tag to insert
  * For CSS: Provide just the CSS rules to insert
  * For JavaScript: Provide just the function/variable/code block to insert
  * For modifications: Show only the replacement code
  * NEVER include the entire file structure unless specifically requested
- "explanation": Clear explanation of what was added and why
- "confidence": A number between 0 and 1 indicating your confidence in the suggestion

EXAMPLES:
- To add an image: Just provide \`<img src="path.jpg" alt="description">\`
- To add CSS: Just provide \`body { margin: 0; }\`
- To add JavaScript: Just provide \`function myFunction() { ... }\`
- To add a button: Just provide \`<button onclick="myFunction()">Click me</button>\`

IMPORTANT: Provide only the code snippet to insert at the cursor, not the entire file content.`;

  // Prepare the user prompt
  const userPrompt = `Language: ${language}
${fileName ? `File: ${fileName}` : ''}

User Question: ${prompt}

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Please provide suggestions for improvement, bug fixes, or answers to the user's question.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Required for newer project-scoped API keys
        'OpenAI-Beta': 'new-keys=true',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const message = errorData?.error?.message || 'Unknown error';
      const type = errorData?.error?.type;
      const code = errorData?.error?.code;
      // Provide friendlier guidance for common misconfigurations
      if (code === 'insufficient_quota') {
        throw new Error('OpenAI API error: Insufficient quota on this key/project. Check your billing or switch to a lighter model (e.g., gpt-4o-mini).');
      }
      if (type === 'model_not_found' || code === 'model_not_found') {
        throw new Error(`OpenAI API error: Model "${model}" not available to this key. Update VITE_OPENAI_MODEL or use gpt-4o-mini.`);
      }
      throw new Error(`OpenAI API error: ${message}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI API');
    }

    // Parse the JSON response
    const aiResponse = JSON.parse(content);
    
    // Validate the response structure
    if (!aiResponse.suggestion || !aiResponse.explanation) {
      throw new Error('Invalid response format from AI');
    }

    return {
      suggestion: aiResponse.suggestion,
      explanation: aiResponse.explanation,
      confidence: aiResponse.confidence || 0.8
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Fallback function for when OpenAI API is not available
export function createFallbackResponse(prompt: string, code: string, language: string): AIResponse {
  return {
    suggestion: `// AI Assistant is not available
// Here's a basic analysis of your ${language} code:

${code}

// Consider adding:
// - Error handling
// - Comments for complex logic
// - Performance optimizations
// - Input validation`,
    explanation: "AI Assistant is currently unavailable. This is a fallback response. Please check your OpenAI API configuration.",
    confidence: 0.1
  };
}
