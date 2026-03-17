import React, { useState, useEffect } from 'react';
import {
  getPrivacyPolicyPage,
  updatePrivacyPolicyPage,
  AboutPage as PrivacyPageType,
} from '../lib/supabase';
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Code, Palette } from 'lucide-react';
import Editor from './Editor';
import { FileType } from '../types';

interface PrivacyPolicyEditorProps {
  onBack: () => void;
  onSave?: () => void;
  currentUser: string;
}

type TabType = 'html' | 'css';

export const PrivacyPolicyEditor: React.FC<PrivacyPolicyEditorProps> = ({
  onBack,
  onSave,
  currentUser,
}) => {
  const [privacyPage, setPrivacyPage] = useState<PrivacyPageType | null>(null);
  const [title, setTitle] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('html');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadPrivacyPage();
  }, []);

  const loadPrivacyPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await getPrivacyPolicyPage();
      setPrivacyPage(page);

      if (page) {
        setTitle(page.title);
        setHtmlContent(page.content);
        setCssContent(page.css_content || '');
      } else {
        setTitle('Privacy Policy');
        setHtmlContent(`<h1>Privacy Policy</h1>
<p>This Privacy Policy explains how WebXRide collects, uses, and protects information.</p>`);
        setCssContent(`body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #111827;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #111827;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 10px;
  margin-bottom: 30px;
}

h2 {
  color: #111827;
  margin-top: 32px;
  margin-bottom: 16px;
}

p, li {
  margin-bottom: 12px;
}`);
      }
    } catch (err) {
      console.error('Error loading privacy policy page:', err);
      setError('Failed to load privacy policy content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !htmlContent.trim()) {
      setError('Title and HTML content are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const result = await updatePrivacyPolicyPage(
        title.trim(),
        htmlContent.trim(),
        cssContent.trim(),
        currentUser
      );
      console.log('Saved privacy policy page:', result);

      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving privacy policy page:', err);
      setError(
        `Failed to save privacy policy page: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  const getPreviewContent = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Privacy Policy</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text.white rounded transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Page Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Enter page title..."
              />
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('html')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'html'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code size={16} />
                <span>HTML</span>
              </button>
              <button
                onClick={() => setActiveTab('css')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'css'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Palette size={16} />
                <span>CSS</span>
              </button>
            </div>

            {/* Editors */}
            {activeTab === 'html' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content
                </label>
                <Editor
                  value={htmlContent}
                  language={FileType.HTML}
                  fileName="privacy.html"
                  onChange={setHtmlContent}
                  rideyEnabled={false}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font.medium text-gray-700 mb-2">
                  Custom CSS
                </label>
                <Editor
                  value={cssContent}
                  language={FileType.CSS}
                  fileName="privacy.css"
                  onChange={setCssContent}
                  rideyEnabled={false}
                />
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
              <span className="text-xs text-gray-500">
                This is how your Privacy Policy page will appear.
              </span>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[300px]">
              {showPreview ? (
                <iframe
                  srcDoc={getPreviewContent()}
                  title="Privacy Policy Preview"
                  className="w-full h-[420px] border-0"
                />
              ) : (
                <div className="flex items-center justify-center h-[420px] text-gray-400 text-sm">
                  Click &quot;Show Preview&quot; to see a live preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyEditor;

