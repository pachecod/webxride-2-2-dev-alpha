import React, { useState, useEffect } from 'react';
import { getSnippets, addSnippet, deleteSnippet, updateSnippet, Snippet } from '../lib/supabase';
import { Trash2, Edit2, Save, X } from 'lucide-react';

export const SnippetsManagement: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLanguage, setEditLanguage] = useState('javascript');
  const [updating, setUpdating] = useState(false);

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
    if (!title.trim() || !code.trim() || !language.trim()) return;
    setAdding(true);
    try {
      await addSnippet(title.trim(), code.trim(), language);
      setTitle('');
      setCode('');
      setLanguage('javascript');
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

  const handleEditSnippet = (snippet: Snippet) => {
    setEditingId(snippet.id);
    setEditTitle(snippet.title);
    setEditCode(snippet.code);
    setEditLanguage(snippet.language);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditCode('');
    setEditLanguage('javascript');
  };

  const handleUpdateSnippet = async (id: string) => {
    if (!editTitle.trim() || !editCode.trim() || !editLanguage.trim()) return;
    setUpdating(true);
    try {
      await updateSnippet(id, editTitle.trim(), editCode.trim(), editLanguage);
      setEditingId(null);
      setEditTitle('');
      setEditCode('');
      setEditLanguage('javascript');
      await loadSnippets();
    } catch (err: any) {
      setError(err.message || 'Failed to update snippet');
    } finally {
      setUpdating(false);
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
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
          disabled={adding}
        >
          <option value="javascript">JavaScript</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="typescript">TypeScript</option>
          <option value="sql">SQL</option>
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="yaml">YAML</option>
          <option value="markdown">Markdown</option>
          <option value="bash">Bash</option>
          <option value="powershell">PowerShell</option>
          <option value="other">Other</option>
        </select>
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
          disabled={adding || !title.trim() || !code.trim() || !language.trim()}
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
              {editingId === snippet.id ? (
                // Edit form
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold">Edit Snippet</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateSnippet(snippet.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                        disabled={updating || !editTitle.trim() || !editCode.trim() || !editLanguage.trim()}
                        title="Save changes"
                      >
                        {updating ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                        disabled={updating}
                        title="Cancel editing"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Snippet title"
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                    disabled={updating}
                  />
                  <select
                    value={editLanguage}
                    onChange={e => setEditLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                    disabled={updating}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="typescript">TypeScript</option>
                    <option value="sql">SQL</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="yaml">YAML</option>
                    <option value="markdown">Markdown</option>
                    <option value="bash">Bash</option>
                    <option value="powershell">PowerShell</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    value={editCode}
                    onChange={e => setEditCode(e.target.value)}
                    placeholder="Snippet code"
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-white font-mono"
                    rows={4}
                    disabled={updating}
                  />
                </div>
              ) : (
                // Display view
                <>
                  <div className="font-semibold text-white mb-1 flex items-center justify-between">
                    <div>
                      <span>{snippet.title}</span>
                      <span className="ml-2 px-2 py-1 bg-blue-600 text-xs rounded text-blue-100">
                        {snippet.language}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditSnippet(snippet)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-all p-1"
                        title="Edit snippet"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSnippet(snippet.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-all p-1"
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
                  </div>
                  <pre className="bg-gray-900 rounded p-2 text-xs text-gray-200 overflow-x-auto"><code>{snippet.code}</code></pre>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 