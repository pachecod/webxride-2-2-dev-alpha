import React, { useEffect, useState } from 'react';
import { getSnippets, Snippet } from '../lib/supabase';
import { Copy, X, ArrowDownToLine } from 'lucide-react';

interface SnippetsModalProps {
  open: boolean;
  onClose: () => void;
  onInsert?: (code: string) => void;
}

export const SnippetsModal: React.FC<SnippetsModalProps> = ({ open, onClose, onInsert }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getSnippets()
        .then(data => setSnippets(data))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const handleInsert = (code: string, id: string) => {
    if (onInsert) {
      onInsert(code);
      setInsertedId(id);
      setTimeout(() => setInsertedId(null), 1200);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-[80vw] h-[80vh] max-w-5xl max-h-[90vh] relative flex flex-col">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>
        <h2 className="text-xl font-bold mb-4">Code Snippets</h2>
        {onInsert && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded text-sm text-blue-200">
            <strong>💡 Tip:</strong> Insert adds code to where your cursor was. Make sure your cursor is in the right spot! Otherwise, click Copy Code and close this window. Then, situate your cursor where you want the code and then paste.
          </div>
        )}
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : snippets.length === 0 ? (
          <div className="text-gray-400">No snippets available.</div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snippets.map(snippet => (
                <div key={snippet.id} className="bg-gray-800 rounded p-3 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-200">{snippet.title}</span>
                    <div className="flex items-center gap-1">
                      <button
                        className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 flex items-center"
                        onClick={() => handleCopy(snippet.code, snippet.id)}
                      >
                        <Copy size={16} className="mr-1" />
                        {copiedId === snippet.id ? 'Copied!' : 'Copy'}
                      </button>
                      {onInsert && (
                        <button
                          className="px-2 py-1 text-xs bg-blue-700 rounded hover:bg-blue-600 flex items-center"
                          onClick={() => handleInsert(snippet.code, snippet.id)}
                          title="Insert at cursor position"
                        >
                          <ArrowDownToLine size={16} className="mr-1" />
                          {insertedId === snippet.id ? 'Inserted!' : 'Insert'}
                        </button>
                      )}
                    </div>
                  </div>
                  <pre className="bg-gray-900 rounded p-2 text-xs text-gray-100 overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {snippet.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 