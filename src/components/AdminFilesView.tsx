import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Users, File, Trash2, Eye, Code } from 'lucide-react';
import { FileList } from './FileList';
import { UserSelector } from './UserSelector';
import { listUserHtmlByName, loadUserHtmlByName, deleteUserHtmlByName, listAllUsersHtml } from '../lib/supabase';

interface AdminFilesViewProps {
  selectedUser: string | null;
  onBack: () => void;
  onUserSelect: (userName: string) => void;
}

interface SavedProject {
  name: string;
  metadata?: {
    created_at?: string;
    files?: any[];
  };
}

export const AdminFilesView: React.FC<AdminFilesViewProps> = ({ 
  selectedUser, 
  onBack, 
  onUserSelect 
}) => {
  const [activeTab, setActiveTab] = useState<'common' | 'user'>('common');
  const [fileListKey, setFileListKey] = useState(0);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [loadingSavedProjects, setLoadingSavedProjects] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [allUsersProjects, setAllUsersProjects] = useState<SavedProject[]>([]);
  const [loadingAllUsersProjects, setLoadingAllUsersProjects] = useState(false);

  const handleUserSelect = (userName: string) => {
    onUserSelect(userName);
    // Refresh the file list when user changes
    setFileListKey(prev => prev + 1);
    // Clear saved projects for immediate refresh
    setSavedProjects([]);
    setLoadingSavedProjects(true);
  };

  const handleTabChange = (tab: 'common' | 'user') => {
    setActiveTab(tab);
    // Refresh the file list when tab changes
    setFileListKey(prev => prev + 1);
  };

  // Load saved projects when user changes and we're on the user tab
  useEffect(() => {
    if (activeTab === 'user' && selectedUser) {
      loadSavedProjects();
    }
  }, [activeTab, selectedUser]);

  // Load everyone's projects when component mounts
  useEffect(() => {
    loadAllUsersProjects();
  }, []);

  const loadSavedProjects = async () => {
    if (!selectedUser) return;
    
    setLoadingSavedProjects(true);
    try {
      console.log('AdminFilesView: Loading saved projects for user:', selectedUser);
      const projects = await listUserHtmlByName(selectedUser);
      console.log('AdminFilesView: Received projects:', projects);
      setSavedProjects(projects);
    } catch (error) {
      console.error('Error loading saved projects:', error);
      setSavedProjects([]);
    } finally {
      setLoadingSavedProjects(false);
    }
  };

  const loadAllUsersProjects = async () => {
    setLoadingAllUsersProjects(true);
    try {
      console.log('AdminFilesView: Loading all users projects');
      const projects = await listAllUsersHtml();
      console.log('AdminFilesView: Received all users projects:', projects);
      setAllUsersProjects(projects);
    } catch (error) {
      console.error('Error loading all users projects:', error);
      setAllUsersProjects([]);
    } finally {
      setLoadingAllUsersProjects(false);
    }
  };

  const handleLoadProject = async (projectName: string) => {
    if (!selectedUser) return;
    
    try {
      const files = await loadUserHtmlByName(selectedUser, projectName, Date.now());
      
      if (files.length === 0) {
        alert('No files found in this project');
        return;
      }

      // Create a simple preview window
      const htmlFile = files.find(f => f.name === 'index.html');
      if (htmlFile) {
        const previewWindow = window.open('', '_blank', 'width=1200,height=800');
        if (previewWindow) {
          previewWindow.document.write(htmlFile.content);
          previewWindow.document.close();
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project');
    }
  };

  const handleOpenInEditor = (projectName: string, userName?: string) => {
    // If userName is provided (from Everyone's Pages), use it; otherwise use selectedUser
    const userToLoad = userName || selectedUser;
    
    // Store the project to load in sessionStorage
    sessionStorage.setItem('loadProject', JSON.stringify({
      user: userToLoad,
      projectName: projectName
    }));
    // Navigate to admin tools main page which has the editor
    window.location.href = '/admin-tools';
  };

  const handleDeleteProject = async (projectName: string) => {
    if (!selectedUser) return;
    
    if (!confirm(`Are you sure you want to delete "${projectName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteUserHtmlByName(selectedUser, projectName);
      alert('Project deleted successfully');
      loadSavedProjects(); // Refresh the list
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
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
              <>
                {activeTab === 'user' && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-gray-300">Show files:</span>
                    <select
                      value={showAllFiles ? 'everyone' : 'mine'}
                      onChange={(e) => {
                        setShowAllFiles(e.target.value === 'everyone');
                        setFileListKey(prev => prev + 1); // Refresh the file list
                      }}
                      className="bg-gray-700 text-white rounded px-3 py-1.5 border border-gray-600 text-sm"
                    >
                      <option value="mine">Mine</option>
                      <option value="everyone">Everyone's</option>
                    </select>
                  </div>
                )}
                <FileList 
                  key={`${activeTab}-${fileListKey}-${showAllFiles}`} 
                  onLoadHtmlDraft={() => {}} // Not needed for this view
                  selectedUser={activeTab === 'common' ? 'common-assets' : selectedUser || ''}
                  isAdmin={true}
                  onUserSelect={handleUserSelect}
                  showAllUsers={activeTab === 'user' && showAllFiles}
                />
              </>
            )}
          </div>

          {/* Saved Work Section - Only show for user tab when user is selected */}
          {activeTab === 'user' && selectedUser && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">
                {selectedUser}'s Saved Work
              </h2>
              <p className="text-gray-300 mb-4">
                View and manage saved HTML projects. You can preview or edit these projects.
              </p>

              {loadingSavedProjects ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 mt-2">Loading saved projects...</p>
                </div>
              ) : savedProjects.length === 0 ? (
                <div className="text-center py-8">
                  <File className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Saved Projects</h3>
                  <p className="text-gray-400 mb-3">{selectedUser} hasn't saved any projects yet.</p>
                  <div className="mt-4 p-4 bg-gray-700 rounded text-left max-w-md mx-auto">
                    <p className="text-sm text-gray-300 mb-2"><strong>How to save projects:</strong></p>
                    <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Select a user from the dropdown</li>
                      <li>Go to the main editor page</li>
                      <li>Click the "Save" button in the header</li>
                      <li>Projects will appear here once saved</li>
                    </ol>
                    <p className="text-xs text-gray-500 mt-3">
                      Looking for folders starting with: <code className="bg-gray-800 px-1 rounded">{selectedUser?.toLowerCase().replace(/\s+/g, '-')}-</code>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedProjects.map((project) => (
                    <div
                      key={project.name}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{project.name}</p>
                          {project.metadata?.created_at && (
                            <p className="text-gray-400 text-sm">
                              {new Date(project.metadata.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleLoadProject(project.name)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                          title="Preview in new window"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleOpenInEditor(project.name)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                          title="Open in editor"
                        >
                          <Code className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.name)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Everyone's Pages Section - Only show for user tab */}
          {activeTab === 'user' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">
                Everyone's Pages
              </h2>
              <p className="text-gray-300 mb-4">
                View and manage all saved HTML projects from all users.
              </p>

              {loadingAllUsersProjects ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 mt-2">Loading all projects...</p>
                </div>
              ) : allUsersProjects.length === 0 ? (
                <div className="text-center py-8">
                  <File className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Projects Found</h3>
                  <p className="text-gray-400">No users have saved any projects yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allUsersProjects.map((project) => {
                    // Extract the user name from the project
                    const userName = (project as any).userName || project.name.split('-')[0];
                    
                    return (
                      <div
                        key={project.name}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <File className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{project.name}</p>
                            <p className="text-gray-400 text-xs">by {userName}</p>
                            {project.metadata?.created_at && (
                              <p className="text-gray-500 text-xs">
                                {new Date(project.metadata.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              // For Everyone's Pages, we need to pass the userName
                              const userToLoad = (project as any).userName || project.name.split('-')[0];
                              handleOpenInEditor(project.name, userToLoad);
                            }}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                            title="Open in editor"
                          >
                            <Code className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
