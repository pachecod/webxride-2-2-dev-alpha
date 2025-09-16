import React, { useState, useEffect } from 'react';
import { getAboutPage, AboutPage } from '../lib/supabase';
import { ExternalLink, Edit, Eye, Loader2 } from 'lucide-react';

interface AboutPageManagementProps {
  onEdit?: () => void;
}

export const AboutPageManagement: React.FC<AboutPageManagementProps> = ({ onEdit }) => {
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

  const handleViewPage = () => {
    window.open('/about', '_blank');
  };

  const handleEditPage = () => {
    if (onEdit) {
      onEdit();
    } else {
      window.open('/about/edit', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-300">
        <Loader2 className="animate-spin" size={16} />
        <span>Loading about page...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        {error}
        <button
          onClick={loadAboutPage}
          className="ml-2 text-blue-400 hover:text-blue-300 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">About Page Management</h3>
      
      {aboutPage ? (
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">{aboutPage.title}</h4>
            <div className="text-gray-300 text-sm mb-3">
              Last updated: {new Date(aboutPage.updated_at).toLocaleDateString()} at{' '}
              {new Date(aboutPage.updated_at).toLocaleTimeString()}
              {aboutPage.updated_by && ` by ${aboutPage.updated_by}`}
            </div>
            <div 
              className="text-gray-300 text-sm line-clamp-3"
              dangerouslySetInnerHTML={{ 
                __html: aboutPage.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...' 
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
            No about page content found. Create the initial about page content.
          </p>
          <button
            onClick={handleEditPage}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            <Edit size={16} />
            <span>Create About Page</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AboutPageManagement; 