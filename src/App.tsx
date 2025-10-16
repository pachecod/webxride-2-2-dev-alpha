import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home, Play, Save, Settings, Maximize2, Minimize2, X, ExternalLink, Edit3, ChevronDown, ChevronRight, Users, Eye } from 'lucide-react';
import JSZip from 'jszip';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileTabs from './components/FileTabs';
import { StudentManagement } from './components/StudentManagement';
import { ClassManagement } from './components/ClassManagement';
import { PasswordReport } from './components/PasswordReport';
import { SaveTemplateDialog } from './components/SaveTemplateDialog';
import { AdminSaveDialog } from './components/AdminSaveDialog';
import { StudentSubmitDialog } from './components/StudentSubmitDialog';
import { AdminCommentViewer } from './components/AdminCommentViewer';
import { StudentNotificationInbox } from './components/StudentNotificationInbox';
import { AboutPageComponent } from './components/AboutPage';
import { AboutPageEditor } from './components/AboutPageEditor';
import { AboutPageManagement } from './components/AboutPageManagement';
import { StudentFilesView } from './components/StudentFilesView';
import { AdminFilesView } from './components/AdminFilesView';
import { SubmissionsInbox } from './components/SubmissionsInbox';
import { FileType, Project, File, Framework } from './types';
import { supabase, getProject, saveTemplateToStorage, saveUserHtmlByName, loadUserHtmlByName, deleteUserHtmlByName, setDefaultTemplate, getDefaultTemplate, loadTemplateFromStorage, findTemplateByName, updateUserHtmlByName, deleteTemplateFromStorage, renameTemplateInStorage } from './lib/supabase';
import { AdminPasswordGate } from './components/AdminPasswordGate';
import { SimpleAuthGate } from './components/SimpleAuthGate';
import { loadStartersData, loadTemplateFromPublicPath } from './lib/template-loader';
import { createAFrameInspectorHTML } from './lib/aframe-inspector-utils';
import { SnippetsManagement } from './components/SnippetsManagement';
import { BlockedExtensionsManagement } from './components/BlockedExtensionsManagement';
import { AdminImpersonation } from './components/AdminImpersonation';

