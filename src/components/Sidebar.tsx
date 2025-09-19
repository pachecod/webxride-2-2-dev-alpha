import React from 'react';
import { Code, FileCode, ArrowRight, Trash2, File } from 'lucide-react';
import { Framework, Project, FileType } from '../types';
import { FileList } from './FileList';
import { supabase, loadTemplateFromStorage, listUserHtmlByName, getTemplatesFromStorage, getTemplatesWithOrder, saveTemplateOrder, loadTemplateOrder } from '../lib/supabase';
import { DBProject } from '../types';
import { ChevronDown, ChevronRight, Plus, Copy, ExternalLink, Users, Settings, FileText, FolderOpen, GripVertical } from 'lucide-react';

interface TemplateWithCreator {
  id: string;
  name: string;
  framework: string;
  files: any;
  creator_id: string;
  creator_email: string;
}

interface StorageTemplate {
  id: string;
  name: string;
  framework: string;
  description: string;
  files: any[];
}

interface SidebarProps {
  onLoadTemplate: (template: Project) => void;
  templates: TemplateWithCreator[];
  projects: DBProject[];
  onLoadProject: (projectId: string) => void;
  onLoadHtmlDraft?: (html: string) => void;
  refreshTemplates?: (callback: () => void) => void;
  onFileSelect: (file: any) => void;
  onLoadSavedHtml?: (folderName: string) => void;
  onDeleteSavedHtml?: (folderName: string) => void;
  onDeleteTemplate?: (template: any) => void;
  selectedUser?: string | null;
  isAdmin?: boolean;
  onUserSelect?: (user: string) => void;
}

const STARTER_HTML = `<!DOCTYPE html>\n<html>\n<head>\n  <title>My First HTML Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>This is a paragraph.</p>\n</body>\n</html>`;
const STARTER_CSS = `body {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n  background: #f8fafc;\n  color: #222;\n  margin: 0;\n  padding: 0;\n}\nh1 {\n  color: #2563eb;\n  margin-top: 2rem;\n  text-align: center;\n}\np {\n  max-width: 600px;\n  margin: 1rem auto;\n  font-size: 1.1rem;\n  line-height: 1.6;\n  text-align: center;\n}`;

