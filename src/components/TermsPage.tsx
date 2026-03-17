import React, { useState, useEffect, useRef } from 'react';
import { getTermsPage, AboutPage as TermsPageType } from '../lib/supabase';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';

interface TermsPageProps {
  onEdit?: () => void;
  isAdmin?: boolean;
}

export const TermsPageComponent: React.FC<TermsPageProps> = ({ onEdit, isAdmin = false }) => {
  const [termsPage, setTermsPage] = useState<TermsPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(600);

  useEffect(() => {
    loadTermsPage();
  }, []);

  const loadTermsPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await getTermsPage();
      setTermsPage(page);
    } catch (err) {
      console.error('Error loading terms of use page:', err);
      setError('Failed to load terms of use content');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      const body = doc.body;
      const html = doc.documentElement;
      const height = Math.max(
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
        html?.clientHeight || 0,
        html?.scrollHeight || 0,
        html?.offsetHeight || 0
      );
      if (height > 0) {
        setIframeHeight(height + 24);
      }
    } catch (e) {
      console.error('Failed to auto-size terms of use iframe:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading terms of use...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadTermsPage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!termsPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Terms of use content not found</div>
          {isAdmin && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Terms of Use Page
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{termsPage.title}</h1>
          </div>
          {isAdmin && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Edit size={16} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <iframe
            ref={iframeRef}
            srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${termsPage.title}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #ffffff; }
    h1, h2, h3, h4, h5, h6 { color: #111827; }
    p, li { color: #111827; line-height: 1.6; }
    a { color: #2563eb; }
    ${termsPage.css_content || ''}
  </style>
</head>
<body>
  ${termsPage.content}
</body>
</html>`}
            style={{ width: '100%', border: '0', height: `${iframeHeight}px` }}
            onLoad={handleIframeLoad}
            title="Terms of Use"
          />
        </div>

        {/* Footer with last updated info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <p>
            Last updated: {new Date(termsPage.updated_at).toLocaleDateString()} at{' '}
            {new Date(termsPage.updated_at).toLocaleTimeString()}
            {termsPage.updated_by && ` by ${termsPage.updated_by}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPageComponent;

