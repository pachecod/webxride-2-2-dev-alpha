import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home, Play, Save, Settings, Maximize2, Minimize2, X, ExternalLink, Edit3 } from 'lucide-react';
import JSZip from 'jszip';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FileTabs from './components/FileTabs';
import { StudentManagement } from './components/StudentManagement';
import { ClassManagement } from './components/ClassManagement';
import { SaveTemplateDialog } from './components/SaveTemplateDialog';
import { AboutPageComponent } from './components/AboutPage';
import { AboutPageEditor } from './components/AboutPageEditor';
import { AboutPageManagement } from './components/AboutPageManagement';
import { StudentFilesView } from './components/StudentFilesView';
import { AdminFilesView } from './components/AdminFilesView';
import { FileType, Project, File, Framework } from './types';
import { supabase, getProject, saveTemplateToStorage, saveUserHtmlByName, loadUserHtmlByName, deleteUserHtmlByName, setDefaultTemplate, getDefaultTemplate, loadTemplateFromStorage, findTemplateByName, updateUserHtmlByName, deleteTemplateFromStorage } from './lib/supabase';
import { AdminPasswordGate } from './components/AdminPasswordGate';
import { StudentPasswordGate } from './components/StudentPasswordGate';
import { loadStartersData, loadTemplateFromPublicPath } from './lib/template-loader';
import { createAFrameInspectorHTML } from './lib/aframe-inspector-utils';
import { SnippetsManagement } from './components/SnippetsManagement';

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
  isDragging, 
  setIsDragging, 
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
  handleMouseDown, 
  handleMouseUp, 
  handleMouseMove, 
  handleCopyCode, 
  handleSaveTemplate, 
  handleSaveHtml, 
  handleLoadSavedHtml, 
  handleDeleteSavedHtml, 
  handleDeleteTemplate, 
  selectedUser, 
  onUserSelect, 
  isAdmin, 
  handleAddFile, 
  showAdminPanel, 
  setShowAdminPanel,
  showSaveTemplateButton
}: any) {
  const [refreshTemplatesRef, setRefreshTemplatesRef] = useState<(() => void) | null>(null);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showAboutPage, setShowAboutPage] = useState(false);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showStartersPanel, setShowStartersPanel] = useState(false);

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
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onLoadTemplate={loadTemplate}
          templates={templates}
          projects={[]}
          onLoadProject={handleLoadProject}
          onLoadHtmlDraft={handleLoadHtmlDraft}
          refreshTemplates={setRefreshFunction}
          onLoadSavedHtml={handleLoadSavedHtml}
          onDeleteSavedHtml={handleDeleteSavedHtml}
          onFileSelect={(file) => {
            console.log('File selected:', file);
            // This could be used for additional file selection logic if needed
          }}
          onDeleteTemplate={handleDeleteTemplate}
          selectedUser={selectedUser}
          isAdmin={true}
          onUserSelect={onUserSelect}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <FileTabs 
            files={project.files}
            activeFileId={activeFileId}
            onChangeFile={handleChangeFile}
            onAddFile={handleAddFile}
            onNewTemplate={() => setShowNewTemplateDialog(true)}
          />
          <div 
            className="flex flex-1 overflow-hidden relative"
            onMouseMove={handleMouseMove}
          >
            <div 
              className="h-full overflow-hidden transition-[width] duration-300 ease-in-out relative"
              style={{ width: showPreview ? `${splitPosition}%` : '100%' }}
            >
              <div className="absolute top-2 right-2 z-10 flex gap-2">
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
                showInspectorButton={isAframeContent()}
                onOpenInspector={handleOpenInspector}
              />
            </div>
            <div 
              className="w-2 bg-gray-800 hover:bg-blue-500 transition-colors cursor-col-resize"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            />
            <div 
              className="h-full overflow-hidden transition-[width] duration-300 ease-in-out"
              style={{ width: showPreview ? `${100 - splitPosition}%` : '0%' }}
            >
              <Preview 
                key={previewKey}
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
              />
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
              
              {/* Admin Panel Navigation */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => { setShowClassManagement(false); setShowSnippets(false); setShowAboutPage(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    !showClassManagement && !showSnippets && !showAboutPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Manage Settings
                </button>
                <button
                  onClick={() => { setShowClassManagement(true); setShowSnippets(false); setShowAboutPage(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    showClassManagement
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Classes
                </button>
                <button
                  onClick={() => { setShowSnippets(true); setShowClassManagement(false); setShowAboutPage(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    showSnippets
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Snippets
                </button>
                <button
                  onClick={() => { setShowAboutPage(true); setShowClassManagement(false); setShowSnippets(false); }}
                  className={`px-3 py-2 rounded text-sm transition-colors flex-shrink-0 ${
                    showAboutPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  About Page
                </button>
              </div>

              
              <div className="space-y-6">
                {/* Student Management */}
                {!showClassManagement && !showSnippets && !showAboutPage && <StudentManagement />}
                
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
  project, setProject, activeFileId, setActiveFileId, previewKey, setPreviewKey, splitPosition, setSplitPosition, isDragging, setIsDragging, showPreview, setShowPreview, isPreviewExternal, setIsPreviewExternal, user, saveProject, loadProject, templates, setTemplates, updateFile, handleChangeFile, refreshPreview, loadTemplate, handleSaveProject, handleLoadProject, handleLoadHtmlDraft, activeFile, togglePreview, handleMouseDown, handleMouseUp, handleMouseMove, handleCopyCode, showSaveTemplateButton, handleSaveTemplate, handleSaveHtml, handleLoadSavedHtml, handleDeleteSavedHtml, handleDeleteTemplate, selectedUser, onUserSelect, isAdmin, handleAddFile, handleExportLocalSite
}: any) {
  const [refreshTemplatesRef, setRefreshTemplatesRef] = useState<(() => void) | null>(null);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);

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
        onExportLocalSite={handleExportLocalSite}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onLoadTemplate={loadTemplate}
          templates={templates}
          projects={[]}
          onLoadProject={handleLoadProject}
          onLoadHtmlDraft={handleLoadHtmlDraft}
          refreshTemplates={setRefreshFunction}
          onLoadSavedHtml={handleLoadSavedHtml}
          onDeleteSavedHtml={handleDeleteSavedHtml}
          onFileSelect={(file) => {
            console.log('File selected:', file);
            // This could be used for additional file selection logic if needed
          }}
          onDeleteTemplate={handleDeleteTemplate}
          selectedUser={selectedUser}
          isAdmin={isAdmin}
          onUserSelect={onUserSelect}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <FileTabs 
            files={project.files}
            activeFileId={activeFileId}
            onChangeFile={handleChangeFile}
            onAddFile={handleAddFile}
            onNewTemplate={() => setShowNewTemplateDialog(true)}
          />
          <div 
            className="flex flex-1 overflow-hidden relative"
            onMouseMove={handleMouseMove}
          >
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
                showInspectorButton={isAframeContent()}
                onOpenInspector={handleOpenInspectorMain}
              />
            </div>
            <div 
              className="w-2 bg-gray-800 hover:bg-blue-500 transition-colors cursor-col-resize"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            />
            <div 
              className="h-full overflow-hidden transition-[width] duration-300 ease-in-out"
              style={{ width: showPreview ? `${100 - splitPosition}%` : '0%' }}
            >
              <Preview 
                key={previewKey}
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
              />
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
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewExternal, setIsPreviewExternal] = useState(false);
  const [templates, setTemplates] = useState<Project[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(() => {
    // Load saved user from localStorage on component mount
    const savedUser = localStorage.getItem('selected-user');
    return savedUser || null;
  });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);


  // Save selectedUser to localStorage whenever it changes
  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('selected-user', selectedUser);
    } else {
      localStorage.removeItem('selected-user');
    }
  }, [selectedUser]);

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
      
      // Refresh the saved HTML list in the sidebar
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

  const handleMouseDown = () => {
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const container = e.currentTarget as HTMLDivElement;
    const containerRect = container.getBoundingClientRect();
    const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setSplitPosition(Math.max(20, Math.min(80, newPosition)));
  };

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
    
    console.log('Saving HTML to cloud for user:', selectedUser);
    
    try {
      const result = await saveUserHtmlByName(selectedUser, project.files, filenameWithTimestamp);
      console.log('Save result:', result);
      
      if (result.error) {
        console.error('Save failed:', result.error);
        alert('Failed to save HTML: ' + (result.error instanceof Error ? result.error.message : 'Unknown error'));
        return;
      }
      
      console.log('Save completed successfully:', result.data);
      alert(`HTML saved successfully as "${filenameWithTimestamp}"!`);
      
      // Refresh the saved HTML list in the sidebar
      window.location.reload();
      
    } catch (err) {
      console.error('Error saving HTML:', err);
      alert('Failed to save HTML: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleLoadSavedHtml = async (folderName: string) => {
    if (!selectedUser) {
      alert('Please select your name first before loading saved work.');
      return;
    }
    
    console.log('Loading saved HTML for user:', selectedUser, 'from folder:', folderName);
    
    try {
      // Pass a cache-busting timestamp to ensure fresh data
      const cacheBust = Date.now();
      const loadedFiles = await loadUserHtmlByName(selectedUser, folderName, cacheBust);
      console.log('Loaded files:', loadedFiles);
      
      if (loadedFiles.length === 0) {
        alert('No files found in the saved project');
        return;
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
      
      // Refresh the saved HTML list in the sidebar
      window.location.reload();
      
      alert('File deleted successfully!');
      
    } catch (err) {
      console.error('Error deleting saved HTML:', err);
      alert('Failed to delete saved HTML: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
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
      
      // Add each file to the zip
      for (const file of project.files) {
        if (file.content && file.content.trim()) {
          projectFolder.file(file.name, file.content);
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
      
      alert(`Successfully exported "${project.name}" as a local site!${assetMessage} The ZIP file contains all your project files.`);
      
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
      console.log('Deleting template:', template);
      console.log('Template ID:', template.id);
      const result = await deleteTemplateFromStorage(template.id);
      if (result.success) {
        alert('Template deleted successfully!');
        // Refresh template list
        window.location.reload();
      } else {
        alert('Failed to delete template: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const onUserSelect = async (userName: string) => {
    setSelectedUser(userName);
    localStorage.setItem('selected-user', userName);
    
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

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = 'default';
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

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
              isDragging={isDragging}
              setIsDragging={setIsDragging}
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
              handleMouseDown={handleMouseDown}
              handleMouseUp={handleMouseUp}
              handleMouseMove={handleMouseMove}
              handleCopyCode={handleCopyCode}
              handleSaveTemplate={handleSaveTemplate}
              handleSaveHtml={handleSaveHtml}
              handleLoadSavedHtml={handleLoadSavedHtml}
              handleDeleteSavedHtml={handleDeleteSavedHtml}
              handleDeleteTemplate={handleDeleteTemplate}
              selectedUser={selectedUser}
              onUserSelect={onUserSelect}
              isAdmin={true}
              handleAddFile={handleAddFile}
              showAdminPanel={showAdminPanel}
              setShowAdminPanel={setShowAdminPanel}
              showSaveTemplateButton={true}
              handleExportLocalSite={handleExportLocalSite}
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
        <Route path="/myfiles" element={
          <StudentPasswordGate>
            <StudentFilesView
              selectedUser={selectedUser}
              onBack={() => window.location.href = '/'}
              onUserSelect={onUserSelect}
            />
          </StudentPasswordGate>
        } />
        <Route path="/*" element={
          <StudentPasswordGate>
            <MainApp
              project={project}
              setProject={setProject}
              activeFileId={activeFileId}
              setActiveFileId={setActiveFileId}
              previewKey={previewKey}
              setPreviewKey={setPreviewKey}
              splitPosition={splitPosition}
              setSplitPosition={setSplitPosition}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
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
              handleMouseDown={handleMouseDown}
              handleMouseUp={handleMouseUp}
              handleMouseMove={handleMouseMove}
              handleCopyCode={handleCopyCode}
              showSaveTemplateButton={false}
              handleSaveHtml={handleSaveHtml}
              handleLoadSavedHtml={handleLoadSavedHtml}
              handleDeleteSavedHtml={handleDeleteSavedHtml}
              handleDeleteTemplate={handleDeleteTemplate}
              selectedUser={selectedUser}
              onUserSelect={onUserSelect}
              isAdmin={selectedUser === 'admin'}
              handleAddFile={handleAddFile}
              handleExportLocalSite={handleExportLocalSite}

            />
          </StudentPasswordGate>
        } />
      </Routes>
    </>
  );
}

export default App;