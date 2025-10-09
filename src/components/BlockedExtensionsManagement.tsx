import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { loadBlockedExtensions, saveBlockedExtensions } from '../lib/supabase';

export const BlockedExtensionsManagement: React.FC = () => {
  const [blockedExtensions, setBlockedExtensions] = useState<string[]>([]);
  const [newExtension, setNewExtension] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = async () => {
    setLoading(true);
    try {
      const extensions = await loadBlockedExtensions();
      setBlockedExtensions(extensions);
    } catch (error) {
      console.error('Error loading blocked extensions:', error);
      setMessage({ type: 'error', text: 'Failed to load blocked extensions' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtension = () => {
    const ext = newExtension.trim().toLowerCase().replace(/^\./, ''); // Remove leading dot
    
    if (!ext) {
      setMessage({ type: 'error', text: 'Please enter a file extension' });
      return;
    }
    
    if (blockedExtensions.includes(ext)) {
      setMessage({ type: 'error', text: `Extension "${ext}" is already blocked` });
      return;
    }
    
    setBlockedExtensions([...blockedExtensions, ext]);
    setNewExtension('');
    setMessage(null);
  };

  const handleRemoveExtension = (ext: string) => {
    setBlockedExtensions(blockedExtensions.filter(e => e !== ext));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const result = await saveBlockedExtensions(blockedExtensions);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Blocked extensions saved successfully!' });
      } else {
        const errorMsg = result.error?.message || 'Unknown error';
        console.error('Save error:', result.error);
        setMessage({ type: 'error', text: `Failed to save: ${errorMsg}` });
      }
    } catch (error) {
      console.error('Error saving blocked extensions:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `Failed to save: ${errorMsg}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Blocked File Extensions</h2>
        <p className="text-gray-400 mb-6">
          Manage file extensions that users are not allowed to upload. These files will be rejected with a helpful error message.
        </p>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="mb-2">
              When a user tries to upload a blocked file type, they will see a message explaining that the file type is not supported, 
              along with information about converting files (especially HEIC to JPG for iOS users).
            </p>
            <p className="font-semibold">
              Default blocked extensions: .exe, .bat, .sh, .cmd, .com, .heic, .heif (security and compatibility)
            </p>
          </div>
        </div>

        {/* Add New Extension */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Add Blocked Extension</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newExtension}
              onChange={(e) => setNewExtension(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddExtension()}
              placeholder="Enter extension (e.g., heic or .heic)"
              className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded"
            />
            <button
              onClick={handleAddExtension}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Blocked Extensions List */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Currently Blocked Extensions ({blockedExtensions.length})
          </h3>
          
          {blockedExtensions.length === 0 ? (
            <p className="text-gray-400 text-sm">No blocked extensions. All file types are currently allowed.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {blockedExtensions.sort().map((ext) => (
                <div
                  key={ext}
                  className="flex items-center justify-between bg-gray-700 rounded px-3 py-2 group"
                >
                  <span className="text-sm font-mono">.{ext}</span>
                  <button
                    onClick={() => handleRemoveExtension(ext)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                    title={`Remove .${ext}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              message.type === 'success'
                ? 'bg-green-900/20 border border-green-700 text-green-200'
                : 'bg-red-900/20 border border-red-700 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

