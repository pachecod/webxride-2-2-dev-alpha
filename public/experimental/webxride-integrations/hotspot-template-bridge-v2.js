/**
 * WebXRide Hotspot Template Bridge v2
 * 
 * Simplified bridge for hotspot template integration with WebXRide
 * Focuses on proper template saving and display
 */

console.log('HotspotTemplateBridge v2 loading...');

class HotspotTemplateBridgeV2 {
  constructor() {
    console.log('HotspotTemplateBridgeV2 constructor called');
    this.currentProject = null;
    this.webxrideAssets = null;
    this.templateDisplayContainer = null;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize the bridge
   */
  init() {
    console.log('Initializing HotspotTemplateBridgeV2');
    
    // Listen for messages from the editor
    window.addEventListener('message', (event) => {
      this.handleEditorMessage(event);
    });
    
    // Create template display container
    this.createTemplateDisplayContainer();
    
    console.log('HotspotTemplateBridgeV2 initialized');
  }

  /**
   * Create container for displaying saved templates
   */
  createTemplateDisplayContainer() {
    // Remove existing container if it exists
    const existing = document.getElementById('webxride-template-display');
    if (existing) {
      existing.remove();
    }

    // Create new container
    this.templateDisplayContainer = document.createElement('div');
    this.templateDisplayContainer.id = 'webxride-template-display';
    this.templateDisplayContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: #2a2a2a;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 10000;
      overflow-y: auto;
      display: none;
    `;

    // Add header
    const header = document.createElement('div');
    header.style.cssText = `
      background: #4CAF50;
      padding: 15px;
      border-radius: 6px 6px 0 0;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>📋 Saved Template</span>
      <button onclick="this.parentElement.parentElement.style.display='none'" 
              style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">✕</button>
    `;

    // Add content area
    const content = document.createElement('div');
    content.id = 'template-content';
    content.style.cssText = `
      padding: 20px;
      line-height: 1.5;
    `;
    content.innerHTML = '<p>No template saved yet...</p>';

    this.templateDisplayContainer.appendChild(header);
    this.templateDisplayContainer.appendChild(content);
    document.body.appendChild(this.templateDisplayContainer);

    console.log('Template display container created');
  }

  /**
   * Handle messages from the hotspot editor
   */
  handleEditorMessage(event) {
    console.log('Received message from editor:', event.data);
    
    const { type, data } = event.data;

    switch (type) {
      case 'SAVE_TEMPLATE':
        this.handleTemplateSave(data);
        break;
      case 'LOAD_ASSETS':
        this.handleAssetRequest(data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  /**
   * Handle template save from editor
   */
  handleTemplateSave(templateData) {
    console.log('Handling template save:', templateData);
    
    try {
      // Store the template data
      this.currentProject = templateData;
      
      // Display the template in WebXRide
      this.displayTemplate(templateData);
      
      // Show success message
      this.showNotification('Template saved successfully!', 'success');
      
      console.log('Template saved and displayed');
      
    } catch (error) {
      console.error('Error handling template save:', error);
      this.showNotification('Error saving template: ' + error.message, 'error');
    }
  }

  /**
   * Display the saved template in WebXRide
   */
  displayTemplate(templateData) {
    if (!this.templateDisplayContainer) {
      this.createTemplateDisplayContainer();
    }

    const content = document.getElementById('template-content');
    
    // Create HTML content for the template
    const htmlContent = `
      <h3 style="color: #4CAF50; margin-top: 0;">${templateData.name}</h3>
      <p><strong>Description:</strong> ${templateData.description}</p>
      <p><strong>Scenes:</strong> ${templateData.tourData.scenes ? Object.keys(templateData.tourData.scenes).length : 0}</p>
      <p><strong>Hotspots:</strong> ${templateData.tourData.totalHotspots || 0}</p>
      
      <div style="margin: 20px 0;">
        <h4 style="color: #FFC65D;">Generated Files:</h4>
        <div style="background: #333; padding: 15px; border-radius: 4px; margin: 10px 0;">
          <h5 style="margin: 0 0 10px 0; color: #4CAF50;">HTML Preview</h5>
          <div style="background: #1a1a1a; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; color: #ccc;">
            ${this.escapeHtml(templateData.html.substring(0, 500))}${templateData.html.length > 500 ? '...' : ''}
          </div>
        </div>
        
        <div style="background: #333; padding: 15px; border-radius: 4px; margin: 10px 0;">
          <h5 style="margin: 0 0 10px 0; color: #2196F3;">JavaScript Preview</h5>
          <div style="background: #1a1a1a; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; color: #ccc;">
            ${this.escapeHtml(templateData.js.substring(0, 500))}${templateData.js.length > 500 ? '...' : ''}
          </div>
        </div>
        
        <div style="background: #333; padding: 15px; border-radius: 4px; margin: 10px 0;">
          <h5 style="margin: 0 0 10px 0; color: #FF9800;">CSS Preview</h5>
          <div style="background: #1a1a1a; padding: 10px; border-radius: 4px; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; color: #ccc;">
            ${this.escapeHtml(templateData.css.substring(0, 500))}${templateData.css.length > 500 ? '...' : ''}
          </div>
        </div>
      </div>
      
      <div style="margin: 20px 0;">
        <h4 style="color: #E91E63;">Tour Data:</h4>
        <div style="background: #333; padding: 15px; border-radius: 4px;">
          <pre style="margin: 0; color: #ccc; font-size: 12px; overflow-x: auto;">${JSON.stringify(templateData.tourData, null, 2)}</pre>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="window.hotspotBridge.downloadTemplate()" 
                style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 5px;">
          📥 Download Template
        </button>
        <button onclick="window.hotspotBridge.copyToClipboard()" 
                style="background: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 5px;">
          📋 Copy to Clipboard
        </button>
      </div>
    `;
    
    content.innerHTML = htmlContent;
    
    // Show the container
    this.templateDisplayContainer.style.display = 'block';
  }

  /**
   * Escape HTML for safe display
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle asset requests from editor
   */
  handleAssetRequest(assetTypes) {
    console.log('Asset request received:', assetTypes);
    
    // For now, send mock assets
    const mockAssets = {
      images: [
        { name: 'room1.jpg', type: 'images', url: './images/room1.jpg' },
        { name: 'room2.jpg', type: 'images', url: './images/room2.jpg' }
      ],
      audio: [
        { name: 'music.mp3', type: 'audio', url: './audio/music.mp3' }
      ]
    };
    
    // Send assets back to editor
    const editorIframe = document.querySelector('iframe[src*="webxride-enhanced-hotspot-editor"]');
    if (editorIframe && editorIframe.contentWindow) {
      editorIframe.contentWindow.postMessage({
        type: 'WEBXRIDE_ASSETS',
        data: mockAssets
      }, '*');
    }
  }

  /**
   * Download the saved template
   */
  downloadTemplate() {
    if (!this.currentProject) {
      this.showNotification('No template to download', 'warning');
      return;
    }
    
    try {
      // Create zip file with all template files
      const templateFiles = {
        'index.html': this.currentProject.html,
        'script.js': this.currentProject.js,
        'style.css': this.currentProject.css,
        'tour-data.json': JSON.stringify(this.currentProject.tourData, null, 2)
      };
      
      // For now, just download the HTML file
      const blob = new Blob([this.currentProject.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentProject.name}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showNotification('Template downloaded!', 'success');
      
    } catch (error) {
      console.error('Error downloading template:', error);
      this.showNotification('Error downloading template', 'error');
    }
  }

  /**
   * Copy template data to clipboard
   */
  async copyToClipboard() {
    if (!this.currentProject) {
      this.showNotification('No template to copy', 'warning');
      return;
    }
    
    try {
      const templateSummary = `
Template: ${this.currentProject.name}
Description: ${this.currentProject.description}
Scenes: ${Object.keys(this.currentProject.tourData.scenes || {}).length}
Hotspots: ${this.currentProject.tourData.totalHotspots || 0}

HTML Length: ${this.currentProject.html.length} characters
JavaScript Length: ${this.currentProject.js.length} characters
CSS Length: ${this.currentProject.css.length} characters

Tour Data: ${JSON.stringify(this.currentProject.tourData, null, 2)}
      `;
      
      await navigator.clipboard.writeText(templateSummary);
      this.showNotification('Template data copied to clipboard!', 'success');
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showNotification('Error copying to clipboard', 'error');
    }
  }

  /**
   * Show notification message
   */
  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('webxride-notification');
    if (existing) {
      existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.id = 'webxride-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 25px;
      border-radius: 6px;
      color: white;
      font-weight: bold;
      z-index: 10001;
      animation: slideDown 0.3s ease-out;
    `;
    
    // Set color based on type
    switch (type) {
      case 'success':
        notification.style.background = '#4CAF50';
        break;
      case 'error':
        notification.style.background = '#f44336';
        break;
      case 'warning':
        notification.style.background = '#ff9800';
        break;
      default:
        notification.style.background = '#2196F3';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Launch the hotspot editor
   */
  launchEditor(version = 'webxride-enhanced') {
    console.log('Launching editor with version:', version);
    
    // Create modal for the editor
    const modal = document.createElement('div');
    modal.id = 'hotspot-editor-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create iframe for the editor
    const iframe = document.createElement('iframe');
    iframe.src = `./webxride-enhanced-hotspot-editor/index.html?webxride=true`;
    iframe.style.cssText = `
      width: 95vw;
      height: 95vh;
      border: none;
      border-radius: 8px;
      background: white;
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
      z-index: 10001;
    `;
    closeButton.onclick = () => this.closeEditor();

    modal.appendChild(iframe);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);

    return { modal, iframe };
  }

  /**
   * Close the editor
   */
  closeEditor() {
    const modal = document.getElementById('hotspot-editor-modal');
    if (modal) {
      modal.remove();
    }
    console.log('Hotspot editor closed');
  }
}

// Export for use
window.HotspotTemplateBridgeV2 = HotspotTemplateBridgeV2;

// Create global instance
window.hotspotBridge = new HotspotTemplateBridgeV2();

console.log('HotspotTemplateBridgeV2 loaded and ready'); 