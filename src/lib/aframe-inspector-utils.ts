export interface AFrameInspectorConfig {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  buttonSize?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export function createAFrameInspectorHTML(
  originalHTML: string, 
  config: AFrameInspectorConfig = {},
  onSave?: (updatedHtml: string) => void
): string {
  const {
    position = 'top-left',
    buttonSize = 'medium',
    showTooltip = true
  } = config;

  // Check if this is A-Frame content
  const isAframeContent = originalHTML.includes('a-scene') || originalHTML.includes('aframe');
  
  if (!isAframeContent) {
    return originalHTML;
  }

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Button size classes
  const sizeClasses = {
    'small': 'p-2 text-sm',
    'medium': 'p-3 text-base',
    'large': 'p-4 text-lg'
  };

  const inspectorCSS = `
    <style>
      .aframe-inspector-btn {
        position: fixed;
        ${positionClasses[position]};
        z-index: 10000;
        ${sizeClasses[buttonSize]};
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .aframe-inspector-btn.open {
        background: #2563eb;
        color: white;
      }
      .aframe-inspector-btn.open:hover {
        background: #1d4ed8;
        transform: scale(1.05);
      }
      .aframe-inspector-btn.close {
        background: #dc2626;
        color: white;
      }
      .aframe-inspector-btn.close:hover {
        background: #b91c1c;
        transform: scale(1.05);
      }
      ${showTooltip ? `
      .aframe-inspector-tooltip {
        position: absolute;
        bottom: 100%;
        left: 0;
        transform: translateX(8px);
        margin-bottom: 8px;
        padding: 8px 12px;
        background: #1f2937;
        color: white;
        font-size: 14px;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        white-space: nowrap;
        z-index: 10001;
        pointer-events: none;
      }
      .aframe-inspector-btn:hover .aframe-inspector-tooltip {
        opacity: 1;
      }
      .aframe-inspector-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 16px;
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 4px solid #1f2937;
      }
      ` : ''}
    </style>
  `;

  const inspectorHTML = `
    <button id="aframe-inspector-btn" class="aframe-inspector-btn open" title="Open A-Frame Inspector">
      ⚙️
      ${showTooltip ? '<div class="aframe-inspector-tooltip">A-Frame Inspector</div>' : ''}
    </button>
  `;

  const inspectorScript = `
    <script>
      (function() {
        let inspectorOpen = false;
        const inspectorBtn = document.getElementById('aframe-inspector-btn');
        
        if (!inspectorBtn) return;
        
        // Function to handle inspector save
        function handleInspectorSave(updatedHtml) {
          console.log('Inspector save triggered with updated HTML');
          // Send message to parent window if available
          if (window.opener) {
            window.opener.postMessage({
              type: 'AFRAME_INSPECTOR_SAVE',
              html: updatedHtml
            }, '*');
          }
          // Also call the onSave callback if provided
          if (typeof window.aframeInspectorOnSave === 'function') {
            window.aframeInspectorOnSave(updatedHtml);
          }
        }
        
        // Override the inspector's save functionality
        function overrideInspectorSave() {
          if (window.AFRAME && window.AFRAME.inspector) {
            console.log('Overriding A-Frame inspector save function');
            
            // Store original save function
            const originalSave = window.AFRAME.inspector.save;
            
            // Override save function
            window.AFRAME.inspector.save = function() {
              console.log('Inspector save button clicked - our override');
              
              // Get the updated scene HTML
              const scene = document.querySelector('a-scene');
              if (scene) {
                // Get the complete HTML document
                const updatedHtml = document.documentElement.outerHTML;
                
                // Call our custom save handler
                handleInspectorSave(updatedHtml);
                
                // Don't call original save function to avoid aframe-watcher error
                // if (originalSave) {
                //   originalSave.call(this);
                // }
              }
            };
            
            // Also override the watcher check
            if (window.AFRAME.inspector.watcher) {
              window.AFRAME.inspector.watcher = {
                isRunning: function() { return true; },
                save: function() { return true; }
              };
            }
          }
        }
        
        inspectorBtn.addEventListener('click', function() {
          if (!inspectorOpen) {
            // Open inspector
            inspectorOpen = true;
            inspectorBtn.className = 'aframe-inspector-btn close';
            inspectorBtn.innerHTML = '✕${showTooltip ? '<div class="aframe-inspector-tooltip">Close Inspector</div>' : ''}';
            
            function tryOpenInspector() {
              try {
                if (window.AFRAME && window.AFRAME.inspector) {
                  window.AFRAME.inspector.open();
                  // Override save after opening
                  setTimeout(overrideInspectorSave, 1000);
                  return true;
                }
                
                // Try to load inspector script
                if (window.AFRAME && !window.AFRAME.inspector) {
                  const script = document.createElement('script');
                  script.src = 'https://cdn.jsdelivr.net/npm/aframe-inspector@1.7.0/dist/aframe-inspector.min.js';
                  script.onload = function() {
                    setTimeout(() => {
                      if (window.AFRAME && window.AFRAME.inspector) {
                        window.AFRAME.inspector.open();
                        // Override save after opening
                        setTimeout(overrideInspectorSave, 1000);
                      }
                    }, 1000);
                  };
                  document.head.appendChild(script);
                  return true;
                }
                
                return false;
              } catch (error) {
                console.error('Failed to open A-Frame Inspector:', error);
                return false;
              }
            }
            
            // Try immediately, then retry after a delay
            if (!tryOpenInspector()) {
              setTimeout(tryOpenInspector, 500);
            }
            
          } else {
            // Close inspector
            inspectorOpen = false;
            inspectorBtn.className = 'aframe-inspector-btn open';
            inspectorBtn.innerHTML = '⚙️${showTooltip ? '<div class="aframe-inspector-tooltip">A-Frame Inspector</div>' : ''}';
            
            try {
              if (window.AFRAME && window.AFRAME.inspector) {
                window.AFRAME.inspector.close();
              }
            } catch (error) {
              console.error('Failed to close A-Frame Inspector:', error);
            }
          }
        });
      })();
    </script>
  `;

  // Insert the inspector elements into the HTML
  let modifiedHTML = originalHTML;
  
  // Add CSS to head
  if (modifiedHTML.includes('</head>')) {
    modifiedHTML = modifiedHTML.replace('</head>', `${inspectorCSS}</head>`);
  } else {
    modifiedHTML = `<head>${inspectorCSS}</head>${modifiedHTML}`;
  }
  
  // Add inspector button to body
  if (modifiedHTML.includes('<body>')) {
    modifiedHTML = modifiedHTML.replace('<body>', `<body>${inspectorHTML}`);
  } else {
    modifiedHTML = `${modifiedHTML}${inspectorHTML}`;
  }
  
  // Add script to end of body
  if (modifiedHTML.includes('</body>')) {
    modifiedHTML = modifiedHTML.replace('</body>', `${inspectorScript}</body>`);
  } else {
    modifiedHTML = `${modifiedHTML}${inspectorScript}`;
  }
  
  return modifiedHTML;
}

export function addAFrameInspectorToWindow(
  window: Window, 
  config: AFrameInspectorConfig = {}
): void {
  const {
    position = 'top-left',
    buttonSize = 'medium',
    showTooltip = true
  } = config;

  // Check if this is A-Frame content
  const isAframeContent = window.document.querySelector('a-scene') || 
                         window.document.querySelector('script[src*="aframe"]');
  
  if (!isAframeContent) {
    return;
  }

  // Create and inject the inspector button
  const inspectorHTML = createAFrameInspectorHTML(window.document.documentElement.outerHTML, config);
  
  // Replace the document content
  window.document.open();
  window.document.write(inspectorHTML);
  window.document.close();
} 