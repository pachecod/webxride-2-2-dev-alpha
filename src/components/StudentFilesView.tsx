import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { FileList } from './FileList';
import { UserSelector } from './UserSelector';

interface StudentFilesViewProps {
  selectedUser: string | null;
  onBack: () => void;
  onUserSelect: (userName: string) => void;
}

export const StudentFilesView: React.FC<StudentFilesViewProps> = ({ 
  selectedUser, 
  onBack, 
  onUserSelect 
}) => {
  const [fileListKey, setFileListKey] = useState(0);

  const handleUserSelect = (userName: string) => {
    onUserSelect(userName);
    // Refresh the file list when user changes
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
              Back to Editor
            </button>
            <div className="h-6 w-px bg-gray-600" />
            <h1 className="text-xl font-semibold">My Files</h1>
          </div>
          
          {/* User Selector */}
          <div className="flex items-center gap-4">
            <UserSelector
              selectedUser={selectedUser}
              onUserSelect={handleUserSelect}
              isAdmin={false}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {!selectedUser ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-300 mb-2">Select Your Name</h3>
            <p className="text-gray-400">Please select your name from the dropdown above to view your files.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Uploaded Files</h2>
              <p className="text-gray-300 mb-4">
                Manage your uploaded files. You can upload images, audio files, 3D models, and other assets for your projects.
              </p>
              <FileList 
                key={fileListKey} 
                onLoadHtmlDraft={() => {}} // Not needed for this view
                selectedUser={selectedUser}
                isAdmin={false}
                onUserSelect={handleUserSelect}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
