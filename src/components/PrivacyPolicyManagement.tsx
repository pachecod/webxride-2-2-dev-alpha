import React, { useState, useEffect } from 'react';
import { getPrivacyPolicyPage, AboutPage as PrivacyPageType } from '../lib/supabase';
import { Eye, Edit, Loader2 } from 'lucide-react';

interface PrivacyPolicyManagementProps {
  onEdit?: () => void;
}

export const PrivacyPolicyManagement: React.FC<PrivacyPolicyManagementProps> = ({ onEdit }) => {
  const [privacyPage, setPrivacyPage] = useState<PrivacyPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrivacyPage();
  }, []);

  const loadPrivacyPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await getPrivacyPolicyPage();
      setPrivacyPage(page);
    } catch (err) {
      console.error('Error loading privacy policy page:', err);
      setError('Failed to load privacy policy content');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPage = () => {
    window.open('/privacy-policy', '_blank');
  };

  const handleEditPage = () => {
    if (onEdit) {
      onEdit();
    } else {
      window.open('/privacy-policy/edit', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-300">
        <Loader2 className="animate-spin" size={16} />
        <span>Loading privacy policy page...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        {error}
        <button
          onClick={loadPrivacyPage}
          className="ml-2 text-blue-400 hover:text-blue-300 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Privacy Policy Page Management</h3>

      {privacyPage ? (
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">{privacyPage.title}</h4>
            <div className="text-gray-300 text-sm mb-3">
              Last updated: {new Date(privacyPage.updated_at).toLocaleDateString()} at{' '}
              {new Date(privacyPage.updated_at).toLocaleTimeString()}
              {privacyPage.updated_by && ` by ${privacyPage.updated_by}`}
            </div>
            <div
              className="text-gray-300 text-sm line-clamp-3"
              dangerouslySetInnerHTML={{
                __html: privacyPage.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
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
            No privacy policy content found. Create the initial privacy policy page.
          </p>
          <button
            onClick={handleEditPage}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            <Edit size={16} />
            <span>Create Privacy Policy Page</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PrivacyPolicyManagement;