const Sidebar: React.FC<SidebarProps> = ({ 
  onLoadTemplate, 
  templates,
  projects,
  onLoadProject,
  onLoadHtmlDraft,
  refreshTemplates,
  onFileSelect,
  onLoadSavedHtml,
  onDeleteSavedHtml,
  onDeleteTemplate,
  selectedUser,
  isAdmin = false,
  onUserSelect
}) => {
  const [isExpanded, setIsExpanded] = React.useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved === 'true';
  });

  const [fileListKey, setFileListKey] = React.useState(0);
  const [templatesPerPage, setTemplatesPerPage] = React.useState<number | 'all'>(5);
  const [templatePage, setTemplatePage] = React.useState(0);
  const [templateFolders, setTemplateFolders] = React.useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);
  const [savedHtmlFiles, setSavedHtmlFiles] = React.useState<any[]>([]);
  const [loadingSavedHtml, setLoadingSavedHtml] = React.useState(false);
  const [isReordering, setIsReordering] = React.useState(false);
  const [draggedTemplate, setDraggedTemplate] = React.useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = React.useState(false);

  const frameworkIcons = {
    [Framework.HTML]: <FileCode size={16} className="text-orange-400" />,
    [Framework.AFRAME]: <Code size={16} className="text-blue-400" />,
    [Framework.BABYLON]: <Code size={16} className="text-purple-400" />,
  };

  // Hotspot Template Bridge
  const [hotspotBridge, setHotspotBridge] = React.useState<any>(null);

  // Debug logging for admin status
  React.useEffect(() => {
    console.log('Sidebar admin status:', { isAdmin, selectedUser });
  }, [isAdmin, selectedUser]);

  // Save isExpanded to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('sidebar-expanded', isExpanded ? 'true' : 'false');
  }, [isExpanded]);

  // Load template folders from Storage
  const loadTemplateFolders = async () => {
    console.log('=== Starting template loading ===');
    setLoadingTemplates(true);
    try {
      // List all folders in the templates bucket
      console.log('Listing templates from storage...');
      const { data: folders, error } = await supabase.storage
        .from('templates')
        .list('', { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });
      
      console.log('Storage response:', { folders, error });
      
      if (error) {
        console.error('Error listing template folders:', error);
        setTemplateFolders([]);
        return;
      }
      
      if (!folders || folders.length === 0) {
        console.log('No folders found in templates bucket');
        setTemplateFolders([]);
        return;
      }
      
      // Filter to only include directories (templates) and exclude system files
      const templateFolders = folders.filter(folder => {
        const hasSlash = folder.name.includes('/');
        const isNotMetadataFile = !folder.name.endsWith('metadata.json');
        const isNotTemplateOrder = folder.name !== 'template-order.json';
        const isNotSystemFile = !folder.name.startsWith('.');
        
        console.log(`Filtering ${folder.name}:`, { hasSlash, isNotMetadataFile, isNotTemplateOrder, isNotSystemFile });
        
        // Include folders that don't have slashes (top-level folders) and exclude system files
        return !hasSlash && isNotMetadataFile && isNotTemplateOrder && isNotSystemFile;
      });

      console.log('Filtered template folders:', templateFolders);

      // Process each template folder and verify it has content
      const processedTemplates = [];
      for (const folder of templateFolders) {
        // Check if the folder actually contains files
        const { data: folderContents } = await supabase.storage
          .from('templates')
          .list(folder.name, { limit: 1 });
        
        // Skip empty folders (deleted templates)
        if (!folderContents || folderContents.length === 0) {
          console.log(`Skipping empty folder: ${folder.name}`);
          continue;
        }
        try {
          console.log(`Processing template: ${folder.name}`);
          
          // Try to read metadata.json first
          const metadataPath = `${folder.name}/metadata.json`;
          const { data: metadataFile, error: metadataError } = await supabase.storage
            .from('templates')
            .download(metadataPath);
          
          if (!metadataError && metadataFile) {
            const metadataText = await metadataFile.text();
            const metadata = JSON.parse(metadataText);
            console.log(`Found metadata for ${folder.name}:`, metadata);
            
            processedTemplates.push({
              id: folder.name,
              name: metadata.name || folder.name,
              framework: metadata.framework || 'html',
              description: metadata.description || '',
              created_at: metadata.created_at || new Date().toISOString()
            });
          } else {
            console.log(`No metadata.json found for ${folder.name}, creating basic template`);
            // Create a basic template from the folder name
            processedTemplates.push({
              id: folder.name,
              name: folder.name,
              framework: 'html',
              description: '',
              created_at: new Date().toISOString()
            });
          }
        } catch (templateError) {
          console.error(`Error processing template ${folder.name}:`, templateError);
        }
      }

      console.log('Final processed templates:', processedTemplates);
      
      // Load saved template order and apply it
      try {
        const { data: savedOrder, error: orderError } = await loadTemplateOrder();
        if (!orderError && savedOrder && Array.isArray(savedOrder)) {
          console.log('Found saved template order:', savedOrder);
          
          // Create a map of template IDs to their saved positions
          const orderMap = new Map();
          savedOrder.forEach((templateId, index) => {
            orderMap.set(templateId, index);
          });
          
          // Sort templates according to saved order, with unsaved templates at the end
          const sortedTemplates = [...processedTemplates].sort((a, b) => {
            const aOrder = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
            const bOrder = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;
            return aOrder - bOrder;
          });
          
          console.log('Templates sorted by saved order:', sortedTemplates);
          setTemplateFolders(sortedTemplates);
        } else {
          console.log('No saved order found, using default order');
          setTemplateFolders(processedTemplates);
        }
      } catch (orderError) {
        console.error('Error loading template order:', orderError);
        setTemplateFolders(processedTemplates);
      }
      
      // Debug: Log each template structure
      processedTemplates.forEach((template, index) => {
        console.log(`Template ${index}:`, {
          id: template.id,
          name: template.name,
          framework: template.framework,
          description: template.description,
          created_at: template.created_at
        });
      });
    } catch (error) {
      console.error('Error in loadTemplateFolders:', error);
      setTemplateFolders([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  React.useEffect(() => {
    loadTemplateFolders();
  }, []);

  // Set up refresh mechanism
  React.useEffect(() => {
    if (refreshTemplates) {
      refreshTemplates(() => {
        console.log('Refreshing template folders...');
        loadTemplateFolders();
      });
    }
  }, [refreshTemplates]);

  // Initialize Hotspot Template Bridge
  React.useEffect(() => {
    const initHotspotBridge = async () => {
      try {
        // Load the bridge script
        const script = document.createElement('script');
        script.src = '/experimental/webxride-integrations/hotspot-template-bridge.js?v=1.0.1';
        script.onload = () => {
          console.log('Hotspot bridge script loaded in sidebar');
          if ((window as any).HotspotTemplateBridge) {
            console.log('HotspotTemplateBridge class found, creating instance');
            const bridge = new (window as any).HotspotTemplateBridge();
            bridge.initialize({
              currentUser: selectedUser,
              isAdmin: isAdmin
            });
            setHotspotBridge(bridge);
            console.log('Hotspot bridge initialized successfully');
          } else {
            console.error('HotspotTemplateBridge class not found in sidebar');
          }
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error initializing hotspot bridge:', error);
      }
    };

    initHotspotBridge();
  }, [selectedUser, isAdmin]);

  // Subscribe to file changes
  React.useEffect(() => {
    const channel = supabase
      .channel('file-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'storage',
      }, () => {
        setFileListKey(prev => prev + 1);
        loadTemplateFolders();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Handle template loading
  const handleLoadTemplate = async (template: any) => {
    try {
      console.log('=== handleLoadTemplate called ===');
      console.log('Template object:', template);
      console.log('Template ID:', template.id);
      console.log('Template name:', template.name);
      
      const { data: templateData, error } = await loadTemplateFromStorage(template.id);
      
      console.log('loadTemplateFromStorage result:', { templateData, error });
      
      if (error) {
        console.error('Template loading error:', error);
        alert(`Error loading template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      if (templateData) {
        console.log('Template data loaded successfully:', templateData);
        // Convert the template to match the Project interface
        const projectTemplate: Project = {
          name: templateData.name,
          framework: templateData.framework as Framework,
          files: templateData.files.map(file => ({
            ...file,
            type: file.type as any // Convert string type to FileType
          }))
        };
        console.log('Project template created:', projectTemplate);
        onLoadTemplate(projectTemplate);
      } else {
        console.error('No template data returned');
        alert('No template data found. Please try again.');
      }
    } catch (error) {
      console.error('Exception in handleLoadTemplate:', error);
      alert('Error loading template. Please try again.');
    }
  };

  // Pagination logic for templates
  const totalTemplates = templateFolders.length;
  const templatesToShow = templatesPerPage === 'all'
    ? templateFolders
    : templateFolders.slice(templatePage * Number(templatesPerPage), (templatePage + 1) * Number(templatesPerPage));
  const totalPages = templatesPerPage === 'all' ? 1 : Math.ceil(totalTemplates / Number(templatesPerPage));

  // Drag and drop reordering functions
  const handleDragStart = (e: React.DragEvent, templateId: string) => {
    if (!isAdmin || !isReordering || window.location.pathname !== '/admin-tools') return;
    setDraggedTemplate(templateId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin || !isReordering || window.location.pathname !== '/admin-tools') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetTemplateId: string) => {
    if (!isAdmin || !isReordering || window.location.pathname !== '/admin-tools' || !draggedTemplate || draggedTemplate === targetTemplateId) return;
    
    e.preventDefault();
    
    const newOrder = [...templateFolders];
    const draggedIndex = newOrder.findIndex(t => t.id === draggedTemplate);
    const targetIndex = newOrder.findIndex(t => t.id === targetTemplateId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged item and insert at target position
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    // Update local state immediately for responsive UI
    setTemplateFolders(newOrder);
    
    // Show saving indicator
    setIsSavingOrder(true);
    
    // Save the new order to storage
    try {
      const templateIds = newOrder.map(t => t.id);
      console.log('Saving template order:', templateIds);
      const result = await saveTemplateOrder(templateIds);
      if (!result.success) {
        console.error('Failed to save template order:', result.error);
        alert('Failed to save template order. Please try again.');
        // Revert to original order if save failed
        loadTemplateFolders();
      } else {
        console.log('Template order saved successfully');
        // Show success message briefly
        setTimeout(() => {
          alert('Template order saved successfully!');
        }, 100);
      }
    } catch (error) {
      console.error('Error saving template order:', error);
      alert('Error saving template order. Please try again.');
      // Revert to original order if save failed
      loadTemplateFolders();
    } finally {
      setIsSavingOrder(false);
    }
    
    setDraggedTemplate(null);
  };

  const handleDragEnd = () => {
    setDraggedTemplate(null);
  };

  // Fetch saved HTML files when selected user changes
  React.useEffect(() => {
    if (!selectedUser) {
      setSavedHtmlFiles([]);
      return;
    }
    
    setLoadingSavedHtml(true);
    console.log('Loading saved HTML for user:', selectedUser);
    
    listUserHtmlByName(selectedUser)
      .then(files => {
        console.log('Saved HTML files found for user:', selectedUser, files);
        setSavedHtmlFiles(files || []);
      })
      .catch(error => {
        console.error('Error loading saved HTML files:', error);
        setSavedHtmlFiles([]);
      })
      .finally(() => {
        setLoadingSavedHtml(false);
      });
  }, [selectedUser]);

  return (
    <aside 
      className={`bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-96' : 'w-12'
      }`}
    >
      <div className="relative">
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          className="absolute top-0 left-0 p-0 hover:bg-gray-800 transition-colors z-10 flex flex-col items-center justify-start"
          style={{ width: '48px', maxHeight: 'calc(100vh - 8px)' }}
        >
          {!isExpanded ? (
            <span className="flex flex-col items-center">
              <ArrowRight size={22} style={{ marginBottom: '4px' }} />
              <span
                className="text-xs text-white font-semibold tracking-widest"
                style={{ writingMode: 'vertical-rl', whiteSpace: 'nowrap', letterSpacing: '0.2em', transform: 'rotate(180deg)' }}
              >
                Templates and Files
              </span>
            </span>
          ) : (
            <ArrowRight size={22} className="rotate-180" />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ marginLeft: isExpanded ? '48px' : 0 }}>
        {isExpanded && (
          <>
            <div className="px-3 py-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Latest Templates
              </h2>
              <div className="flex items-center gap-2">
                {isAdmin && window.location.pathname === '/admin-tools' && (
                  <button
                    onClick={() => setIsReordering(!isReordering)}
                    disabled={isSavingOrder}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      isReordering 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } ${isSavingOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isReordering ? 'Exit reorder mode' : 'Reorder templates'}
                  >
                    {isSavingOrder ? 'Saving...' : (isReordering ? 'Exit Reorder' : 'Reorder')}
                  </button>
                )}
                <label htmlFor="templatesPerPage" className="text-xs text-gray-400">Show templates:</label>
                <select
                  id="templatesPerPage"
                  value={templatesPerPage}
                  onChange={e => {
                    const value = e.target.value;
                    setTemplatesPerPage(value === 'all' ? 'all' : Number(value));
                    setTemplatePage(0);
                  }}
                  className="bg-gray-700 text-white text-xs rounded px-2 py-1"
                >
                  <option value={1}>1</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <nav className="space-y-1 mb-2">
              {loadingTemplates ? (
                <div className="px-3 py-2 text-sm text-gray-400">Loading templates...</div>
              ) : (
                templatesToShow.map((template, i) => {
                  // Convert string framework to Framework enum
                  let framework: Framework = Framework.HTML;
                  if (template.framework === 'aframe') framework = Framework.AFRAME;
                  else if (template.framework === 'babylon') framework = Framework.BABYLON;
                  
                  return (
                    <div 
                      key={template.id} 
                      className={`flex items-center group ${draggedTemplate === template.id ? 'opacity-50' : ''}`}
                      draggable={isAdmin && isReordering && window.location.pathname === '/admin-tools'}
                      onDragStart={(e) => handleDragStart(e, template.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, template.id)}
                      onDragEnd={handleDragEnd}
                    >
                      {isAdmin && isReordering && window.location.pathname === '/admin-tools' && (
                        <div className="flex items-center px-2 cursor-grab active:cursor-grabbing">
                          <GripVertical size={14} className="text-gray-500 hover:text-gray-400" />
                        </div>
                      )}
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="flex-1 text-left hover:bg-gray-800 transition-colors flex items-center px-3 py-2 space-x-2"
                      >
                        {frameworkIcons[framework] || <FileCode size={16} />}
                        <span className="text-sm font-semibold">{template.name}</span>
                        {template.description && (
                          <span className="text-xs text-gray-400 ml-2">{template.description}</span>
                        )}
                        {template.creator_email && (
                          <span className="text-xs text-gray-500 ml-2">by {template.creator_email}</span>
                        )}
                      </button>
                      {onDeleteTemplate && isAdmin && (
                        <button
                          onClick={() => onDeleteTemplate(template)}
                          className="ml-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-all p-1"
                          title={`Delete template "${template.name}"`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </nav>
            {templatesPerPage !== 'all' && totalTemplates > 0 && (
              <div className="flex justify-between items-center px-3 py-2 bg-gray-900 border-t border-gray-700 mb-4">
                <button
                  disabled={templatePage === 0}
                  onClick={() => setTemplatePage(p => Math.max(0, p - 1))}
                  className="px-2 py-1 text-xs bg-gray-700 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs text-gray-400">Page {templatePage + 1} of {totalPages}</span>
                <button
                  disabled={templatePage >= totalPages - 1}
                  onClick={() => setTemplatePage(p => p + 1)}
                  className="px-2 py-1 text-xs bg-gray-700 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* 360° Tour Creation Section - Temporarily Hidden */}
            {/* <div className="px-3 py-2 border-t border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                360° Interactive Tours
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    console.log('Create 360° Tour button clicked');
                    console.log('hotspotBridge available:', !!hotspotBridge);
                    if (hotspotBridge) {
                      console.log('Launching hotspot editor...');
                      hotspotBridge.launchEditor('webxride-enhanced').catch((error: any) => {
                        console.error('Error launching hotspot editor:', error);
                        alert('Error launching hotspot editor: ' + error.message);
                      });
                    } else {
                      console.log('Hotspot bridge not available');
                      alert('Hotspot editor is loading. Please try again in a moment.');
                    }
                  }}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center justify-center space-x-2"
                  disabled={!hotspotBridge}
                >
                  <span>🎯</span>
                  <span>Create 360° Tour</span>
                </button>
                <div className="text-xs text-gray-500 text-center">
                  Create interactive 360° tours with hotspots
                </div>
              </div>
            </div> */}

            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Uploaded Files
                </h2>
                <button
                  onClick={() => window.location.href = '/myfiles'}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  title="View files in larger interface"
                >
                  View Larger
                </button>
              </div>
              <FileList 
                key={fileListKey} 
                onLoadHtmlDraft={onLoadHtmlDraft} 
                selectedUser={selectedUser || ''}
                isAdmin={isAdmin || false}
                onUserSelect={typeof onUserSelect === 'function' ? onUserSelect : undefined}
              />
            </div>
            
            {/* Show saved HTML only if a user is selected */}
            {selectedUser && (
              <div className="px-3 py-2">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {selectedUser}'s Saved Work
                </h2>
                <nav className="space-y-1">
                  {loadingSavedHtml ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Loading saved work...</div>
                  ) : savedHtmlFiles.length > 0 ? (
                    savedHtmlFiles.map(file => (
                      <div key={file.name} className="flex items-center justify-between group">
                        <button
                          onClick={() => {
                            if (onLoadSavedHtml) {
                              onLoadSavedHtml(file.name);
                            } else {
                              console.log('Loading saved HTML file:', file);
                            }
                          }}
                          className="flex-1 flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          title={`Load ${file.name}`}
                        >
                          <File size={14} className="mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {file.name}
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteSavedHtml) {
                              onDeleteSavedHtml(file.name);
                            } else {
                              console.log('Delete saved HTML file:', file);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-all"
                          title={`Delete ${file.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-400">No saved work found for {selectedUser}.</div>
                  )}
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;