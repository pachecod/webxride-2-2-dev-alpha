import React, { useState, useEffect } from 'react';
import { getAboutPage, updateAboutPage, AboutPage } from '../lib/supabase';
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Code, Palette } from 'lucide-react';
import Editor from './Editor';
import { FileType } from '../types';

interface AboutPageEditorProps {
  onBack: () => void;
  onSave?: () => void;
  currentUser: string;
}

type TabType = 'html' | 'css';

export const AboutPageEditor: React.FC<AboutPageEditorProps> = ({ 
  onBack, 
  onSave, 
  currentUser 
}) => {
  const [aboutPage, setAboutPage] = useState<AboutPage | null>(null);
  const [title, setTitle] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('html');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadAboutPage();
  }, []);

  const loadAboutPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await getAboutPage();
      setAboutPage(page);
      
      if (page) {
        setTitle(page.title);
        setHtmlContent(page.content);
        setCssContent(page.css_content || '');
      } else {
        // Set default values if no page exists
        setTitle('About WebxRide');
        setHtmlContent(`<h1>Welcome to WebxRide</h1>
<p>WebxRide is an innovative web development platform designed for educational environments.</p>

<h2>Features</h2>
<ul>
  <li><strong>Multi-User Support:</strong> Each student can have their own workspace</li>
  <li><strong>Template Library:</strong> Pre-built templates for quick project starts</li>
  <li><strong>Real-time Preview:</strong> See your changes instantly as you code</li>
  <li><strong>3D Web Support:</strong> Create immersive VR/AR experiences</li>
</ul>

<h2>Getting Started</h2>
<p>To begin using WebxRide:</p>
<ol>
  <li>Select your username from the dropdown in the top right</li>
  <li>Click the "Templates and Files" slider on the left</li>
  <li>Choose a template to start with</li>
  <li>Edit your files using the built-in editor</li>
  <li>Preview your work in real-time</li>
  <li>Save your progress when ready</li>
</ol>`);
        setCssContent(`body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2563eb;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 10px;
  margin-bottom: 30px;
}

h2 {
  color: #374151;
  margin-top: 40px;
  margin-bottom: 20px;
}

p {
  margin-bottom: 20px;
  text-align: justify;
}

ul, ol {
  background: #f8fafc;
  padding: 20px 30px;
  border-radius: 8px;
  border-left: 4px solid #2563eb;
  margin: 20px 0;
}

li {
  margin-bottom: 10px;
}

strong {
  color: #059669;
  font-weight: 600;
}`);
      }
    } catch (err) {
      console.error('Error loading about page:', err);
      setError('Failed to load about page content');
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
      
      console.log('Saving about page with:', {
        title: title.trim(),
        htmlContent: htmlContent.trim(),
        cssContent: cssContent.trim(),
        currentUser
      });
      
      const result = await updateAboutPage(title.trim(), htmlContent.trim(), cssContent.trim(), currentUser);
      console.log('Save result:', result);
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving about page:', err);
      setError(`Failed to save about page: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            <h1 className="text-2xl font-bold text-gray-900">Edit About Page</h1>
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
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
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

            {/* Tab Content */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              {activeTab === 'html' && (
                <Editor
                  value={htmlContent}
                  language={FileType.HTML}
                  fileName="about.html"
                  onChange={setHtmlContent}
                />
              )}
              {activeTab === 'css' && (
                <Editor
                  value={cssContent}
                  language={FileType.CSS}
                  fileName="about.css"
                  onChange={setCssContent}
                />
              )}
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <iframe
                    srcDoc={getPreviewContent()}
                    className="w-full h-96 border-0"
                    title="About Page Preview"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPageEditor; 