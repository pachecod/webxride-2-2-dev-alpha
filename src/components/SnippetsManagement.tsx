import React, { useState, useEffect } from 'react';
import { getSnippets, addSnippet, deleteSnippet, Snippet } from '../lib/supabase';
import { Trash2 } from 'lucide-react';

export const SnippetsManagement: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSnippets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSnippets();
      setSnippets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load snippets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnippets();
  }, []);

  const handleAddSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;
    setAdding(true);
    try {
      await addSnippet(title.trim(), code.trim());
      setTitle('');
      setCode('');
      await loadSnippets();
    } catch (err: any) {
      setError(err.message || 'Failed to add snippet');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!window.confirm('Delete this snippet?')) return;
    setDeletingId(id);
    try {
      await deleteSnippet(id);
      await loadSnippets();
    } catch (err: any) {
      setError(err.message || 'Failed to delete snippet');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Snippets Management</h3>
      <form onSubmit={handleAddSnippet} className="mb-6 space-y-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Snippet title"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
          disabled={adding}
        />
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Snippet code"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white font-mono"
          rows={3}
          disabled={adding}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm mt-2 disabled:opacity-50"
          disabled={adding || !title.trim() || !code.trim()}
        >
          {adding ? 'Adding...' : 'Add Snippet'}
        </button>
      </form>
      {loading ? (
        <div className="text-gray-400">Loading snippets...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <ul className="space-y-4">
          {snippets.map(snippet => (
            <li key={snippet.id} className="bg-gray-700 rounded p-3 relative">
              <div className="font-semibold text-white mb-1 flex items-center justify-between">
                <span>{snippet.title}</span>
                <button
                  onClick={() => handleDeleteSnippet(snippet.id)}
                  className="ml-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-all p-1"
                  title="Delete snippet"
                  disabled={deletingId === snippet.id}
                >
                  {deletingId === snippet.id ? (
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
              <pre className="bg-gray-900 rounded p-2 text-xs text-gray-200 overflow-x-auto"><code>{snippet.code}</code></pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 