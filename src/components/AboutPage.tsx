import React, { useState, useEffect } from 'react';
import { getAboutPage, AboutPage } from '../lib/supabase';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';

interface AboutPageProps {
  onEdit?: () => void;
  isAdmin?: boolean;
}

export const AboutPageComponent: React.FC<AboutPageProps> = ({ onEdit, isAdmin = false }) => {
  const [aboutPage, setAboutPage] = useState<AboutPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAboutPage();
  }, []);

  const loadAboutPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await getAboutPage();
      setAboutPage(page);
    } catch (err) {
      console.error('Error loading about page:', err);
      setError('Failed to load about page content');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading about page...</span>
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
            onClick={loadAboutPage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!aboutPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">About page content not found</div>
          {isAdmin && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create About Page
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
            <h1 className="text-2xl font-bold text-gray-900">{aboutPage.title}</h1>
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
            srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${aboutPage.title}</title>
  <style>
    ${aboutPage.css_content || ''}
  </style>
</head>
<body>
  ${aboutPage.content}
</body>
</html>`}
            className="w-full min-h-96 border-0"
            title="About Page"
          />
        </div>
        
        {/* Footer with last updated info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <p>
            Last updated: {new Date(aboutPage.updated_at).toLocaleDateString()} at{' '}
            {new Date(aboutPage.updated_at).toLocaleTimeString()}
            {aboutPage.updated_by && ` by ${aboutPage.updated_by}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPageComponent; 