/**
 * WebXRide Hotspot Template Bridge
 * 
 * This bridge provides integration between WebXRide and the hotspot creation tool.
 * It can work with multiple versions of the external tool and provides
 * WebXRide-specific enhancements.
 */

// Check if already loaded to prevent duplicate declaration
if (window.HotspotTemplateBridge) {
  console.log('HotspotTemplateBridge already loaded, skipping...');
} else {
  console.log('HotspotTemplateBridge script loading...');

  class HotspotTemplateBridge {
  constructor() {
    console.log('HotspotTemplateBridge constructor called');
    this.currentToolVersion = null;
    this.availableVersions = {
      'external-v2': {
        name: 'External Tool v2',
        path: '/experimental/tools/create_hotspot_template-master-2/',
        features: ['basic-hotspots', 'multi-scene', 'export']
      },
      'webxride-enhanced': {
        name: 'WebXRide Enhanced',
        path: '/experimental/webxride-enhanced-hotspot-editor/',
        features: ['basic-hotspots', 'multi-scene', 'export', 'webxride-integration', 'asset-sharing']
      }
    };
    this.currentProject = null;
    this.webxrideAssets = null;
    this.pendingWebXRideContext = null;
    
    // Set up message listener for communication with editor
    this.setupMessageListener();
    
    console.log('HotspotTemplateBridge constructor completed');
  }

  /**
   * Set up message listener for communication with the editor
   */
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      this.handleEditorMessage(event);
    });
    console.log('Message listener set up');
  }

  /**
   * Initialize the bridge with WebXRide context
   */
  async initialize(webxrideContext) {
    this.webxrideContext = webxrideContext;
    this.currentUser = webxrideContext.currentUser;
    this.isAdmin = webxrideContext.isAdmin;
    
    // Load available assets from WebXRide
    await this.loadWebXRideAssets();
    
    console.log('HotspotTemplateBridge initialized');
  }

  /**
   * Load available assets from WebXRide file system
   */
  async loadWebXRideAssets() {
    try {
      // This would integrate with WebXRide's file management system
      this.webxrideAssets = {
        images: [], // Will be populated from WebXRide file list
        audio: [],  // Will be populated from WebXRide file list
        templates: [] // Will be populated from WebXRide templates
      };
      
      console.log('WebXRide assets loaded');
    } catch (error) {
      console.error('Error loading WebXRide assets:', error);
    }
  }

  /**
   * Launch the hotspot editor with specified version
   */
  async launchEditor(version = 'webxride-enhanced', projectData = null) {
    console.log('launchEditor called with version:', version);
    
    const toolVersion = this.availableVersions[version];
    if (!toolVersion) {
      throw new Error(`Unknown tool version: ${version}`);
    }

    console.log('Tool version found:', toolVersion);
    this.currentToolVersion = version;
    
    if (projectData) {
      this.currentProject = projectData;
    }

    // Create modal or new window for the editor
    console.log('Creating editor window...');
    const editorWindow = await this.createEditorWindow(toolVersion);
    this.currentEditorWindow = editorWindow;
    console.log('Editor window created:', editorWindow);
    
    // Pass WebXRide context to the editor
    console.log('Passing WebXRide context...');
    this.passWebXRideContext(editorWindow, toolVersion);
    
    console.log('Editor launch completed');
    return editorWindow;
  }

  /**
   * Create editor window/modal
   */
  async createEditorWindow(toolVersion) {
    console.log('createEditorWindow called with toolVersion:', toolVersion);
    
    // Try opening in a new window first (more reliable for iframe interactions)
    const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes';
    const editorUrl = toolVersion.path + 'index.html?webxride=true';
    
    try {
      const newWindow = window.open(editorUrl, 'hotspot-editor', windowFeatures);
      if (newWindow) {
        console.log('Editor opened in new window successfully');
        
        // Set up a more reliable way to detect when the window is ready
        const checkWindowReady = () => {
          try {
            // Check if the window is accessible and has loaded
            if (newWindow.document && newWindow.document.readyState === 'complete') {
              console.log('New window is ready, passing context...');
              this.passWebXRideContext({ window: newWindow, type: 'window' }, toolVersion);
            } else {
              // Window not ready yet, check again in a bit
              setTimeout(checkWindowReady, 100);
            }
          } catch (error) {
            // Window might not be accessible yet due to cross-origin restrictions
            // Wait a bit longer and try again
            setTimeout(checkWindowReady, 200);
          }
        };
        
        // Start checking for window readiness
        checkWindowReady();
        
        return { window: newWindow, type: 'window' };
      }
    } catch (error) {
      console.log('Could not open new window, falling back to modal:', error);
    }
    
    // Fallback to modal if new window fails
    console.log('Falling back to modal approach...');
    
    // Create a simple modal that doesn't interfere with iframe interactions
    const modal = document.createElement('div');
    modal.id = 'hotspot-editor-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create iframe for the editor
    const iframe = document.createElement('iframe');
    const iframeSrc = toolVersion.path + 'index.html?webxride=true';
    console.log('Creating iframe with src:', iframeSrc);
    iframe.src = iframeSrc;
    iframe.style.cssText = `
      width: 90vw;
      height: 90vh;
      border: none;
      border-radius: 8px;
      background: white;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 20px;
      cursor: pointer;
      z-index: 10000;
    `;
    closeButton.onclick = () => this.closeEditor();

    modal.appendChild(iframe);
    modal.appendChild(closeButton);
    
    // Add click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeEditor();
      }
    });

    console.log('Adding modal to document.body');
    document.body.appendChild(modal);
    console.log('Modal added to DOM, modal element:', modal);

    // Wait for iframe to load and then ensure it's interactive
    iframe.onload = () => {
      console.log('Iframe loaded, ensuring focus...');
      
      // Multiple focus attempts to ensure iframe gets focus
      setTimeout(() => {
        iframe.focus();
        console.log('Iframe focused after load');
        
        // Try to focus the content window as well
        try {
          iframe.contentWindow.focus();
          console.log('Iframe content window focused');
        } catch (error) {
          console.log('Could not focus iframe content window:', error);
        }
        
        // Add a click handler to the iframe to ensure it gets focus on interaction
        iframe.addEventListener('click', () => {
          iframe.focus();
          console.log('Iframe focused on click');
        });
        
      }, 100);
    };

    return { modal, iframe, type: 'modal' };
  }

  /**
   * Pass WebXRide context to the editor
   */
  passWebXRideContext(editorWindow, toolVersion) {
    // Create the full WebXRide context
    const webxrideContext = {
      currentUser: this.currentUser,
      isAdmin: this.isAdmin,
      assets: this.webxrideAssets,
      currentProject: this.currentProject,
      version: toolVersion.version || toolVersion
    };
    
    console.log('Created WebXRide context:', webxrideContext);
    
    // Store the context for when the editor requests it
    this.pendingWebXRideContext = webxrideContext;
    console.log('Stored pending context:', this.pendingWebXRideContext);
    
    if (editorWindow.type === 'window') {
      // Handle new window - we'll wait for the editor to request context
      console.log('New window opened, waiting for editor to request context');
      
      // For new windows, we need to set up a message listener to receive the EDITOR_READY message
      // The context will be sent when the editor requests it
      console.log('Context will be sent when editor sends EDITOR_READY message');
    } else {
      // Handle modal iframe
      const { iframe } = editorWindow;
      
      // Wait for iframe to load
      iframe.onload = () => {
        try {
          // Focus the iframe to ensure it can receive interactions
          iframe.focus();
          console.log('Iframe loaded and focused');
          
          // Send context to iframe
          this.sendContextToIframe(iframe, webxrideContext);
          
        } catch (error) {
          console.error('Error passing WebXRide context to iframe:', error);
        }
      };
    }
  }


  


  /**
   * Send context to an iframe
   */
  sendContextToIframe(iframe, context) {
    try {
      // Send context to iframe
      iframe.contentWindow.postMessage({
        type: 'WEBXRIDE_CONTEXT',
        data: context
      }, '*');

      console.log('WebXRide context passed to iframe');
      
      // Add keyboard event listener for escape key
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          this.closeEditor();
          document.removeEventListener('keydown', handleKeyDown);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      
    } catch (error) {
      console.error('Error passing WebXRide context to iframe:', error);
    }
  }

  /**
   * Handle messages from the editor
   */
  handleEditorMessage(event) {
    console.log('Bridge received message:', event.data);
    console.log('Message type:', event.data?.type);
    console.log('Message source:', event.source);
    
    const { type, data } = event.data;

    switch (type) {
      case 'EDITOR_READY':
        console.log('Editor is ready, sending WebXRide context');
        console.log('Pending context:', this.pendingWebXRideContext);
        if (this.pendingWebXRideContext) {
          // Send the context to the editor
          event.source.postMessage({
            type: 'WEBXRIDE_CONTEXT',
            data: this.pendingWebXRideContext
          }, '*');
          console.log('WebXRide context sent to editor');
        } else {
          console.warn('No pending WebXRide context to send');
        }
        break;
      case 'SAVE_TEMPLATE':
        this.saveTemplateToWebXRide(data);
        break;
      case 'LOAD_ASSETS':
        this.loadAssetsForEditor(data);
        break;
      case 'EXPORT_PROJECT':
        this.exportProjectFromWebXRide(data);
        break;
      case 'CLOSE_EDITOR':
        this.closeEditor();
        break;
      default:
        console.log('Unknown message type from editor:', type);
    }
  }

  /**
   * Save template to WebXRide template system
   */
  async saveTemplateToWebXRide(templateData) {
    try {
      console.log('Saving template to WebXRide:', templateData);
      
      // Create template object for WebXRide
      const template = {
        id: `hotspot-${Date.now()}`,
        name: templateData.name || '360° Interactive Tour',
        framework: 'aframe',
        description: templateData.description || 'Interactive 360° tour with hotspots',
        category: '360-tours',
        files: [
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
          },
          {
            name: 'tour-data.json',
            content: JSON.stringify(templateData.tourData, null, 2),
            type: 'json'
          }
        ],
        metadata: {
          type: '360-tour',
          version: this.currentToolVersion,
          scenes: templateData.tourData.scenes?.length || 0,
          hotspots: templateData.tourData.totalHotspots || 0,
          createdBy: this.currentUser,
          createdAt: new Date().toISOString()
        }
      };

      // Send the template data to WebXRide via postMessage
      if (window.parent) {
        window.parent.postMessage({
          type: 'HOTSPOT_TEMPLATE_SAVED',
          data: {
            template: template,
            rawData: templateData
          }
        }, '*');
      }

      console.log('Template data sent to WebXRide:', template);
      
      // Close editor after successful save
      this.closeEditor();
      
    } catch (error) {
      console.error('Error saving template to WebXRide:', error);
    }
  }

  /**
   * Load assets from WebXRide for the editor
   */
  async loadAssetsForEditor(assetTypes) {
    try {
      const assets = {};
      
      if (assetTypes.includes('images')) {
        // Load 360° images from WebXRide file system
        assets.images = this.webxrideAssets.images.filter(img => 
          img.type === 'images' && img.name.match(/\.(jpg|jpeg|png)$/i)
        );
      }
      
      if (assetTypes.includes('audio')) {
        // Load audio files from WebXRide file system
        assets.audio = this.webxrideAssets.audio;
      }
      
      // Send assets back to editor
      const editorIframe = document.querySelector('#hotspot-editor-modal iframe');
      if (editorIframe && editorIframe.contentWindow) {
        editorIframe.contentWindow.postMessage({
          type: 'WEBXRIDE_ASSETS',
          data: assets
        }, '*');
      }
      
    } catch (error) {
      console.error('Error loading assets for editor:', error);
    }
  }

  /**
   * Export project from WebXRide
   */
  async exportProjectFromWebXRide(projectData) {
    try {
      // Create downloadable project files
      const projectFiles = {
        'index.html': projectData.html,
        'script.js': projectData.js,
        'style.css': projectData.css,
        'tour-data.json': JSON.stringify(projectData.tourData, null, 2)
      };

      // Create zip file for download
      // This would use a library like JSZip
      console.log('Project exported:', projectFiles);
      
    } catch (error) {
      console.error('Error exporting project:', error);
    }
  }

  /**
   * Close the editor
   */
  closeEditor() {
    // Check if we have a window open
    if (this.currentEditorWindow && this.currentEditorWindow.type === 'window') {
      try {
        this.currentEditorWindow.window.close();
        console.log('Editor window closed');
      } catch (error) {
        console.log('Could not close editor window:', error);
      }
    } else {
      // Close modal
      const modal = document.getElementById('hotspot-editor-modal');
      if (modal) {
        // Remove any event listeners
        const iframe = modal.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          try {
            // Send close message to editor
            iframe.contentWindow.postMessage({
              type: 'CLOSE_EDITOR'
            }, '*');
          } catch (error) {
            console.log('Could not send close message to editor:', error);
          }
        }
        
        modal.remove();
      }
    }
    
    // Clean up
    this.currentToolVersion = null;
    this.currentProject = null;
    this.currentEditorWindow = null;
    
    console.log('Hotspot editor closed');
  }



  /**
   * Get available tool versions
   */
  getAvailableVersions() {
    return Object.keys(this.availableVersions).map(key => ({
      id: key,
      ...this.availableVersions[key]
    }));
  }

  /**
   * Add new tool version
   */
  addToolVersion(id, config) {
    this.availableVersions[id] = config;
    console.log(`Added tool version: ${id}`);
  }

  /**
   * Remove tool version
   */
  removeToolVersion(id) {
    if (this.availableVersions[id]) {
      delete this.availableVersions[id];
      console.log(`Removed tool version: ${id}`);
    }
  }
}

// Export for use in WebXRide
window.HotspotTemplateBridge = HotspotTemplateBridge;
console.log('HotspotTemplateBridge class exported to window object');
} // Close the if statement 