import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, Code, Lightbulb, Bug, Zap } from 'lucide-react';
import { FileType } from '../types';
import { callAIAssistantDirect } from '../api/ai-assistant';
import WebXRideAIAssistant from './WebXRideAIAssistant';

interface AIAssistantProps {
  open: boolean;
  onClose: () => void;
  code: string;
  language: FileType;
  fileName?: string;
  onApplySuggestion?: (suggestion: string) => void;
}

interface AIResponse {
  suggestion: string;
  explanation: string;
  confidence: number;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  open,
  onClose,
  code,
  language,
  fileName,
  onApplySuggestion
}) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [previewMode, setPreviewMode] = useState(false);
  const [modifiedCode, setModifiedCode] = useState('');

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

  const quickPrompts = [
    {
      icon: <Bug className="w-4 h-4 text-gray-700" />,
      text: "Find bugs",
      prompt: "Please review this code and identify bugs, errors, or potential issues. Provide fixes and explanations."
    },
    {
      icon: <Zap className="w-4 h-4 text-gray-700" />,
      text: "Optimize",
      prompt: "Please analyze this code for performance improvements and optimization opportunities. Suggest specific, safe changes."
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-gray-700" />,
      text: "Add features",
      prompt: "Suggest how to add useful features or functionality to this code. Provide complete, working examples." 
    },
    {
      icon: <Code className="w-4 h-4 text-gray-700" />,
      text: "Improve quality",
      prompt: "Suggest improvements for readability, maintainability, and best practices."
    }
  ];

  const handleSubmit = async (customPrompt?: string) => {
    const prompt = customPrompt || query;
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await callAIAssistantDirect({
        code,
        language: language.toLowerCase(),
        fileName,
        prompt,
        context: 'WebXR development with A-Frame, Three.js, and modern web technologies',
        temperature
      });
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
      console.error('AI Assistant error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string, intention?: 'fix' | 'optimize' | 'brainstorm' | 'explain') => {
    if (intention) {
      setIntention(intention);
    }
    setQuery(prompt);
    handleSubmit(prompt);
  };

  const handlePreviewChanges = () => {
    if (response) {
      setModifiedCode(response.suggestion);
      setPreviewMode(true);
    }
  };

  const handleApplySuggestion = () => {
    if (modifiedCode && onApplySuggestion) {
      onApplySuggestion(modifiedCode);
      setResponse(null);
      setQuery('');
      setPreviewMode(false);
      setModifiedCode('');
      onClose();
    }
  };

  const handleCancelPreview = () => {
    setPreviewMode(false);
    setModifiedCode('');
  };

  // Simple line-based diff (LCS) to highlight additions/deletions in one view
  type DiffPart = { type: 'equal' | 'add' | 'del'; text: string };
  const computeLineDiff = (a: string, b: string): DiffPart[] => {
    const aLines = a.split('\n');
    const bLines = b.split('\n');

    const n = aLines.length;
    const m = bLines.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        if (aLines[i] === bLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1; else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const parts: DiffPart[] = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (aLines[i] === bLines[j]) {
        parts.push({ type: 'equal', text: aLines[i] });
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        parts.push({ type: 'del', text: aLines[i] });
        i++;
      } else {
        parts.push({ type: 'add', text: bLines[j] });
        j++;
      }
    }
    while (i < n) { parts.push({ type: 'del', text: aLines[i++] }); }
    while (j < m) { parts.push({ type: 'add', text: bLines[j++] }); }
    return parts;
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <WebXRideAIAssistant 
              isThinking={loading}
              isHappy={!!response && !error}
              isConfused={!!error}
              size={40}
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Ridey · WebXRide AI Assistant</h2>
              <span className="text-sm text-gray-500">
                {language} {fileName && `• ${fileName}`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
            title="Close AI Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temperature Control */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Temperature</h3>
            <div className="text-xs text-gray-600 tabular-nums">{temperature.toFixed(2)}</div>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full mt-2"
          />
          <p className="text-xs text-gray-500 mt-2">
            Lower temperature makes Ridey more precise and deterministic. Higher temperature makes Ridey more creative and exploratory.
          </p>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Code Preview */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Current Code</h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {code}
              </pre>
            </div>
          </div>

          {/* Right Panel - AI Interaction */}
          <div className="w-1/2 flex flex-col">

            {/* Query Input */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col space-y-2">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask AI to help with your code..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none"
                  rows={3}
                  style={{ minHeight: '80px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  disabled={loading}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSubmit()}
                    disabled={loading || !query.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Ask</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Response Area */}
            <div className="flex-1 overflow-auto p-4">
              {loading && (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <WebXRideAIAssistant 
                      isThinking={true}
                      size={60}
                      className="mx-auto mb-3"
                    />
                    <p className="text-sm text-gray-600">Working under the hood...</p>
                    <p className="text-xs text-gray-400 mt-1">This might take a moment</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                  <div className="mt-2 text-xs text-red-600">
                    <p>Common solutions:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Check if your OpenAI API key is set correctly</li>
                      <li>Verify you have internet connection</li>
                      <li>Check browser console for more details</li>
                    </ul>
                  </div>
                </div>
              )}

              {response && !previewMode && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Explanation</h4>
                    <p className="text-sm text-gray-700">{response.explanation}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Confidence: {Math.round(response.confidence * 100)}%
                    </div>
                    <button
                      onClick={handlePreviewChanges}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2"
                    >
                      <Code className="w-4 h-4" />
                      <span>Preview Changes</span>
                    </button>
                  </div>
                </div>
              )}

              {previewMode && (
                // Overlay modal inside the assistant (80% of width/height)
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) handleCancelPreview();
                  }}
                >
                  <div className="bg-white w-[80%] h-[80%] rounded-lg shadow-xl border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-800">Preview Changes</h4>
                      <div className="text-xs text-gray-600">
                        <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-900">Red = removed</span>
                        <span className="inline-block ml-2 px-2 py-0.5 rounded bg-green-100 text-green-900">Green = added</span>
                      </div>
                      <button onClick={handleCancelPreview} className="p-2 hover:bg-gray-100 rounded text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 p-0 bg-white overflow-hidden">
                      <div className="grid grid-cols-2 h-full">
                        {/* Left: Code diff */}
                        <div className="overflow-auto p-4 bg-gray-50 border-r border-gray-200">
                          <pre className="text-xs whitespace-pre font-mono leading-5">
                            {computeLineDiff(code, modifiedCode).map((part, idx) => (
                              <div key={idx}
                                className={
                                  part.type === 'add' ? 'bg-green-100 text-green-900' :
                                  part.type === 'del' ? 'bg-red-100 text-red-900 line-through' : 'text-gray-800'
                                }
                              >
                                {part.text}
                              </div>
                            ))}
                          </pre>
                        </div>
                        {/* Right: Visual preview (HTML only) */}
                        <div className="overflow-hidden bg-white">
                          {language === 'html' ? (
                            <iframe
                              title="Ridey Preview"
                              className="w-full h-full"
                              sandbox="allow-scripts allow-same-origin"
                              srcDoc={modifiedCode}
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-sm text-gray-500">
                              Visual preview is available for HTML files only.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-white">
                      <button
                        onClick={handleCancelPreview}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApplySuggestion}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Apply Changes</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !error && !response && (
                <div className="text-center text-gray-500 mt-8">
                  <WebXRideAIAssistant 
                    isHappy={true}
                    size={80}
                    className="mx-auto mb-4"
                  />
                  <p className="text-sm font-medium text-gray-700 mb-2">Hi! I'm Ridey, your WebXRide AI Assistant</p>
                  <p className="text-sm text-gray-500 mb-1">I can help you with:</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Fixing bugs and errors in your code</li>
                    <li>• Optimizing performance for WebXR</li>
                    <li>• Adding new features and functionality</li>
                    <li>• Improving code quality and best practices</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-3">
                    Try one of the quick actions above or type your own question!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