// Minimal default template - only index.html with basic structure
const minimalTemplate: Project = {
  name: 'Basic HTML Project',
  framework: Framework.HTML,
  files: [
    {
      id: 'index.html',
      name: 'index.html',
      type: FileType.HTML,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
</head>
<body>
  <h1>Welcome to WebXRide!</h1>
  <p>To get started, select the user name above that you were given by your teacher.</p>
  <p>Then, click the slider on the left labeled "Templates and Files" to see a list of latest templates you can use. Click one of the templates to modify it. (If you are new here, try the Basic HTML Template.)</p>
  <p>To save a copy, click Save. You can keep working on that file as well as the CSS and Javascript files in the tabs next to index.html and save versions.</p>
  <p>When you are ready to publish something to the web, you can select the tab for the file and click Copy Code to add it to your clipboard. Then paste it wherever you put your web pages -- such as Github Pages.</p>
</body>
</html>`
    }
  ]
};

const STARTER_HTML = `<!DOCTYPE html>\n<html>\n<head>\n  <title>My First HTML Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>This is a paragraph.</p>\n</body>\n</html>`;
const STARTER_CSS = `body {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n  background: #f8fafc;\n  color: #222;\n  margin: 0;\n  padding: 0;\n}\nh1 {\n  color: #2563eb;\n  margin-top: 2rem;\n  text-align: center;\n}\np {\n  max-width: 600px;\n  margin: 1rem auto;\n  font-size: 1.1rem;\n  line-height: 1.6;\n  text-align: center;\n}`;

// StartersPanel Component
interface StartersPanelProps {
  onClose: () => void;
  onLoadTemplate: (template: Project) => void;
}

const StartersPanel: React.FC<StartersPanelProps> = ({ onClose, onLoadTemplate }) => {
  const [embeds, setEmbeds] = useState<any[]>([]);
  const [storytelling, setStorytelling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      console.log('StartersPanel: Loading starters data...');
      console.log('StartersPanel: Current time:', new Date().toISOString());
      const data = await loadStartersData();
      console.log('StartersPanel: Received data:', data);
      console.log('StartersPanel: Embeds count:', data.embeds.length);
      console.log('StartersPanel: Embeds:', data.embeds.map(e => ({ id: e.id, title: e.title })));
      console.log('StartersPanel: Looking for test360...');
      const test360Found = data.embeds.find(e => e.id === 'test360');
      console.log('StartersPanel: test360 found:', test360Found);
      setEmbeds(data.embeds);
      setStorytelling(data.storytelling);
      console.log('StartersPanel: State updated with embeds:', data.embeds.length);
    } catch (error) {
      console.error('Error loading starters data:', error);
    } finally {
      setLoading(false);
      console.log('StartersPanel: Loading finished');
    }
  };

  useEffect(() => {
    console.log('StartersPanel: Component mounted');
    loadData();
  }, []);

  const handleOpenInNewTab = async (path: string) => {
    try {
      // Fetch the template HTML content
      const response = await fetch(path);
      const originalHTML = await response.text();
      
      // Check if it's A-Frame content and add inspector if needed
      const isAframeContent = originalHTML.includes('a-scene') || originalHTML.includes('aframe');
      
      if (isAframeContent) {
        // Create enhanced HTML with A-Frame inspector
        const enhancedHTML = createAFrameInspectorHTML(originalHTML, {
          position: 'top-left',
          buttonSize: 'medium',
          showTooltip: true
        });
        
        // Open in new window with enhanced content
        const newWindow = window.open('', '_blank', 'width=1200,height=800');
        if (newWindow) {
          newWindow.document.write(enhancedHTML);
          newWindow.document.close();
        }
      } else {
        // Open original content directly
        window.open(path, '_blank');
      }
    } catch (error) {
      console.error('Error opening template in new tab:', error);
      // Fallback to direct opening
      window.open(path, '_blank');
    }
  };

  const handleOpenInEditor = async (template: any) => {
    try {
      const project = await loadTemplateFromPublicPath(template.path);
      onLoadTemplate(project);
      onClose();
    } catch (error) {
      console.error('Error loading template into editor:', error);
      alert('Failed to load template into editor. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Starters</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="text-center text-gray-400">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Starters</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setLoading(true);
                loadData();
              }} 
              className="text-gray-400 hover:text-white px-2 py-1 text-sm"
              title="Refresh starters data"
            >
              🔄
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* WebXR Embeds Section */}
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">WebXR Embeds</h3>
            <p className="text-gray-300 text-sm mb-3">Standalone WebXR experiences that can be embedded into storytelling templates.</p>
            
            {embeds.length === 0 ? (
              <div className="text-gray-400 text-sm">No WebXR embeds found.</div>
            ) : (
              <div className="space-y-3">
                {(() => { 
                  console.log('StartersPanel: Rendering embeds:', embeds.map(e => ({ id: e.id, title: e.title }))); 
                  console.log('StartersPanel: Total embeds to render:', embeds.length);
                  console.log('StartersPanel: test360 in render list:', embeds.find(e => e.id === 'test360'));
                  return null; 
                })()}
                {embeds.map((embed) => (
                  <div key={embed.id} className="bg-gray-600 rounded p-3">
                    <h4 className="font-medium text-white mb-2">{embed.title}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenInNewTab(embed.path)}
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <ExternalLink size={14} />
                        Open in New Tab
                      </button>
                      <button
                        onClick={() => handleOpenInEditor(embed)}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit3 size={14} />
                        Open in Editor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Storytelling Templates Section */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Storytelling Templates</h3>
            <p className="text-gray-300 text-sm mb-3">Narrative templates that embed WebXR experiences for immersive storytelling.</p>
            
            {storytelling.length === 0 ? (
              <div className="text-gray-400 text-sm">No storytelling templates found.</div>
            ) : (
              <div className="space-y-3">
                {storytelling.map((template) => (
                  <div key={template.id} className="bg-gray-600 rounded p-3">
                    <h4 className="font-medium text-white mb-2">{template.title}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenInNewTab(template.path)}
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <ExternalLink size={14} />
                        Open in New Tab
                      </button>
                      <button
                        onClick={() => handleOpenInEditor(template)}
                        className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit3 size={14} />
                        Open in Editor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function AdminTools({ 
  project, 
  setProject, 
  activeFileId, 
  setActiveFileId, 
  previewKey, 
  setPreviewKey, 
  splitPosition, 
  setSplitPosition, 
  showPreview, 
  setShowPreview, 
  isPreviewExternal, 
  setIsPreviewExternal, 
  user, 
  saveProject, 
  loadProject, 
  templates, 
  setTemplates, 
  updateFile, 
  handleChangeFile, 
  refreshPreview, 
  loadTemplate, 
  handleSaveProject, 
  handleLoadProject, 
  handleLoadHtmlDraft, 
  activeFile, 
  togglePreview, 
  handleCopyCode, 
  handleSaveTemplate, 
  handleSaveHtml, 
  handleSubmitToTeacher,
  handleLoadSavedHtml, 
  handleDeleteSavedHtml, 
  handleDeleteTemplate,
  handleRenameTemplate, 
  selectedUser, 
  onUserSelect, 
  isAdmin, 
  handleAddFile, 
  showAdminPanel, 
  setShowAdminPanel,
  showStartersPanel,
  setShowStartersPanel,
  showSaveTemplateButton,
  rideyEnabled,
  handleRideyToggle,
  aframeInspectorEnabled,
  handleAframeInspectorToggle,
  setSplitToEditor,
  setSplitToEven,
  setSplitToPreview,
  projectOwner
}: any) {
  const [refreshTemplatesRef, setRefreshTemplatesRef] = useState<(() => void) | null>(null);
  
  // Auto-select admin when AdminTools component mounts
  React.useEffect(() => {
    if (!selectedUser) {
      console.log('🔧 AdminTools: Auto-selecting admin user');
      onUserSelect('admin');
    }
  }, [selectedUser, onUserSelect]);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showAboutPage, setShowAboutPage] = useState(false);
  const [showBlockedExtensions, setShowBlockedExtensions] = useState(false);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showImpersonation, setShowImpersonation] = useState(false);
  const [showPasswordReport, setShowPasswordReport] = useState(false);
  
  // Impersonation state - local to AdminTools, doesn't affect students
  const [impersonatedUser, setImpersonatedUser] = useState<string | null>(null);
  
  // Get effective user for data operations (impersonated if set, otherwise admin)
  const effectiveUserForData = impersonatedUser || selectedUser;
  
  // Debug logging
  React.useEffect(() => {
    console.log('[AdminTools] Impersonation state changed:', {
      impersonatedUser,
      selectedUser,
      effectiveUserForData
    });
  }, [impersonatedUser, selectedUser, effectiveUserForData]);

  // Note: projectOwner is now passed as a prop from the parent App component

  // Function to refresh templates (will be set by Sidebar)
  const refreshTemplates = () => {
    if (refreshTemplatesRef) {
      refreshTemplatesRef();
    }
  };

  // Callback to set the refresh function from Sidebar
  const setRefreshFunction = (fn: () => void) => {
    setRefreshTemplatesRef(() => fn);
  };

  const handleNewTemplate = () => {
    const newProject: Project = {
      name: 'Untitled Template',
      framework: Framework.HTML,
      files: [
        { id: 'index.html', name: 'index.html', type: FileType.HTML, content: STARTER_HTML },
        { id: 'style.css', name: 'style.css', type: FileType.CSS, content: STARTER_CSS },
        { id: 'script.js', name: 'script.js', type: FileType.JS, content: '' },
      ]
    };
    setProject(newProject);
    setActiveFileId('index.html');
    setShowNewTemplateDialog(false);
  };

  // Function to detect if current content is A-Frame
  const isAframeContent = () => {
    const htmlFile = project.files.find((f: File) => f.id === 'index.html');
    if (!htmlFile) return false;
    
    const content = htmlFile.content.toLowerCase();
    return content.includes('a-scene') || content.includes('aframe') || content.includes('aframe.io');
  };

  // Function to handle opening A-Frame inspector
  const handleOpenInspector = () => {
    // Call the global openAframeInspector function from the Preview component
    if ((window as any).openAframeInspector) {
      (window as any).openAframeInspector();
    } else {
      // Fallback: show instructions
      alert('Please use Ctrl+Alt+I (or Cmd+Option+I on Mac) in the preview window to open the A-Frame Inspector.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header 
        projectName={project.name}
        {...(showSaveTemplateButton ? { onSaveTemplate: handleSaveTemplate } : {})}
        selectedUser={selectedUser}
        onUserSelect={onUserSelect}
        isAdmin={isAdmin}
        showAdminPanel={showAdminPanel}
        setShowAdminPanel={setShowAdminPanel}
        showStartersPanel={showStartersPanel}
        setShowStartersPanel={setShowStartersPanel}
        onSaveHtml={handleSaveHtml}
        onSubmitToTeacher={handleSubmitToTeacher}
        projectOwner={projectOwner}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          key={`admin-sidebar-${effectiveUserForData}`}
          onLoadTemplate={loadTemplate}
          templates={templates}
          projects={[]}
          onLoadProject={handleLoadProject}
          onLoadHtmlDraft={handleLoadHtmlDraft}
          refreshTemplates={setRefreshTemplatesRef}
          onLoadSavedHtml={handleLoadSavedHtml}
          onDeleteSavedHtml={handleDeleteSavedHtml}
          onFileSelect={(file) => {
            console.log('File selected:', file);
            // This could be used for additional file selection logic if needed
          }}
          onDeleteTemplate={handleDeleteTemplate}
          onRenameTemplate={handleRenameTemplate}
          selectedUser={effectiveUserForData}
          isAdmin={true}
          onUserSelect={onUserSelect}
          actualUser={selectedUser}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <FileTabs 
            files={project.files}
            activeFileId={activeFileId}
            onChangeFile={handleChangeFile}
            onAddFile={handleAddFile}
            onNewTemplate={() => setShowNewTemplateDialog(true)}
          />
          <div className="flex flex-1 overflow-hidden relative">
            <div 
              className="h-full overflow-hidden transition-[width] duration-300 ease-in-out relative"
              style={{ width: showPreview ? `${splitPosition}%` : '100%' }}
            >
              <div className="absolute top-2 right-2 z-10">
                {!showPreview && (
                  <button 
                    onClick={togglePreview}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1 text-sm"
                    title="Show Preview"
                  >
                    <Maximize2 size={16} />
                    <span>Show Preview</span>
                  </button>
                )}
              </div>
              <Editor 
                value={activeFile?.content || ''}
                language={activeFile?.type || FileType.HTML}
                fileName={activeFile?.name}
                onChange={(value) => updateFile(activeFileId, value)}
                rideyEnabled={rideyEnabled}
              />
            </div>
            <div 
              className="flex flex-col transition-[width] duration-300 ease-in-out"
              style={{ width: showPreview ? `${100 - splitPosition}%` : '0%' }}
            >
              <div className="flex-1 overflow-hidden">
                <Preview 
                  key={`${previewKey}-${aframeInspectorEnabled}`}
                  files={project.files}
                  framework={project.framework}
                  project={project}
                  onPreviewModeChange={(isExternal) => {
                    setIsPreviewExternal(isExternal);
                    setShowPreview(!isExternal);
                  }}
                  onHidePreview={togglePreview}
                  onInspectorSave={(updatedHtml) => {
                    console.log('Received updated HTML from A-Frame inspector, length:', updatedHtml.length);
                    // Update the HTML file content
                    const htmlFile = project.files.find((f: any) => f.id === 'index.html');
                    if (htmlFile) {
                      console.log('Updating HTML file with new content');
                      updateFile('index.html', updatedHtml);
                      // Show success message
                      alert('Changes from A-Frame Inspector have been saved to the editor!');
                    } else {
                      console.log('No HTML file found in project');
                    }
                  }}
                  aframeInspectorEnabled={aframeInspectorEnabled}
                />
              </div>
              {showPreview && (
                <div className="bg-gray-800 border-t border-gray-700 px-3 py-2 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-medium">Resize:</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={setSplitToEditor}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          splitPosition === 80 ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        }`}
                        title="Small Preview (Focus on Editor)"
                      >
                        Small
                      </button>
                      <button 
                        onClick={setSplitToEven}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          splitPosition === 50 ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        }`}
                        title="Medium Preview (Equal Split)"
                      >
                        Medium
                      </button>
                      <button 
                        onClick={setSplitToPreview}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          splitPosition === 20 ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        }`}
                        title="Large Preview (Focus on Preview)"
                      >
                        Large
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        
        {/* Admin Panel Sidebar */}
        {showAdminPanel && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Impersonation Status Indicator */}
              {impersonatedUser && (
                <div className="mb-4 p-3 bg-purple-900/30 border border-purple-500 rounded">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Eye size={16} className="text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-purple-300 text-xs">Viewing as:</p>
                        <p className="text-white font-semibold truncate">{impersonatedUser}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setImpersonatedUser(null)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition-colors flex items-center gap-1 flex-shrink-0"
                      title="Stop viewing as this student"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Panel Navigation */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => window.location.href = '/admin-tools/submissions'}
                  className="px-3 py-2 rounded text-sm transition-colors flex-shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                >
                  📥 Student Submissions
                </button>
                <button
                  onClick={() => window.location.href = '/admin-tools/myfiles'}
                  className="px-3 py-2 rounded text-sm transition-colors flex-shrink-0 bg-green-600 text-white hover:bg-green-700"
                >
                  📁 File Management
                </button>
                <button
                  onClick={() => { setShowClassManagement(false); setShowSnippets(false); setShowAboutPage(false); setShowBlockedExtensions(false); setShowPasswordReport(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    !showClassManagement && !showSnippets && !showAboutPage && !showBlockedExtensions && !showPasswordReport
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Manage Settings
                </button>
                <button
                  onClick={() => { setShowClassManagement(true); setShowSnippets(false); setShowAboutPage(false); setShowBlockedExtensions(false); setShowPasswordReport(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    showClassManagement
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Classes
                </button>
                <button
                  onClick={() => { setShowSnippets(true); setShowClassManagement(false); setShowAboutPage(false); setShowBlockedExtensions(false); setShowPasswordReport(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    showSnippets
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Snippets
                </button>
                <button
                  onClick={() => { setShowAboutPage(true); setShowClassManagement(false); setShowSnippets(false); setShowBlockedExtensions(false); setShowPasswordReport(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    showAboutPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  About Page
                </button>
                <button
                  onClick={() => { setShowBlockedExtensions(true); setShowClassManagement(false); setShowSnippets(false); setShowAboutPage(false); setShowPasswordReport(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    showBlockedExtensions
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Blocked Extensions
                </button>
                <button
                  onClick={() => { setShowPasswordReport(true); setShowClassManagement(false); setShowSnippets(false); setShowAboutPage(false); setShowBlockedExtensions(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    showPasswordReport
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Password Report
                </button>
              </div>

              
              <div className="space-y-6">
                {/* Student Management */}
                {!showClassManagement && !showSnippets && !showAboutPage && !showBlockedExtensions && !showPasswordReport && (
                  <div className="space-y-6">
                    {/* View as Student - Collapsible Section */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <button
                        onClick={() => setShowImpersonation(!showImpersonation)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="font-semibold">View as Student</span>
                        </div>
                        {showImpersonation ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      
                      {showImpersonation && (
                        <div className="mt-3">
                          <AdminImpersonation
                            impersonatedUser={impersonatedUser}
                            onImpersonate={setImpersonatedUser}
                          />
                        </div>
                      )}
                    </div>

                    {/* AI Assistant Settings */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">AI Assistant Settings</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 text-sm font-medium">Enable Ridey AI Assistant</label>
                          <p className="text-gray-400 text-xs mt-1">
                            Allow students to use the AI assistant for code suggestions
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rideyEnabled}
                            onChange={handleRideyToggle}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* A-Frame Inspector Settings */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">A-Frame Inspector Settings</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-gray-300 text-sm font-medium">Show A-Frame Inspector</label>
                          <p className="text-gray-400 text-xs mt-1">
                            Allow users to access the A-Frame inspector gear icon in the editor
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={aframeInspectorEnabled}
                            onChange={handleAframeInspectorToggle}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                    
                    {/* Student Management */}
                    <StudentManagement />
                  </div>
                )}
                
                {/* Class Management */}
                {showClassManagement && (
                  <ClassManagement 
                    isVisible={showClassManagement}
                    onClose={() => setShowClassManagement(false)}
                  />
                )}
                {/* Snippets Management */}
                {showSnippets && <SnippetsManagement />}
                
                {/* About Page Management */}
                {showAboutPage && <AboutPageManagement />}
                
                {/* Blocked Extensions Management */}
                {showBlockedExtensions && <BlockedExtensionsManagement />}
                
                {/* Password Report Modal */}
                {showPasswordReport && (
                  <PasswordReport 
                    onClose={() => setShowPasswordReport(false)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Starters Panel Sidebar */}
        {showStartersPanel && (
          <StartersPanel 
            onClose={() => setShowStartersPanel(false)}
            onLoadTemplate={loadTemplate}
          />
        )}
        {/* New Template Confirmation Dialog */}
        {showNewTemplateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Warning</h3>
              <p className="text-gray-300 mb-6">
                This will erase your previous work. Do you want to continue?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNewTemplateDialog(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleNewTemplate}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MainApp({
  project, setProject, activeFileId, setActiveFileId, previewKey, setPreviewKey, splitPosition, setSplitPosition, showPreview, setShowPreview, isPreviewExternal, setIsPreviewExternal, user, saveProject, loadProject, templates, setTemplates, updateFile, handleChangeFile, refreshPreview, loadTemplate, handleSaveProject, handleLoadProject, handleLoadHtmlDraft, activeFile, togglePreview, handleCopyCode, showSaveTemplateButton, handleSaveTemplate, handleSaveHtml, handleSubmitToTeacher, handleViewNotifications, handleLoadSavedHtml, handleDeleteSavedHtml, handleDeleteTemplate, handleRenameTemplate, selectedUser, onUserSelect, isAdmin, handleAddFile, handleExportLocalSite, refreshTemplates, setRefreshTemplatesRef, rideyEnabled, aframeInspectorEnabled, handleAframeInspectorToggle, setSplitToEditor, setSplitToEven, setSplitToPreview, projectOwner
}: any) {
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);

  const handleNewTemplate = () => {
    const newProject: Project = {
      name: 'Untitled Template',
      framework: Framework.HTML,
      files: [
        { id: 'index.html', name: 'index.html', type: FileType.HTML, content: STARTER_HTML },
        { id: 'style.css', name: 'style.css', type: FileType.CSS, content: STARTER_CSS },
        { id: 'script.js', name: 'script.js', type: FileType.JS, content: '' },
      ]
    };
    setProject(newProject);
    setActiveFileId('index.html');
    setShowNewTemplateDialog(false);
  };

  // Function to detect if current content is A-Frame
  const isAframeContent = () => {
    const htmlFile = project.files.find((f: File) => f.id === 'index.html');
    if (!htmlFile) return false;
    
    const content = htmlFile.content.toLowerCase();
    return content.includes('a-scene') || content.includes('aframe') || content.includes('aframe.io');
  };

  // Function to handle opening A-Frame inspector
  const handleOpenInspectorMain = () => {
    // Call the global openAframeInspector function from the Preview component
    if ((window as any).openAframeInspector) {
      (window as any).openAframeInspector();
    } else {
      // Fallback: show instructions
      alert('Please use Ctrl+Alt+I (or Cmd+Option+I on Mac) in the preview window to open the A-Frame Inspector.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header 
        projectName={project.name}
        {...(showSaveTemplateButton ? { onSaveTemplate: handleSaveTemplate } : {})}
        selectedUser={selectedUser}
        onUserSelect={onUserSelect}
        isAdmin={isAdmin}
        onSaveHtml={handleSaveHtml}
        onSubmitToTeacher={handleSubmitToTeacher}
        onExportLocalSite={handleExportLocalSite}
        projectOwner={projectOwner}
        onViewNotifications={handleViewNotifications}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onLoadTemplate={loadTemplate}
          templates={templates}
          projects={[]}
          onLoadProject={handleLoadProject}
          onLoadHtmlDraft={handleLoadHtmlDraft}
          refreshTemplates={setRefreshTemplatesRef}
          onLoadSavedHtml={handleLoadSavedHtml}
          onDeleteSavedHtml={handleDeleteSavedHtml}
          onFileSelect={(file) => {
            console.log('File selected:', file);
            // This could be used for additional file selection logic if needed
          }}
          onDeleteTemplate={handleDeleteTemplate}
          onRenameTemplate={handleRenameTemplate}
          selectedUser={selectedUser}
          isAdmin={isAdmin}
          onUserSelect={onUserSelect}
          actualUser={selectedUser}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <FileTabs 
            files={project.files}
            activeFileId={activeFileId}
            onChangeFile={handleChangeFile}
            onAddFile={handleAddFile}
            onNewTemplate={() => setShowNewTemplateDialog(true)}
          />
          <div className="flex flex-1 overflow-hidden relative">
            <div 
              className="h-full overflow-hidden transition-[width] duration-300 ease-in-out relative"
              style={{ width: showPreview ? `${splitPosition}%` : '100%' }}
            >
              {!showPreview && (
                <div className="absolute top-2 right-2 z-10">
                  <button 
                    onClick={togglePreview}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1 text-sm"
                    title="Show Preview"
                  >
                    <Maximize2 size={16} />
                    <span>Show Preview</span>
                  </button>
                </div>
              )}
              <Editor 
                value={activeFile?.content || ''}
                language={activeFile?.type || FileType.HTML}
                fileName={activeFile?.name}
                onChange={(value) => updateFile(activeFileId, value)}
                showInspectorButton={isAframeContent() && aframeInspectorEnabled}
                onOpenInspector={handleOpenInspectorMain}
                rideyEnabled={rideyEnabled}
              />
            </div>
            <div 
              className="flex flex-col transition-[width] duration-300 ease-in-out"
              style={{ width: showPreview ? `${100 - splitPosition}%` : '0%' }}
            >
              <div className="flex-1 overflow-hidden">
                <Preview 
                  key={`${previewKey}-${aframeInspectorEnabled}`}
                  files={project.files}
                  framework={project.framework}
                  project={project}
                  onPreviewModeChange={(isExternal) => {
                    setIsPreviewExternal(isExternal);
                    setShowPreview(!isExternal);
                  }}
                  onHidePreview={togglePreview}
                  onInspectorSave={(updatedHtml) => {
                    console.log('Received updated HTML from A-Frame inspector');
                    // Update the HTML file content
                    const htmlFile = project.files.find((f: File) => f.id === 'index.html');
                    if (htmlFile) {
                      updateFile('index.html', updatedHtml);
                      // Show success message
                      alert('Changes from A-Frame Inspector have been saved to the editor!');
                    }
                  }}
                  aframeInspectorEnabled={aframeInspectorEnabled}
                />
              </div>
              {showPreview && (
                <div className="bg-gray-800 border-t border-gray-700 px-3 py-2 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-medium">Resize:</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={setSplitToEditor}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          splitPosition === 80 ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        }`}
                        title="Small Preview (Focus on Editor)"
                      >
                        Small
                      </button>
                      <button 
                        onClick={setSplitToEven}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          splitPosition === 50 ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        }`}
                        title="Medium Preview (Equal Split)"
                      >
                        Medium
                      </button>
                      <button 
                        onClick={setSplitToPreview}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          splitPosition === 20 ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                        }`}
                        title="Large Preview (Focus on Preview)"
                      >
                        Large
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        {/* New Template Confirmation Dialog */}
        {showNewTemplateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Warning</h3>
              <p className="text-gray-300 mb-6">
                This will erase your previous work. Do you want to continue?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNewTemplateDialog(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleNewTemplate}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [project, setProject] = useState<Project>(() => {
    const savedProject = localStorage.getItem('current-project');
    if (savedProject) {
      try {
        const parsed = JSON.parse(savedProject);
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved project');
      }
    }
    return minimalTemplate;
  });
  const [activeFileId, setActiveFileId] = useState<string>('index.html');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewExternal, setIsPreviewExternal] = useState(false);
  const [templates, setTemplates] = useState<Project[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(() => {
    // Load saved user from localStorage on component mount
    const savedUser = localStorage.getItem('selected-user');
    return savedUser || null;
  });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showStartersPanel, setShowStartersPanel] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showAdminSaveDialog, setShowAdminSaveDialog] = useState(false);
  const [showStudentSubmitDialog, setShowStudentSubmitDialog] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{filename: string, filenameWithTimestamp: string} | null>(null);
  const [pendingSubmitData, setPendingSubmitData] = useState<{filename: string, filenameWithTimestamp: string} | null>(null);
  const [refreshTemplatesRef, setRefreshTemplatesRef] = useState<(() => void) | null>(null);
  const [rideyEnabled, setRideyEnabled] = useState(() => {
    // Load Ridey setting from localStorage, default to false (disabled)
    const saved = localStorage.getItem('ridey-enabled');
    return saved === 'true';
  });

  // A-Frame Inspector toggle (admin setting)
  const [aframeInspectorEnabled, setAframeInspectorEnabled] = useState(() => {
    // Load inspector setting from localStorage, default to false (disabled)
    const saved = localStorage.getItem('aframe-inspector-enabled');
    return saved === 'true';
  });
  
  // Track the owner of the currently loaded project (for admins editing student work)
  const [projectOwner, setProjectOwner] = useState<string | null>(null);
  
  // Track admin comment from loaded project metadata
  const [projectMetadata, setProjectMetadata] = useState<{adminComment?: string; commentDate?: string} | null>(null);

  // Check if there's a project to load from the file management view (admin only)
  React.useEffect(() => {
    // Only run this effect if we have a selectedUser and we're on the admin-tools route
    if (!selectedUser) return;
    
    const loadProjectData = sessionStorage.getItem('loadProject');
    if (loadProjectData && selectedUser === 'admin' && window.location.pathname === '/admin-tools') {
      sessionStorage.removeItem('loadProject'); // Clear it immediately
      try {
        const { user, projectName } = JSON.parse(loadProjectData);
        console.log('Loading project from session storage:', { user, projectName });
        // Load the project using the correct user
        handleLoadSavedHtmlForUser(projectName, user);
        // Track who owns this project so we can save back to them
        setProjectOwner(user);
      } catch (error) {
        console.error('Error loading project from session storage:', error);
        // Clear the session storage data if there's an error
        sessionStorage.removeItem('loadProject');
      }
    } else if (selectedUser && selectedUser !== 'admin') {
      // For students, ensure projectOwner is null and clear any session storage
      setProjectOwner(null);
      if (sessionStorage.getItem('loadProject')) {
        console.log('Clearing session storage for student user');
        sessionStorage.removeItem('loadProject');
      }
    }
  }, [selectedUser]);

  // Function to refresh templates (will be set by Sidebar)
  const refreshTemplates = () => {
    if (refreshTemplatesRef) {
      refreshTemplatesRef();
    }
  };


  // Save selectedUser to localStorage whenever it changes
  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('selected-user', selectedUser);
    } else {
      localStorage.removeItem('selected-user');
    }
  }, [selectedUser]);

  // Save Ridey setting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ridey-enabled', rideyEnabled.toString());
  }, [rideyEnabled]);

  // Save A-Frame Inspector setting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aframe-inspector-enabled', aframeInspectorEnabled.toString());
  }, [aframeInspectorEnabled]);

  // Function to handle Ridey toggle
  const handleRideyToggle = () => {
    setRideyEnabled(!rideyEnabled);
  };

  // Function to handle A-Frame Inspector toggle
  const handleAframeInspectorToggle = () => {
    setAframeInspectorEnabled(!aframeInspectorEnabled);
  };

  // Load default template when app starts if user is already selected and project is minimalTemplate
  useEffect(() => {
    if (selectedUser && project && project.name === 'Basic HTML Project') {
      // Only load default template if there's no saved project
      const savedProject = localStorage.getItem('current-project');
      if (!savedProject) {
        onUserSelect(selectedUser);
      }
    }
  }, [selectedUser, project]);



  const updateFile = (fileId: string, content: string) => {
    const newProject = {
      ...project,
      files: project.files.map(file => 
        file.id === fileId ? { ...file, content } : file
      )
    };
    setProject(newProject);
    localStorage.setItem('current-project', JSON.stringify(newProject));
    setPreviewKey(prev => prev + 1);
  };

  const handleChangeFile = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const loadTemplate = (templateProject: Project) => {
    console.log('loadTemplate called with:', templateProject);
    console.log('Template files:', templateProject.files);
    
    // Clear projectOwner and metadata when loading a template (starting fresh)
    setProjectOwner(null);
    setProjectMetadata(null);
    
    // Defensive: ensure files is an array and has index.html
    if (!Array.isArray(templateProject.files) || templateProject.files.length === 0) {
      alert('This template has no files!');
      return;
    }
    
    if (!templateProject.files.some(f => f.id === 'index.html')) {
      alert('This template is missing an index.html file or has malformed files.');
      return;
    }
    
    // Ensure every file has id, name, and content
    const mappedFiles: File[] = [];
    for (const f of templateProject.files) {
      const id = f.id || f.name;
      const name = f.name || f.id;
      const content = f.content || '';
      
      // Validate that we have the required fields
      if (!id || !name) {
        console.error('Invalid file structure:', f);
        continue;
      }
      
      mappedFiles.push({ ...f, id, name, content });
    }
    
    if (mappedFiles.length === 0) {
      alert('No valid files found in this template.');
      return;
    }
    
    console.log('Mapped files for project:', mappedFiles);
    console.log('First file content:', mappedFiles[0]?.content);
    console.log('First file id:', mappedFiles[0]?.id);
    
    const fixedProject = { 
      ...templateProject, 
      files: mappedFiles,
      name: templateProject.name || 'Untitled Project'
    };
    
    console.log('Setting project to:', fixedProject);
    
    // Use a timeout to ensure state updates happen in the correct order
    setTimeout(() => {
      setProject(fixedProject);
      
      // Prioritize index.html as the active file, fallback to first file
      const indexHtmlFile = mappedFiles.find(f => f.id === 'index.html' || f.name === 'index.html');
      const activeFileId = indexHtmlFile?.id || mappedFiles[0]?.id || 'index.html';
      console.log('Setting activeFileId to:', activeFileId, 'from file:', indexHtmlFile?.name || mappedFiles[0]?.name);
      setActiveFileId(activeFileId);
      
      localStorage.setItem('current-project', JSON.stringify(fixedProject));
      setPreviewKey(prev => prev + 1);
      console.log('Template loaded successfully');
    }, 0);
  };

  const handleSaveProject = async () => {
    if (!selectedUser) {
      alert('Please select your name first before saving.');
      return;
    }
    
    if (!project) {
      alert('No project to save.');
      return;
    }
    
    const filename = prompt('Enter a name for your project:');
    if (!filename) return;
    
    console.log('Saving HTML to cloud for user:', selectedUser);
    
    try {
      const result = await saveUserHtmlByName(selectedUser, project.files, filename);
      console.log('Save result:', result);
      
      if (result.error) {
        console.error('Save failed:', result.error);
        alert('Failed to save HTML: ' + (result.error instanceof Error ? result.error.message : 'Unknown error'));
        return;
      }
      
      console.log('Save completed successfully:', result.data);
      alert(`HTML saved successfully as "${filename}"!`);
      
      // Refresh the entire app to ensure everything is in sync
      window.location.reload();
      
    } catch (err) {
      console.error('Error saving HTML:', err);
      alert('Failed to save HTML: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleLoadProject = async (projectId: string) => {
    console.log('handleLoadProject called with projectId:', projectId);
    
    const { data: loadedProject, error } = await getProject(projectId);
    console.log('Loaded project:', loadedProject);
    
    if (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return;
    }
    
    if (loadedProject) {
      if (!Array.isArray(loadedProject.files) || loadedProject.files.length === 0) {
        alert('This project has no files!');
        return;
      }
      console.log('Setting project state with:', loadedProject);
      setProject(loadedProject);
      setActiveFileId(loadedProject.files[0]?.id || 'index.html');
      localStorage.setItem('current-project', JSON.stringify(loadedProject));
      setPreviewKey(prev => prev + 1);
      console.log('Project loaded successfully');
    } else {
      console.log('Failed to load project');
    }
  };

  const handleLoadHtmlDraft = (html: string) => {
    const newProject = {
      ...project,
      files: project.files.map(file =>
        file.id === 'index.html' ? { ...file, content: html } : file
      )
    };
    setProject(newProject);
    localStorage.setItem('current-project', JSON.stringify(newProject));
    setPreviewKey(prev => prev + 1);
  };

  const activeFile = project.files.find(file => file.id === activeFileId) || project.files[0];
  console.log('activeFile calculation:', {
    activeFileId,
    activeFile,
    projectFiles: project.files,
    foundFile: project.files.find(file => file.id === activeFileId),
    firstFile: project.files[0],
    projectName: project.name,
    projectFilesLength: project.files.length
  });

  const togglePreview = () => {
    if (isPreviewExternal) {
      setIsPreviewExternal(false);
      setShowPreview(true);
    } else {
      setShowPreview(!showPreview);
    }
  };

  // Simple preset split functions
  const setSplitToEditor = () => setSplitPosition(80);
  const setSplitToEven = () => setSplitPosition(50);
  const setSplitToPreview = () => setSplitPosition(20);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeFile?.content || '');
    } catch (err) {
      alert('Failed to copy code');
    }
  };

  const handleAddFile = (type: FileType, customFileName?: string) => {
    let fileName: string;
    let fileId: string;
    let content: string;

    if (type === FileType.CUSTOM && customFileName) {
      fileName = customFileName;
      fileId = customFileName;
      content = `// Add your ${customFileName} content here`;
    } else {
      fileName = type === FileType.CSS ? 'style.css' : 'script.js';
      fileId = fileName;
      content = type === FileType.CSS ? 
        `/* Add your CSS styles here */` : 
        `// Add your JavaScript code here`;
    }
    
    // Check if file already exists
    if (project.files.some(file => file.id === fileId)) {
      alert(`File ${fileName} already exists!`);
      return;
    }

    const newFile = {
      id: fileId,
      name: fileName,
      type: type,
      content: content
    };

    const newProject = {
      ...project,
      files: [...project.files, newFile]
    };

    setProject(newProject);
    setActiveFileId(fileId);
    localStorage.setItem('current-project', JSON.stringify(newProject));
    setPreviewKey(prev => prev + 1);
  };

  const handleSaveTemplate = async () => {
    setShowSaveTemplateDialog(true);
  };

  const handleSaveTemplateWithOptions = async (templateName: string, setAsDefault: boolean) => {
    const { framework, files } = project;
    console.log('Saving template with project:', project);
    console.log('Files to save:', files);
    if (!Array.isArray(files) || files.length === 0) {
      alert('Cannot save template: no files in project!');
      return;
    }

    // Only include files that have content (not empty)
    const filesWithContent = files.filter(file => 
      file.content && file.content.trim().length > 0
    );

    if (filesWithContent.length === 0) {
      alert('Cannot save template: no files with content!');
      return;
    }

    // Convert files to the format expected by saveTemplateToStorage
    const templateFiles = filesWithContent.map(file => ({
      name: file.name,
      content: file.content,
      type: file.type
    }));

    const { data, error } = await saveTemplateToStorage({
      name: templateName,
      framework,
      description: '',
      files: templateFiles
    });

    if (error) {
      alert('Failed to save template: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return;
    }

    // Check if this was an update or new template
    const existingTemplate = await findTemplateByName(templateName);
    const isUpdate = existingTemplate && existingTemplate.id === data?.id;
    const actionText = isUpdate ? 'updated' : 'saved';

    // If setAsDefault is true and we're an admin, set this as the default template
    if (setAsDefault && selectedUser === 'admin') {
      try {
        const templateId = data?.id || templateName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
        await setDefaultTemplate(templateId, templateName, selectedUser);
        alert(`Template ${actionText} successfully and set as default! It will appear in the Templates tab after a moment.`);
      } catch (defaultError) {
        console.error('Error setting default template:', defaultError);
        alert(`Template ${actionText} successfully, but failed to set as default. It will appear in the Templates tab after a moment.`);
      }
    } else {
      alert(`Template ${actionText} successfully! It will appear in the Templates tab after a moment.`);
    }

    // Refresh the entire app to ensure everything is in sync
    window.location.reload();
  };

  const handleSaveHtml = async () => {
    if (!selectedUser) {
      alert('Please select your name first before saving.');
      return;
    }
    
    if (!project) {
      alert('No project to save.');
      return;
    }
    
    const filename = prompt('Enter a name for your project:');
    if (!filename) return;
    
    // Add date and time to the filename
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const timestamp = `${month}${day}:${String(displayHours).padStart(2, '0')}${minutes}${ampm}`;
    
    const filenameWithTimestamp = `${filename}-${timestamp}`;
    
    // Check if admin is editing student's work
    const isAdminEditingStudentWork = selectedUser === 'admin' && projectOwner && projectOwner !== 'admin';
    
    console.log('Save check:', {
      selectedUser,
      projectOwner,
      isAdminEditingStudentWork,
      pathname: window.location.pathname
    });
    
    if (isAdminEditingStudentWork) {
      // Show the dialog to let admin choose save options
      console.log('Showing admin save dialog');
      setPendingSaveData({ filename, filenameWithTimestamp });
      setShowAdminSaveDialog(true);
    } else {
      // Normal save flow (student saving own work, or admin saving admin's work)
      console.log('Normal save flow');
      const success = await performSave(selectedUser, filenameWithTimestamp);
      if (success) {
        alert(`HTML saved successfully as "${filenameWithTimestamp}"!`);
        window.location.reload();
      }
    }
  };

  // Perform the actual save operation
  const performSave = async (userName: string, filenameWithTimestamp: string, adminComment?: string, submissionData?: {studentComment?: string; isSubmitted?: boolean}) => {
    if (!project) return;
    
    console.log('Saving HTML to cloud for user:', userName, adminComment ? '(with admin comment)' : '', submissionData?.isSubmitted ? '(submitted)' : '');
    
    try {
      const result = await saveUserHtmlByName(userName, project.files, filenameWithTimestamp, adminComment, submissionData);
      console.log('Save result:', result);
      
      if (result.error) {
        console.error('Save failed:', result.error);
        alert('Failed to save HTML: ' + (result.error instanceof Error ? result.error.message : 'Unknown error'));
        return false;
      }
      
      console.log('Save completed successfully:', result.data);
      return true;
      
    } catch (err) {
      console.error('Error saving HTML:', err);
      alert('Failed to save HTML: ' + (err instanceof Error ? err.message : 'Unknown error'));
      return false;
    }
  };

  // Handle admin's save choice when editing student work
  const handleAdminSaveChoice = async (saveOption: 'admin-only' | 'both', comment?: string) => {
    if (!pendingSaveData || !projectOwner || !project) return;
    
    const { filenameWithTimestamp } = pendingSaveData;
    
    try {
      if (saveOption === 'admin-only') {
        // Save only to admin's account (no comment needed since student won't see it)
        const success = await performSave('admin', filenameWithTimestamp);
        if (success) {
          alert(`HTML saved to admin account as "${filenameWithTimestamp}"!`);
          window.location.reload();
        }
      } else {
        // Save to both: update student's original AND save to admin
        // First, save/update the student's original WITH the comment
        const studentSuccess = await performSave(projectOwner, filenameWithTimestamp, comment);
        
        // Then, save a copy to admin's account (without comment)
        const adminSuccess = await performSave('admin', filenameWithTimestamp);
        
        if (studentSuccess && adminSuccess) {
          const commentMsg = comment ? ' (with feedback)' : '';
          alert(`HTML saved to both ${projectOwner}'s and admin's accounts as "${filenameWithTimestamp}"${commentMsg}!`);
          window.location.reload();
        } else if (studentSuccess) {
          alert(`HTML saved to ${projectOwner}'s account, but failed to save to admin account.`);
          window.location.reload();
        } else if (adminSuccess) {
          alert(`HTML saved to admin account, but failed to update ${projectOwner}'s account.`);
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Error in admin save:', err);
      alert('Failed to save HTML: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      // Clean up
      setPendingSaveData(null);
    }
  };

  const handleLoadSavedHtml = async (folderName: string) => {
    if (!selectedUser) {
      alert('Please select your name first before loading saved work.');
      return;
    }
    
    // Check if there's a project owner set in sessionStorage (from Everyone's Pages click)
    const loadProjectOwner = sessionStorage.getItem('loadProjectOwner');
    sessionStorage.removeItem('loadProjectOwner'); // Clear it immediately
    
    if (loadProjectOwner && selectedUser === 'admin' && loadProjectOwner !== 'admin') {
      // Admin is loading a student's file
      console.log('Setting projectOwner to:', loadProjectOwner);
      setProjectOwner(loadProjectOwner);
      return handleLoadSavedHtmlForUser(folderName, loadProjectOwner);
    } else {
      // Loading own work
      setProjectOwner(null);
      return handleLoadSavedHtmlForUser(folderName, selectedUser);
    }
  };

  const handleLoadSavedHtmlForUser = async (folderName: string, userName: string) => {
    console.log('Loading saved HTML for user:', userName, 'from folder:', folderName);
    
    try {
      // Pass a cache-busting timestamp to ensure fresh data
      const cacheBust = Date.now();
      const result = await loadUserHtmlByName(userName, folderName, cacheBust);
      console.log('Loaded result:', result);
      
      const loadedFiles = result.files;
      const loadedMetadata = result.metadata;
      
      if (loadedFiles.length === 0) {
        alert('No files found in the saved project');
        return;
      }
      
      // Store metadata (including admin comment if present)
      if (loadedMetadata) {
        setProjectMetadata(loadedMetadata);
        console.log('Loaded metadata with admin comment:', loadedMetadata.adminComment);
      }
      
      // Create files with proper IDs based on their names
      let files = loadedFiles.map((file, index) => ({
        id: file.name, // Use the actual filename as the ID
        name: file.name,
        type: file.type === 'html' ? FileType.HTML : 
              file.type === 'css' ? FileType.CSS : 
              file.type === 'javascript' ? FileType.JS : FileType.HTML,
        content: file.content
      }));
      
      // Ensure there is an index.html file
      const hasIndexHtml = files.some(f => f.name === 'index.html');
      if (!hasIndexHtml) {
        // Find the first HTML file and duplicate it as index.html
        const firstHtml = files.find(f => f.type === FileType.HTML);
        if (firstHtml) {
          files.push({ ...firstHtml, id: 'index.html', name: 'index.html' });
        }
      }
      
      const newProject: Project = {
        name: folderName.split('-').slice(0, -1).join('-') || 'Loaded Project',
        framework: Framework.HTML,
        files
      };
      
      setProject(newProject);
      setActiveFileId('index.html');
      setPreviewKey(prev => prev + 1);
      
      alert(`Successfully loaded "${newProject.name}"!`);
      
    } catch (err) {
      console.error('Error loading saved HTML:', err);
      alert('Failed to load saved HTML: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Handle student submission
  const handleSubmitToTeacher = async () => {
    if (!selectedUser || selectedUser === 'admin') {
      alert('Only students can submit work to teacher.');
      return;
    }
    
    if (!project) {
      alert('No project to submit.');
      return;
    }
    
    const filename = prompt('Enter a name for your submission:');
    if (!filename) return;
    
    // Add date and time to the filename
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const timestamp = `${month}${day}:${String(displayHours).padStart(2, '0')}${minutes}${ampm}`;
    
    const filenameWithTimestamp = `${filename}-${timestamp}`;
    
    // Show the submit dialog
    setPendingSubmitData({ filename, filenameWithTimestamp });
    setShowStudentSubmitDialog(true);
  };

  // Handle student's submission with optional comment
  const handleStudentSubmitChoice = async (studentComment?: string) => {
    if (!pendingSubmitData || !selectedUser || !project) return;
    
    const { filenameWithTimestamp } = pendingSubmitData;
    
    try {
      const success = await performSave(
        selectedUser, 
        filenameWithTimestamp, 
        undefined, // no admin comment
        { 
          isSubmitted: true, 
          studentComment: studentComment,
        }
      );
      
      if (success) {
        alert(`Work submitted successfully as "${filenameWithTimestamp}"!${studentComment ? ' Your note has been included.' : ''}`);
        window.location.reload();
      }
    } catch (err) {
      console.error('Error submitting work:', err);
      alert('Failed to submit work: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setPendingSubmitData(null);
    }
  };

  // Handle student viewing notifications
  const handleViewNotifications = () => {
    window.location.href = '/notifications';
  };

  // Handle admin viewing notifications (submissions)
  function handleAdminViewNotifications() {
    window.location.href = '/admin-tools/submissions';
  }

  const handleDeleteSavedHtml = async (folderName: string) => {
    if (!selectedUser) {
      alert('Please select your name first before deleting saved work.');
      return;
    }
    
    const confirmDelete = window.confirm(`Are you sure you want to delete "${folderName}"? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }
    
    console.log('Deleting saved HTML for user:', selectedUser, 'from folder:', folderName);
    
    try {
      await deleteUserHtmlByName(selectedUser, folderName);
      console.log('Successfully deleted saved HTML');
      
      // Refresh the entire app to ensure everything is in sync
      window.location.reload();
      
      alert('File deleted successfully!');
      
    } catch (err) {
      console.error('Error deleting saved HTML:', err);
      alert('Failed to delete saved HTML: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Function to enhance A-Frame content for VR compatibility
  const enhanceAFrameForVR = (htmlContent: string): string => {
    // Check if this is A-Frame content
    const isAframeContent = htmlContent.includes('a-scene') || htmlContent.includes('aframe');
    
    if (!isAframeContent) {
      return htmlContent;
    }

    // Enhanced 3D script for VR compatibility
    const enhanced3DScript = `
      <script>
        // Enhanced 3D Content Script with VR rendering fixes
        document.addEventListener('DOMContentLoaded', function() {
          const scene = document.querySelector('a-scene');
          if (!scene) return;
          
          // Force WebGL context initialization
          const canvas = scene.canvas;
          if (canvas) {
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
              console.log('WebGL context initialized successfully');
              // Enable depth testing and other essential WebGL features
              gl.enable(gl.DEPTH_TEST);
              gl.enable(gl.CULL_FACE);
              gl.depthFunc(gl.LEQUAL);
            } else {
              console.error('WebGL not supported');
            }
          }
          
          // Wait for scene to load
          scene.addEventListener('loaded', function() {
            console.log('A-Frame scene loaded with VR enhancements');
            
            // Force renderer initialization
            const renderer = scene.renderer;
            if (renderer) {
              console.log('Renderer initialized');
              // Ensure proper rendering settings
              renderer.setSize(window.innerWidth, window.innerHeight);
              renderer.setPixelRatio(window.devicePixelRatio);
            }
            
            // Force camera initialization
            const camera = scene.camera;
            if (camera) {
              console.log('Camera initialized');
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
            }
            
            // Add VR-specific optimizations
            if (scene.hasLoaded) {
              // Enable VR mode optimizations
              if (scene.is('vr-mode')) {
                console.log('VR mode detected, applying optimizations');
              }
            }
            
            // Force a render to ensure 3D content is displayed
            setTimeout(() => {
              if (scene.render) {
                scene.render();
                console.log('Forced scene render');
              }
            }, 100);
          });
          
          // Add WebXR support detection and initialization
          if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then(supported => {
              if (supported) {
                console.log('WebXR VR supported');
                // Add VR-specific enhancements
                scene.setAttribute('webxr', '');
              }
            });
          }
          
          // Handle window resize for proper rendering
          window.addEventListener('resize', function() {
            if (scene.camera && scene.renderer) {
              scene.camera.aspect = window.innerWidth / window.innerHeight;
              scene.camera.updateProjectionMatrix();
              scene.renderer.setSize(window.innerWidth, window.innerHeight);
            }
          });
          
          // Force initial render after a short delay
          setTimeout(() => {
            if (scene.render) {
              scene.render();
              console.log('Initial forced render completed');
            }
          }, 500);
        });
        
        // Enhanced components registration
        if (typeof AFRAME !== 'undefined') {
          // Scene optimizer component with rendering fixes
          AFRAME.registerComponent('scene-optimizer', {
            init: function() {
              this.el.setAttribute('renderer', 'antialias: true; colorManagement: true; sortObjects: true; alpha: false; precision: high');
              this.el.setAttribute('webxr', '');
              
              // Force renderer initialization
              const self = this;
              setTimeout(() => {
                const renderer = self.el.renderer;
                if (renderer) {
                  renderer.setClearColor('#000000', 1.0);
                  renderer.shadowMap.enabled = true;
                  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                  console.log('Scene optimizer: Renderer enhanced');
                }
              }, 100);
            }
          });
          
          // Enhanced camera controls with proper initialization
          AFRAME.registerComponent('enhanced-camera-controls', {
            init: function() {
              this.el.setAttribute('camera', 'active: true; fov: 80; near: 0.1; far: 1000');
              this.el.setAttribute('look-controls', 'enabled: true; pointerLockEnabled: true');
              this.el.setAttribute('wasd-controls', 'enabled: true; acceleration: 65; fly: false');
              
              // Ensure camera is properly positioned
              const self = this;
              setTimeout(() => {
                const camera = self.el.getObject3D('camera');
                if (camera) {
                  camera.position.set(0, 1.6, 0);
                  console.log('Enhanced camera controls: Camera positioned');
                }
              }, 100);
            }
          });
          
          // Enhanced model handler with rendering fixes
          AFRAME.registerComponent('enhanced-model-handler', {
            init: function() {
              this.el.addEventListener('model-loaded', function() {
                console.log('3D model loaded successfully');
                // Force scene render after model loads
                const scene = this.sceneEl;
                if (scene && scene.render) {
                  setTimeout(() => scene.render(), 50);
                }
              });
              this.el.addEventListener('model-error', function() {
                console.error('3D model failed to load');
              });
            }
          });
          
          // Add a component to force proper 3D rendering
          AFRAME.registerComponent('force-3d-render', {
            init: function() {
              const self = this;
              const scene = this.el.sceneEl;
              
              // Force render every frame for the first few seconds
              let renderCount = 0;
              const maxRenders = 300; // 5 seconds at 60fps
              
              const forceRender = () => {
                if (renderCount < maxRenders && scene && scene.render) {
                  scene.render();
                  renderCount++;
                  requestAnimationFrame(forceRender);
                }
              };
              
              // Start forced rendering after scene loads
              scene.addEventListener('loaded', () => {
                setTimeout(forceRender, 100);
              });
            }
          });
        }
      </script>
    `;
    htmlContent = htmlContent.replace('</head>', `${enhanced3DScript}</head>`);

    // Enhanced CSS for VR compatibility
    const enhanced3DCSS = `
      <style>
        /* Enhanced VR Compatibility Styling */
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        /* VR button styling for better visibility */
        .a-enter-vr {
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
          background: #4CAF50 !important;
          color: white !important;
          border: none !important;
          padding: 12px 24px !important;
          border-radius: 8px !important;
          font-size: 16px !important;
          font-weight: bold !important;
          cursor: pointer !important;
          z-index: 1000 !important;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
          transition: all 0.3s ease !important;
        }
        
        .a-enter-vr:hover {
          background: #45a049 !important;
          transform: scale(1.05) !important;
        }
        
        /* Performance optimizations for VR */
        a-scene {
          antialias: true !important;
          colorManagement: true !important;
          sortObjects: true !important;
          background: #000000 !important;
          canvas {
            display: block !important;
            width: 100% !important;
            height: 100% !important;
          }
        }
        
        /* Ensure proper 3D rendering context */
        canvas {
          display: block !important;
          width: 100vw !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 1 !important;
        }
        
        /* Better model shadows for VR */
        [gltf-model], [obj-model], [collada-model] {
          cast-shadow: true !important;
          receive-shadow: true !important;
        }
        
        /* Loading indicator for 3D models */
        .model-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 20px;
          border-radius: 10px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .model-loading .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Error state styling */
        .model-error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(220, 53, 69, 0.9);
          color: white;
          padding: 20px;
          border-radius: 10px;
          z-index: 1000;
          text-align: center;
          max-width: 300px;
        }
      </style>
    `;
    htmlContent = htmlContent.replace('</head>', `${enhanced3DCSS}</head>`);

    // Add enhanced components to scene and camera
    htmlContent = htmlContent.replace(/<a-scene/g, '<a-scene scene-optimizer force-3d-render');
    htmlContent = htmlContent.replace(/<a-entity[^>]*camera[^>]*/g, '$& enhanced-camera-controls');
    htmlContent = htmlContent.replace(/<a-entity[^>]*gltf-model[^>]*/g, '$& enhanced-model-handler');
    htmlContent = htmlContent.replace(/<a-entity[^>]*obj-model[^>]*/g, '$& enhanced-model-handler');
    htmlContent = htmlContent.replace(/<a-entity[^>]*collada-model[^>]*/g, '$& enhanced-model-handler');
    
    // Add crossorigin to all model sources
    htmlContent = htmlContent.replace(/gltf-model="([^"]+)"/g, 'gltf-model="$1" crossorigin="anonymous"');
    htmlContent = htmlContent.replace(/gltf-model='([^']+)'/g, "gltf-model='$1' crossorigin='anonymous'");
    htmlContent = htmlContent.replace(/obj-model="([^"]+)"/g, 'obj-model="$1" crossorigin="anonymous"');
    htmlContent = htmlContent.replace(/obj-model='([^']+)'/g, "obj-model='$1' crossorigin='anonymous'");
    htmlContent = htmlContent.replace(/collada-model="([^"]+)"/g, 'collada-model="$1" crossorigin="anonymous"');
    htmlContent = htmlContent.replace(/collada-model='([^']+)'/g, "collada-model='$1' crossorigin='anonymous'");
    
    // Add crossorigin to all external resources
    htmlContent = htmlContent.replace(/<(img|audio|script|a-asset-item)/g, '<$1 crossorigin="anonymous"');
    
    // Add timeout to a-assets if present
    htmlContent = htmlContent.replace(/<a-assets/g, '<a-assets timeout="30000"');
    
    // Add WebXR support
    htmlContent = htmlContent.replace(/<a-scene/g, '<a-scene webxr');
    
    return htmlContent;
  };

  const handleExportLocalSite = async () => {
    if (!project || !project.files || project.files.length === 0) {
      alert('No project to export. Please create some content first.');
      return;
    }

    try {
      const zip = new JSZip();
      
      // Create a folder for the project
      const projectFolder = zip.folder(project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()) || zip;
      
      // Collect all external assets (URLs) from the project files
      const externalAssets = new Set<string>();
      
      // Function to extract URLs from content
      const extractUrls = (content: string) => {
        // Match various URL patterns
        const urlPatterns = [
          /https?:\/\/[^\s"']+/g, // General HTTP/HTTPS URLs
          /src=["']([^"']+)["']/g, // src attributes
          /href=["']([^"']+)["']/g, // href attributes
          /url\(['"]?([^'")\s]+)['"]?\)/g, // CSS url() functions
        ];
        
        const urls = new Set<string>();
        
        urlPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Extract URL from different match formats
              let url = match;
              if (match.includes('src=') || match.includes('href=')) {
                const urlMatch = match.match(/["']([^"']+)["']/);
                if (urlMatch) url = urlMatch[1];
              } else if (match.includes('url(')) {
                const urlMatch = match.match(/url\(['"]?([^'")\s]+)['"]?\)/);
                if (urlMatch) url = urlMatch[1];
              }
              
              // Only include external URLs (not relative paths)
              if (url.startsWith('http://') || url.startsWith('https://')) {
                urls.add(url);
              }
            });
          }
        });
        
        return Array.from(urls);
      };
      
      // Scan all files for external assets
      for (const file of project.files) {
        if (file.content && file.content.trim()) {
          const urls = extractUrls(file.content);
          urls.forEach(url => externalAssets.add(url));
        }
      }
      
      // Add each file to the zip with VR enhancements for HTML files
      for (const file of project.files) {
        if (file.content && file.content.trim()) {
          let content = file.content;
          
          // Apply VR enhancements to HTML files
          if (file.name.toLowerCase().endsWith('.html')) {
            content = enhanceAFrameForVR(content);
          }
          
          projectFolder.file(file.name, content);
        }
      }
      
      // Create assets.txt file
      if (externalAssets.size > 0) {
        let assetsContent = 'Assets in This Package:\n\n';
        
        // Convert Set to Array and sort for consistent output
        const sortedAssets = Array.from(externalAssets).sort();
        
        sortedAssets.forEach(url => {
          // Extract filename from URL
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1] || 'unknown-file';
          
          assetsContent += `File Name: ${fileName}\n`;
          assetsContent += `URL: ${url}\n\n`;
        });
        
        projectFolder.file('assets.txt', assetsContent);
      }
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-local-site.zip`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      const assetCount = externalAssets.size;
      const assetMessage = assetCount > 0 
        ? ` with ${assetCount} external asset${assetCount === 1 ? '' : 's'} listed in assets.txt`
        : '';
      
      // Check if this is an A-Frame project
      const isAframeProject = project.files.some(file => 
        file.name.toLowerCase().endsWith('.html') && 
        (file.content.includes('a-scene') || file.content.includes('aframe'))
      );
      
      const vrMessage = isAframeProject 
        ? ' A-Frame projects have been enhanced with VR compatibility for Meta Quest and other VR headsets.'
        : '';
      
      alert(`Successfully exported "${project.name}" as a local site!${assetMessage}${vrMessage} The ZIP file contains all your project files.`);
      
    } catch (err) {
      console.error('Error exporting local site:', err);
      alert('Failed to export local site: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };



  const handleDeleteTemplate = async (template: any) => {
    if (!selectedUser) {
      alert('Please sign in as admin to delete templates.');
      return;
    }
    const isAdmin = selectedUser === 'admin';
    const isCreator = template.creator_id === selectedUser;
    if (!isAdmin && !isCreator) {
      alert('You do not have permission to delete this template.');
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;
    try {
      const result = await deleteTemplateFromStorage(template.id);
      
      if (result.success) {
        alert('Template deleted successfully!');
        // Refresh the entire app to ensure everything is in sync
        window.location.reload();
      } else {
        console.error('Delete failed:', result.error);
        alert('Failed to delete template: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleRenameTemplate = async (template: any, newName: string) => {
    if (!selectedUser) {
      alert('Please sign in as admin to rename templates.');
      return;
    }
    const isAdmin = selectedUser === 'admin';
    const isCreator = template.creator_id === selectedUser;
    if (!isAdmin && !isCreator) {
      alert('You do not have permission to rename this template.');
      return;
    }
    
    if (!newName || newName.trim() === '') {
      alert('Please enter a valid template name.');
      return;
    }
    
    if (newName === template.name) {
      return; // No change needed
    }
    
    try {
      console.log('=== RENAMING TEMPLATE ===');
      console.log('Template:', template);
      console.log('Old ID:', template.id);
      console.log('New name:', newName);
      
      const result = await renameTemplateInStorage(template.id, newName);
      console.log('Rename result:', result);
      
      if (result.success) {
        console.log('Template renamed successfully, triggering refresh...');
        alert('Template renamed successfully!');
        // Refresh the entire app to ensure everything is in sync
        window.location.reload();
      } else {
        console.error('Rename failed:', result.error);
        alert('Failed to rename template: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error renaming template:', err);
      alert('Failed to rename template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const onUserSelect = async (userName: string) => {
    setSelectedUser(userName);
    if (userName) {
      localStorage.setItem('selected-user', userName);
    } else {
      localStorage.removeItem('selected-user');
    }
    
    // Only load default template if:
    // 1. No saved project exists AND current project is the minimalTemplate (welcome message)
    // 2. This is a different user than before AND current project is the minimalTemplate
    const savedProject = localStorage.getItem('current-project');
    const previousUser = localStorage.getItem('selected-user');
    
    const shouldLoadDefault = (project && project.name === 'Basic HTML Project') && 
                             (!savedProject || (previousUser && previousUser !== userName));
    
    console.log('onUserSelect - shouldLoadDefault:', shouldLoadDefault, 'project name:', project?.name);
    
    if (shouldLoadDefault) {
      try {
        const { data: defaultTemplate } = await getDefaultTemplate();
        if (defaultTemplate) {
          console.log('Loading default template for user:', defaultTemplate);
          const { data: templateData, error } = await loadTemplateFromStorage(defaultTemplate.template_id);
          if (templateData && !error) {
            const projectTemplate: Project = {
              name: templateData.name,
              framework: templateData.framework as Framework,
              files: templateData.files.map(file => ({
                ...file,
                type: file.type as any
              }))
            };
            setProject(projectTemplate);
            setActiveFileId('index.html');
            localStorage.setItem('current-project', JSON.stringify(projectTemplate));
            setPreviewKey(prev => prev + 1);
            console.log('Default template loaded successfully for user');
          }
        } else {
          console.log('No default template found in database');
        }
      } catch (error) {
        console.error('Error loading default template:', error);
      }
    } else {
      console.log('Keeping existing project, not loading default template');
    }
  };


  // Listen for hotspot template data from the bridge
  useEffect(() => {
    const handleHotspotTemplateMessage = (event: MessageEvent) => {
      if (event.data.type === 'HOTSPOT_TEMPLATE_SAVED') {
        console.log('Received hotspot template data:', event.data);
        
        const { template, rawData } = event.data.data;
        
        // Convert the template data to a WebXRide Project format
        const hotspotProject: Project = {
          name: template.name,
          framework: Framework.AFRAME,
          files: template.files.map((file: any) => ({
            id: file.name,
            name: file.name,
            type: file.type === 'html' ? FileType.HTML : 
                  file.type === 'javascript' ? FileType.JS : 
                  file.type === 'css' ? FileType.CSS : FileType.CUSTOM,
            content: file.content
          }))
        };
        
        console.log('Converted to WebXRide project:', hotspotProject);
        
        // Load the hotspot project into the editor
        loadTemplate(hotspotProject);
        
        // Show a success message
        console.log('Successfully loaded hotspot project into WebXRide editor');
        alert(`360° Tour "${template.name}" has been created and loaded into the editor! You can now customize it further.`);
      }
    };

    window.addEventListener('message', handleHotspotTemplateMessage);
    return () => {
      window.removeEventListener('message', handleHotspotTemplateMessage);
    };
  }, [loadTemplate]);

  // Listen for 360° hotspot tour projects from the enhanced hotspot editor
  useEffect(() => {
    const handle360HotspotProjectMessage = async (event: MessageEvent) => {
      if (event.data.type === 'webxride-template-save') {
        console.log('Received 360° hotspot tour project data:', event.data);
        
        const templateData = event.data.data;
        
        // Check if user is selected
        if (!selectedUser) {
          alert('Please select your name first before saving to WebXRide.');
          return;
        }
        
        try {
          // Convert the template data to the format expected by saveUserHtmlByName
          const projectFiles = [
            {
              name: 'index.html',
              content: templateData.html,
              type: 'html'
            },
            {
              name: 'script.js',
              content: templateData.js,
              type: 'javascript'
            },
            {
              name: 'style.css',
              content: templateData.css,
              type: 'css'
            }
          ];

          // Create a project name with timestamp to avoid conflicts
          const projectName = `${templateData.name}-360tour`;
          
          console.log('Saving 360° hotspot tour project to user account:', { selectedUser, projectName });
          
          // Save the project to the user's Saved Work list
          const { data, error } = await saveUserHtmlByName(selectedUser, projectFiles, projectName);
          
          if (error) {
            console.error('Error saving 360° hotspot tour project:', error);
            alert(`Error saving project: ${(error as Error).message}`);
            return;
          }

          // Show success message
          const successMessage = `360° Tour "${templateData.name}" successfully saved to your Saved Work!\n\nDetails:\n• ${templateData.description}\n• ${templateData.metadata?.sceneCount || 'Unknown'} scenes\n• ${templateData.tourData?.totalHotspots || 0} hotspots\n• Type: ${templateData.metadata?.type || '360° Interactive Tour'}\n\nYour project is now loaded in the editor for further customization!`;
          alert(successMessage);
          
          console.log('Successfully saved 360° hotspot tour project to user account:', data);
          
          // Automatically load the project into the WebXRide editor
          const projectForEditor: Project = {
            name: templateData.name,
            framework: Framework.AFRAME,
            files: [
              {
                id: crypto.randomUUID(),
                name: 'index.html',
                type: FileType.HTML,
                content: templateData.html
              },
              {
                id: crypto.randomUUID(),
                name: 'script.js',
                type: FileType.JS,
                content: templateData.js
              },
              {
                id: crypto.randomUUID(),
                name: 'style.css',
                type: FileType.CSS,
                content: templateData.css
              }
            ]
          };
          
          // Set the project in the editor
          setProject(projectForEditor);
          setActiveFileId(projectForEditor.files[0].id); // Set HTML as active file
          
          console.log('360° tour project automatically loaded into WebXRide editor:', projectForEditor);
          
        } catch (error) {
          console.error('Error processing 360° hotspot tour project:', error);
          alert(`Error processing project: ${(error as Error).message}`);
        }
      }
    };

    window.addEventListener('message', handle360HotspotProjectMessage);
    return () => {
      window.removeEventListener('message', handle360HotspotProjectMessage);
    };
  }, [selectedUser]);

  return (
    <>
      <SaveTemplateDialog
        isOpen={showSaveTemplateDialog}
        onClose={() => setShowSaveTemplateDialog(false)}
        onSave={handleSaveTemplateWithOptions}
        currentTemplateName={project.name}
        selectedUser={selectedUser}
        isAdmin={selectedUser === 'admin'}
      />
      <AdminSaveDialog
        isOpen={showAdminSaveDialog}
        onClose={() => {
          setShowAdminSaveDialog(false);
          setPendingSaveData(null);
        }}
        onSave={handleAdminSaveChoice}
        studentName={projectOwner || 'Student'}
        adminName={selectedUser || 'Admin'}
      />
      
      <StudentSubmitDialog
        isOpen={showStudentSubmitDialog}
        onClose={() => {
          setShowStudentSubmitDialog(false);
          setPendingSubmitData(null);
        }}
        onSubmit={handleStudentSubmitChoice}
        studentName={selectedUser || 'Student'}
      />
      
      {/* Show admin comment if present and user is a student (or admin is impersonating) */}
      {projectMetadata?.adminComment && selectedUser !== 'admin' && (
        <AdminCommentViewer
          comment={projectMetadata.adminComment}
          commentDate={projectMetadata.commentDate}
          onDismiss={() => setProjectMetadata(null)}
        />
      )}
      
      <Routes>
        <Route path="/about" element={
          <AboutPageComponent 
            isAdmin={selectedUser === 'admin'}
            onEdit={() => window.location.href = '/about/edit'}
          />
        } />
        <Route path="/about/edit" element={
          <AdminPasswordGate>
            <AboutPageEditor
              onBack={() => window.location.href = '/about'}
              onSave={() => window.location.href = '/about'}
              currentUser={selectedUser || 'admin'}
            />
          </AdminPasswordGate>
        } />
        <Route path="/admin-tools" element={
          <AdminPasswordGate>
            <AdminTools
              project={project}
              setProject={setProject}
              activeFileId={activeFileId}
              setActiveFileId={setActiveFileId}
              previewKey={previewKey}
              setPreviewKey={setPreviewKey}
              splitPosition={splitPosition}
              setSplitPosition={setSplitPosition}
              showPreview={showPreview}
              setShowPreview={setShowPreview}
              isPreviewExternal={isPreviewExternal}
              setIsPreviewExternal={setIsPreviewExternal}
              user={selectedUser}
              saveProject={handleSaveProject}
              loadProject={handleLoadProject}
              templates={templates}
              setTemplates={setTemplates}
              updateFile={updateFile}
              handleChangeFile={handleChangeFile}
              refreshPreview={refreshPreview}
              loadTemplate={loadTemplate}
              handleSaveProject={handleSaveProject}
              handleLoadProject={handleLoadProject}
              handleLoadHtmlDraft={handleLoadHtmlDraft}
              activeFile={activeFile}
              togglePreview={togglePreview}
              handleCopyCode={handleCopyCode}
              handleSaveTemplate={handleSaveTemplate}
              handleSaveHtml={handleSaveHtml}
              handleSubmitToTeacher={handleSubmitToTeacher}
              handleLoadSavedHtml={handleLoadSavedHtml}
              handleDeleteSavedHtml={handleDeleteSavedHtml}
              handleDeleteTemplate={handleDeleteTemplate}
              handleRenameTemplate={handleRenameTemplate}
              selectedUser={selectedUser}
              onUserSelect={onUserSelect}
              isAdmin={true}
              handleAddFile={handleAddFile}
              showAdminPanel={showAdminPanel}
              setShowAdminPanel={setShowAdminPanel}
              showStartersPanel={showStartersPanel}
              setShowStartersPanel={setShowStartersPanel}
              showSaveTemplateButton={true}
              handleExportLocalSite={handleExportLocalSite}
              rideyEnabled={rideyEnabled}
              handleRideyToggle={handleRideyToggle}
              aframeInspectorEnabled={aframeInspectorEnabled}
              handleAframeInspectorToggle={handleAframeInspectorToggle}
              setSplitToEditor={setSplitToEditor}
              setSplitToEven={setSplitToEven}
              setSplitToPreview={setSplitToPreview}
              projectOwner={projectOwner}
            />
          </AdminPasswordGate>
        } />
        <Route path="/admin-tools/myfiles" element={
          <AdminPasswordGate>
            <AdminFilesView
              selectedUser={selectedUser}
              onBack={() => window.location.href = '/admin-tools'}
              onUserSelect={onUserSelect}
            />
          </AdminPasswordGate>
        } />
        <Route path="/admin-tools/submissions" element={
          <AdminPasswordGate>
            <SubmissionsInbox
              onBack={() => window.location.href = '/admin-tools'}
              onOpenSubmission={(userName, folderName) => {
                // Store the submission info and navigate back to editor
                sessionStorage.setItem('loadProject', JSON.stringify({ user: userName, projectName: folderName }));
                window.location.href = '/admin-tools';
              }}
            />
          </AdminPasswordGate>
        } />
        <Route path="/notifications" element={
          <StudentNotificationInbox
            onBack={() => window.location.href = '/'}
            onOpenProject={(projectName) => {
              sessionStorage.setItem('loadProject', JSON.stringify({ user: selectedUser, projectName: projectName }));
              window.location.href = '/';
            }}
            studentName={selectedUser || 'student'}
          />
        } />
        <Route path="/myfiles" element={
          <SimpleAuthGate onUserSelect={onUserSelect}>
            <StudentFilesView
              selectedUser={selectedUser}
              onBack={() => window.location.href = '/'}
              onUserSelect={onUserSelect}
            />
          </SimpleAuthGate>
        } />
        <Route path="/*" element={
          <SimpleAuthGate onUserSelect={onUserSelect}>
            <MainApp
              project={project}
              setProject={setProject}
              activeFileId={activeFileId}
              setActiveFileId={setActiveFileId}
              previewKey={previewKey}
              setPreviewKey={setPreviewKey}
              splitPosition={splitPosition}
              setSplitPosition={setSplitPosition}
              showPreview={showPreview}
              setShowPreview={setShowPreview}
              isPreviewExternal={isPreviewExternal}
              setIsPreviewExternal={setIsPreviewExternal}
              user={selectedUser}
              saveProject={handleSaveProject}
              loadProject={handleLoadProject}
              templates={templates}
              setTemplates={setTemplates}
              updateFile={updateFile}
              handleChangeFile={handleChangeFile}
              refreshPreview={refreshPreview}
              loadTemplate={loadTemplate}
              handleSaveProject={handleSaveProject}
              handleLoadProject={handleLoadProject}
              handleLoadHtmlDraft={handleLoadHtmlDraft}
              activeFile={activeFile}
              togglePreview={togglePreview}
              handleCopyCode={handleCopyCode}
              showSaveTemplateButton={false}
              handleSaveHtml={handleSaveHtml}
              handleSubmitToTeacher={handleSubmitToTeacher}
              handleViewNotifications={selectedUser === 'admin' ? handleAdminViewNotifications : handleViewNotifications}
              handleLoadSavedHtml={handleLoadSavedHtml}
              handleDeleteSavedHtml={handleDeleteSavedHtml}
              handleDeleteTemplate={handleDeleteTemplate}
              handleRenameTemplate={handleRenameTemplate}
              selectedUser={selectedUser}
              onUserSelect={onUserSelect}
              isAdmin={selectedUser === 'admin'}
              handleAddFile={handleAddFile}
              handleExportLocalSite={handleExportLocalSite}
              refreshTemplates={refreshTemplates}
              setRefreshTemplatesRef={setRefreshTemplatesRef}
              rideyEnabled={rideyEnabled}
              aframeInspectorEnabled={aframeInspectorEnabled}
              handleAframeInspectorToggle={handleAframeInspectorToggle}
              setSplitToEditor={setSplitToEditor}
              setSplitToEven={setSplitToEven}
              setSplitToPreview={setSplitToPreview}
              projectOwner={projectOwner}
            />
          </SimpleAuthGate>
        } />
      </Routes>
    </>
  );
}

export default App;