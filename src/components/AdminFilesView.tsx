import React, { useState } from 'react';
import { ArrowLeft, Settings, Users } from 'lucide-react';
import { FileList } from './FileList';
import { UserSelector } from './UserSelector';

interface AdminFilesViewProps {
  selectedUser: string | null;
  onBack: () => void;
  onUserSelect: (userName: string) => void;
}

export const AdminFilesView: React.FC<AdminFilesViewProps> = ({ 
  selectedUser, 
  onBack, 
  onUserSelect 
}) => {
  const [activeTab, setActiveTab] = useState<'common' | 'user'>('common');
  const [fileListKey, setFileListKey] = useState(0);

  const handleUserSelect = (userName: string) => {
    onUserSelect(userName);
    // Refresh the file list when user changes
    setFileListKey(prev => prev + 1);
  };

  const handleTabChange = (tab: 'common' | 'user') => {
    setActiveTab(tab);
    // Refresh the file list when tab changes
    setFileListKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Admin Tools
            </button>
            <div className="h-6 w-px bg-gray-600" />
            <h1 className="text-xl font-semibold">File Management</h1>
          </div>
          
          {/* User Selector */}
          <div className="flex items-center gap-4">
            <UserSelector
              selectedUser={selectedUser}
              onUserSelect={handleUserSelect}
              isAdmin={true}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => handleTabChange('common')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'common'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              Common Assets
            </button>
            <button
              onClick={() => handleTabChange('user')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              My Files
            </button>
          </div>
        </div>

        {/* Files Section */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">
              {activeTab === 'common' ? 'Common Assets' : 'My Files'}
            </h2>
            <p className="text-gray-300 mb-4">
              {activeTab === 'common' 
                ? 'Manage files available to all users. These are shared assets that everyone can access.'
                : 'Manage your personal files. These files are only visible to you.'
              }
            </p>
            
            {activeTab === 'user' && !selectedUser ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-300 mb-2">Select Your Name</h3>
                <p className="text-gray-400">Please select your name from the dropdown above to view your files.</p>
              </div>
            ) : (
              <FileList 
                key={`${activeTab}-${fileListKey}`} 
                onLoadHtmlDraft={() => {}} // Not needed for this view
                selectedUser={activeTab === 'common' ? 'common-assets' : selectedUser || ''}
                isAdmin={true}
                onUserSelect={handleUserSelect}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
