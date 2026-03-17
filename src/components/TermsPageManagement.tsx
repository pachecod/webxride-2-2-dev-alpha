import React, { useState, useEffect } from 'react';
import { getTermsPage, AboutPage as TermsPageType } from '../lib/supabase';
import { Eye, Edit, Loader2 } from 'lucide-react';

interface TermsPageManagementProps {
  onEdit?: () => void;
}

export const TermsPageManagement: React.FC<TermsPageManagementProps> = ({ onEdit }) => {
  const [termsPage, setTermsPage] = useState<TermsPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleViewPage = () => {
    window.open('/terms', '_blank');
  };

  const handleEditPage = () => {
    if (onEdit) {
      onEdit();
    } else {
      window.open('/terms/edit', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-300">
        <Loader2 className="animate-spin" size={16} />
        <span>Loading terms of use page...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        {error}
        <button
          onClick={loadTermsPage}
          className="ml-2 text-blue-400 hover:text-blue-300 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Terms of Use Page Management</h3>

      {termsPage ? (
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">{termsPage.title}</h4>
            <div className="text-gray-300 text-sm mb-3">
              Last updated: {new Date(termsPage.updated_at).toLocaleDateString()} at{' '}
              {new Date(termsPage.updated_at).toLocaleTimeString()}
              {termsPage.updated_by && ` by ${termsPage.updated_by}`}
            </div>
            <div
              className="text-gray-300 text-sm line-clamp-3"
              dangerouslySetInnerHTML={{
                __html: termsPage.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleViewPage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            >
              <Eye size={16} />
              <span>View Page</span>
            </button>
            <button
              onClick={handleEditPage}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            >
              <Edit size={16} />
              <span>Edit Page</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            No terms of use content found. Create the initial terms of use page.
          </p>
          <button
            onClick={handleEditPage}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            <Edit size={16} />
            <span>Create Terms of Use Page</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TermsPageManagement;

