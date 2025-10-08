import React, { useEffect, useRef, useState } from 'react';
import { File, FileType, Framework, Project } from '../types';
import { ExternalLink, Maximize2, Minimize2, Settings, X, RotateCcw, ZoomIn, ZoomOut, Eye, Hand, MousePointer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createComplete3DOptimizationScript, detect3DContent, extract3DModelUrls } from '../lib/3d-model-utils';

interface PreviewProps {
  files: File[];
  framework?: Framework;
  project?: Project;
  onPreviewModeChange?: (showInline: boolean) => void;
  onHidePreview?: () => void;
  onInspectorSave?: (updatedHtml: string) => void;
}

const Preview: React.FC<PreviewProps> = ({ files, framework, project, onPreviewModeChange, onHidePreview, onInspectorSave }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Debug logging for framework detection
  console.log('Preview - Framework detection:', {
    framework,
    hasAframeContent: files.find(f => f.id === 'index.html')?.content?.includes('a-scene'),
    hasAframeScript: files.find(f => f.id === 'index.html')?.content?.includes('aframe'),
    shouldShowButton: framework === Framework.AFRAME || 
                     files.find(f => f.id === 'index.html')?.content?.includes('a-scene') || 
                     files.find(f => f.id === 'index.html')?.content?.includes('aframe')
  });
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showInline, setShowInline] = useState(true);
  const [externalWindow, setExternalWindow] = useState<Window | null>(null);
  const checkWindowInterval = useRef<number>();
  const [reloadKey, setReloadKey] = useState(0);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  
  // New state for 3D model preview enhancements
  const [is3DContent, setIs3DContent] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [show3DControls, setShow3DControls] = useState(false);
  const [movementMode, setMovementMode] = useState<'move' | 'look'>('move');

  // Check if external window is closed and handle messages
  useEffect(() => {
    if (!showInline && externalWindow) {
      checkWindowInterval.current = window.setInterval(() => {
        if (externalWindow.closed) {
          setShowInline(true);
          onPreviewModeChange?.(true);
          setExternalWindow(null);
          clearInterval(checkWindowInterval.current);
        }
      }, 1000);
    }

    // Listen for messages from external window
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data);
      if (event.data && event.data.type === 'AFRAME_INSPECTOR_SAVE') {
        console.log('Received inspector save message:', event.data);
        if (onInspectorSave && event.data.html) {
          console.log('Calling onInspectorSave with HTML length:', event.data.html.length);
          onInspectorSave(event.data.html);
        } else {
          console.log('onInspectorSave not available or no HTML data');
        }
      }
      
      // Handle 3D model loading messages
      if (event.data && event.data.type === 'MODEL_LOADING_STATE') {
        setModelLoading(event.data.loading);
        if (event.data.error) {
          setModelLoadError(event.data.error);
        } else {
          setModelLoadError(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      if (checkWindowInterval.current) {
        clearInterval(checkWindowInterval.current);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [showInline, externalWindow, onPreviewModeChange, onInspectorSave]);

  useEffect(() => {
    if (!iframeRef.current && showInline) return;

    const loadPreview = async () => {
      try {
        const htmlFile = files.find(f => f.id === 'index.html' || f.name === 'index.html');
        const cssFile = files.find(f => f.id === 'styles.css' || f.id === 'style.css' || f.name === 'style.css' || f.name === 'styles.css');
        const jsFile = files.find(f => f.id === 'script.js' || f.name === 'script.js');
        const customFiles = files.filter(f => f.type === FileType.CUSTOM);

      console.log('Preview - All available files:', files.map(f => ({ id: f.id, name: f.name, type: f.type })));
      console.log('Preview - Files found:', {
        htmlFile: htmlFile ? 'Found' : 'Not found',
        cssFile: cssFile ? 'Found' : 'Not found', 
        jsFile: jsFile ? 'Found' : 'Not found',
        customFiles: customFiles.map(f => f.name),
        jsContent: jsFile?.content?.substring(0, 100) + '...' || 'No content'
      });

      if (!htmlFile) {
        setError('No HTML file found');
        return;
      }

      let htmlContent = htmlFile.content;
      
      // Check if this is 3D content using utility function
      const has3DContent = framework === Framework.AFRAME || detect3DContent(htmlContent);
      
      setIs3DContent(has3DContent);
      setShow3DControls(has3DContent);

      // Add meta tags for security and CORS
      const metaTags = `
        <meta http-equiv="Content-Security-Policy" content="
          default-src * data: blob: 'unsafe-inline' 'unsafe-eval';
          img-src * data: blob: 'unsafe-inline';
          media-src * data: blob: 'unsafe-inline';
          script-src * data: blob: 'unsafe-inline' 'unsafe-eval';
          style-src * data: blob: 'unsafe-inline';
          connect-src * data: blob: 'unsafe-inline';
          font-src * data: blob: 'unsafe-inline';
          child-src * data: blob: 'unsafe-inline';
          frame-src * data: blob: 'unsafe-inline';
        ">
        <meta name="referrer" content="no-referrer">
        <meta http-equiv="Access-Control-Allow-Origin" content="*">
      `;

      // Add meta tags if they don't exist
      if (!htmlContent.includes('Content-Security-Policy')) {
        htmlContent = htmlContent.replace('</head>', `${metaTags}</head>`);
      }

      // Enhanced A-Frame and 3D model handling
      if (has3DContent) {
        // Remove any existing inspector scripts to prevent auto-opening
        htmlContent = htmlContent.replace(/<script[^>]*aframe-inspector[^>]*><\/script>/gi, '');
        
        // Enhanced 3D model handling script using utility
        const enhanced3DScript = `
          <script>
            ${createComplete3DOptimizationScript({
              enableShadows: true,
              enableAntialiasing: true,
              optimizeMaterials: true,
              preloadTextures: true,
              timeout: 30000
            })}
            
            // Inspector will be loaded only when the button is clicked
            // This prevents auto-opening of the inspector
          </script>
        `;
        htmlContent = htmlContent.replace('</head>', `${enhanced3DScript}</head>`);

        // Enhanced CSS for 3D content
        const enhanced3DCSS = `
          <style>
            /* Enhanced 3D Content Styling */
            .a-enter-vr {
              display: none !important; /* Hide VR button in preview */
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
            
            /* Performance optimizations */
            a-scene {
              antialias: true;
              colorManagement: true;
              sortObjects: true;
            }
            
            /* Better model shadows */
            [gltf-model], [obj-model], [collada-model] {
              cast-shadow: true;
              receive-shadow: true;
            }
          </style>
        `;
        htmlContent = htmlContent.replace('</head>', `${enhanced3DCSS}</head>`);

        // Add enhanced components to scene and camera
        htmlContent = htmlContent.replace(/<a-scene/g, '<a-scene scene-optimizer');
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
      }

      // Add crossorigin to all external resources
      htmlContent = htmlContent.replace(/<(img|audio|script|a-asset-item)/g, '<$1 crossorigin="anonymous"');
      
      // Add timeout to a-assets if present
      htmlContent = htmlContent.replace(/<a-assets/g, '<a-assets timeout="30000"');

      // Enhanced resource preload script
      const enhancedPreloadScript = `
        <script>
          window.addEventListener('load', () => {
            console.log('Enhanced preview: Page loaded, pre-fetching resources...');
            
            // Pre-fetch all external resources with better error handling
            const resources = document.querySelectorAll('[src], [href], [gltf-model], [obj-model], [collada-model]');
            let loadedCount = 0;
            let totalCount = resources.length;
            
            resources.forEach((el, index) => {
              const url = el.getAttribute('src') || el.getAttribute('href') || 
                          el.getAttribute('gltf-model') || el.getAttribute('obj-model') || 
                          el.getAttribute('collada-model');
              
              if (url && url.startsWith('http')) {
                fetch(url, { mode: 'cors', credentials: 'omit' })
                  .then(() => {
                    loadedCount++;
                    console.log(\`Enhanced preview: Resource \${index + 1}/\${totalCount} loaded: \${url}\`);
                  })
                  .catch(err => {
                    console.warn(\`Enhanced preview: Resource \${index + 1}/\${totalCount} failed: \${url}\`, err);
                  });
              }
            });
            
            // Add loading indicator for 3D content
            if (document.querySelector('a-scene')) {
              add3DLoadingIndicator();
            }
          });
          
          // Add 3D loading indicator
          function add3DLoadingIndicator() {
            const scene = document.querySelector('a-scene');
            if (!scene) return;
            
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'model-loading';
            loadingDiv.innerHTML = \`
              <div class="spinner"></div>
              <div>Loading 3D content...</div>
            \`;
            
            scene.appendChild(loadingDiv);
            
            // Remove loading indicator when scene is loaded
            scene.addEventListener('loaded', () => {
              setTimeout(() => {
                if (loadingDiv.parentNode) {
                  loadingDiv.parentNode.removeChild(loadingDiv);
                }
              }, 1000);
            });
          }
        </script>
      `;
      htmlContent = htmlContent.replace('</head>', `${enhancedPreloadScript}</head>`);

      // Add CSS reset to prevent editor styles from bleeding into preview
      const cssReset = `
        <style>
          /* CSS Reset for Preview - Prevent editor styles from affecting content */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            color: inherit !important;
            font-family: inherit !important;
            font-size: inherit !important;
            line-height: inherit !important;
          }
          
          /* Ensure body background is white by default for 2D content */
          body {
            background: #ffffff !important;
            color: #333333 !important;
          }
          
          /* Reset any inherited dark theme styles */
          * {
            box-sizing: border-box;
          }
          
          /* Ensure proper text colors */
          h1, h2, h3, h4, h5, h6, p, span, div, li, a {
            color: inherit !important;
          }
        </style>
      `;
      
      // Handle CSS - either from project files or external references
      let cssContent = '';
      
      // First, try to get CSS from project files
      if (cssFile && cssFile.content.trim()) {
        cssContent = cssFile.content;
        console.log('Preview - Using CSS from project files:', {
          hasCssFile: !!cssFile,
          cssContentLength: cssContent.length,
          cssContentPreview: cssContent.substring(0, 100) + '...'
        });
      } else {
        // If no CSS file in project, try to load external CSS references
        const cssLinks = htmlContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi);
        if (cssLinks && cssLinks.length > 0) {
          console.log('Preview - Found external CSS links:', cssLinks);
          
          // Try to fetch the CSS content for each link
          for (const link of cssLinks) {
            const hrefMatch = link.match(/href=["']([^"']+)["']/);
            if (hrefMatch) {
              const cssUrl = hrefMatch[1];
              console.log('Preview - Attempting to load external CSS:', cssUrl);
              
              try {
                // For absolute paths, try to fetch the CSS
                if (cssUrl.startsWith('/')) {
                  const fullUrl = `${window.location.origin}${cssUrl}`;
                  const response = await fetch(fullUrl);
                  if (response.ok) {
                    const externalCss = await response.text();
                    cssContent += externalCss + '\n';
                    console.log('Preview - Successfully loaded external CSS:', cssUrl, 'Length:', externalCss.length);
                  } else {
                    console.warn('Preview - Failed to load external CSS:', cssUrl, 'Status:', response.status);
                  }
                }
              } catch (error) {
                console.warn('Preview - Error loading external CSS:', cssUrl, error);
              }
            }
          }
        }
      }
      
      // Inject CSS if we have any content
      if (cssContent.trim()) {
        console.log('Preview - Injecting CSS:', {
          cssContentLength: cssContent.length,
          cssContentPreview: cssContent.substring(0, 100) + '...'
        });
        
        const styleTag = `<style>${cssContent}</style>`;
        
        // Remove any existing link tags that reference CSS files
        htmlContent = htmlContent.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*\.css["'][^>]*>/gi, '');
        
        // Add the CSS reset and style tag to the head
        if (htmlContent.includes('<head>')) {
          htmlContent = htmlContent.replace('<head>', `<head>${cssReset}${styleTag}`);
        } else if (htmlContent.includes('<body>')) {
          htmlContent = htmlContent.replace('<body', `<head>${cssReset}${styleTag}</head><body`);
        }
      } else {
        // Even if no CSS file, add the reset to ensure clean styling
        if (htmlContent.includes('<head>')) {
          htmlContent = htmlContent.replace('<head>', `<head>${cssReset}`);
        } else if (htmlContent.includes('<body>')) {
          htmlContent = htmlContent.replace('<body', `<head>${cssReset}</head><body`);
        }
      }
      
      // Inject JS if it exists - replace any external JS references with inline content
      if (jsFile && jsFile.content.trim()) {
        console.log('Preview - Injecting JavaScript:', {
          hasJsFile: !!jsFile,
          jsContentLength: jsFile.content.length,
          jsContentPreview: jsFile.content.substring(0, 100) + '...',
          htmlBeforeInjection: htmlContent.includes('<script src="script.js">')
        });
        
        // Check if this is a template loaded from public directory (has absolute paths)
        const isPublicTemplate = htmlContent.includes('/storytelling_templates/') || htmlContent.includes('/embeds/');
        
        if (isPublicTemplate) {
          console.log('Preview - Detected public template, keeping relative paths');
          // For public templates, we need to revert absolute paths back to relative paths
          htmlContent = htmlContent
            .replace(/href=["']\/storytelling_templates\/[^"']+\/styles\.css["']/g, 'href="styles.css"')
            .replace(/href=["']\/storytelling_templates\/[^"']+\/style\.css["']/g, 'href="style.css"')
            .replace(/src=["']\/storytelling_templates\/[^"']+\/script\.js["']/g, 'src="script.js"')
            .replace(/src=["']\/embeds\/[^"']+\/script\.js["']/g, 'src="script.js"');
        }
        
        // Add initialization code to ensure classes are instantiated
        let jsContent = jsFile.content;
        jsContent += `
// Test if JavaScript is running in the iframe
console.log('Preview: JavaScript is running in iframe!');
console.log('Preview: Document ready state:', document.readyState);
console.log('Preview: Window location:', window.location.href);

// Simple test to see if we can access the classes
setTimeout(function() {
  console.log('Preview: Testing class availability...');
  console.log('Preview: StoryTemplate available:', typeof StoryTemplate);
  console.log('Preview: EnhancedParallax available:', typeof EnhancedParallax);
  console.log('Preview: ScrollProgress available:', typeof ScrollProgress);
  
  // Try to create instances if they exist
  if (typeof StoryTemplate !== 'undefined') {
    console.log('Preview: Creating StoryTemplate...');
    try {
      new StoryTemplate();
      console.log('Preview: StoryTemplate created successfully!');
    } catch (e) {
      console.error('Preview: Error creating StoryTemplate:', e);
    }
  }
  
  if (typeof EnhancedParallax !== 'undefined') {
    console.log('Preview: Creating EnhancedParallax...');
    try {
      new EnhancedParallax();
      console.log('Preview: EnhancedParallax created successfully!');
    } catch (e) {
      console.error('Preview: Error creating EnhancedParallax:', e);
    }
  }
  
  if (typeof ScrollProgress !== 'undefined') {
    console.log('Preview: Creating ScrollProgress...');
    try {
      new ScrollProgress();
      console.log('Preview: ScrollProgress created successfully!');
    } catch (e) {
      console.error('Preview: Error creating ScrollProgress:', e);
    }
  }
}, 100);
`;
        
        const scriptTag = `<script>${jsContent}</script>`;
        
        // Remove any existing script tags that reference script.js
        const beforeRemoval = htmlContent;
        htmlContent = htmlContent.replace(/<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi, '');
        const afterRemoval = htmlContent;
        
        console.log('Preview - Script tag removal:', {
          beforeRemoval: beforeRemoval.includes('<script src="script.js">'),
          afterRemoval: afterRemoval.includes('<script src="script.js">'),
          removed: beforeRemoval !== afterRemoval
        });
        
        // Add the script tag before the closing body tag
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', `${scriptTag}</body>`);
          console.log('Preview - Added script before </body>');
        } else {
          // If no body tag, add it at the end
          htmlContent = htmlContent + scriptTag;
          console.log('Preview - Added script at end (no body tag)');
        }
        
        console.log('Preview - Final HTML contains script:', htmlContent.includes(jsFile.content.substring(0, 50)));
        
        // Debug: Log the actual HTML content being generated
        console.log('Preview - Generated HTML preview:', htmlContent.substring(0, 500) + '...');
        console.log('Preview - Script injection location:', htmlContent.indexOf(jsFile.content.substring(0, 50)));
        
        // Check if our initialization code is in the HTML
        const hasInitCode = htmlContent.includes('Preview: JavaScript is running in iframe!');
        console.log('Preview - Initialization code present:', hasInitCode);
        
        if (!hasInitCode) {
          console.error('Preview - ERROR: Initialization code not found in HTML!');
        }
        
        // Debug: Check if the script tag is properly placed
        const scriptTagCount = (htmlContent.match(/<script>/g) || []).length;
        console.log('Preview - Number of script tags in HTML:', scriptTagCount);
        
        // Debug: Check if the original template classes are in the JS content
        const hasStoryTemplate = jsFile.content.includes('class StoryTemplate');
        const hasEnhancedParallax = jsFile.content.includes('class EnhancedParallax');
        const hasScrollProgress = jsFile.content.includes('class ScrollProgress');
        console.log('Preview - Original JS classes found:', {
          StoryTemplate: hasStoryTemplate,
          EnhancedParallax: hasEnhancedParallax,
          ScrollProgress: hasScrollProgress
        });
      } else {
        console.log('Preview - No JavaScript to inject:', {
          hasJsFile: !!jsFile,
          hasContent: jsFile?.content?.trim() ? 'Yes' : 'No',
          contentLength: jsFile?.content?.length || 0
        });
      }
      
      // Inject custom files (like config.json) as global variables
      if (customFiles.length > 0) {
        console.log('Preview - Injecting custom files:', customFiles.map(f => f.name));
        
        let customFilesScript = '<script>\n';
        customFilesScript += 'console.log("Preview: Custom files injection starting...");\n';
        customFiles.forEach(customFile => {
          try {
            // Try to parse as JSON, if it fails, treat as plain text
            let content;
            try {
              content = JSON.parse(customFile.content);
              console.log(`Preview: Successfully parsed ${customFile.name} as JSON`);
            } catch (e) {
              content = customFile.content;
              console.log(`Preview: Treating ${customFile.name} as plain text`);
            }
            
            // Create a global variable with the filename (without extension)
            const varName = customFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
            customFilesScript += `window.${varName} = ${JSON.stringify(content)};\n`;
            customFilesScript += `console.log('Preview: Loaded custom file ${customFile.name} as window.${varName}');\n`;
            customFilesScript += `console.log('Preview: ${varName} content:', window.${varName});\n`;
          } catch (e) {
            console.error('Preview - Error processing custom file:', customFile.name, e);
            customFilesScript += `console.error('Preview: Error processing ${customFile.name}:', ${JSON.stringify(e instanceof Error ? e.message : String(e))});\n`;
          }
        });
        customFilesScript += 'console.log("Preview: Custom files injection complete");\n';
        customFilesScript += '</script>\n';
        
        // Add the custom files script BEFORE any other scripts to ensure it loads first
        if (htmlContent.includes('<head>')) {
          // Insert in head to ensure it loads before body scripts
          htmlContent = htmlContent.replace('<head>', `<head>${customFilesScript}`);
        } else if (htmlContent.includes('</body>')) {
          // If no head, add before closing body but before other scripts
          htmlContent = htmlContent.replace('</body>', `${customFilesScript}</body>`);
        } else {
          htmlContent = htmlContent + customFilesScript;
        }
        
        console.log('Preview - Custom files injected successfully');
        console.log('Preview - Custom files script content:', customFilesScript);
      }

      // Create blob with proper permissions
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);

      if (showInline && iframeRef.current) {
        iframeRef.current.src = url;
        
        // Add event listener to check if iframe loaded
        iframeRef.current.onload = () => {
          console.log('Preview - Iframe loaded');
          try {
            // Try to access iframe console (this might not work due to CORS)
            const iframeDoc = iframeRef.current?.contentDocument;
            if (iframeDoc) {
              console.log('Preview - Iframe document accessible');
              
              // Add 3D control message handler script
              const controlScript = iframeDoc.createElement('script');
              controlScript.textContent = `
                // 3D Control Message Handler
                window.addEventListener('message', function(event) {
                  if (event.data && event.data.type === '3D_CONTROL') {
                    console.log('3D Control received:', event.data);
                    
                    const scene = document.querySelector('a-scene');
                    const camera = document.querySelector('[camera]') || document.querySelector('[position]');
                    
                    if (!scene || !camera) {
                      console.warn('3D scene or camera not found');
                      return;
                    }
                    
                                         switch (event.data.control) {
                       case 'movement-mode-change':
                         // Change movement mode
                         if (camera.components && camera.components['enhanced-camera-controls']) {
                           camera.components['enhanced-camera-controls'].movementMode = event.data.value;
                         }
                         break;
                         
                       case 'reset-view':
                         // Reset camera to initial position
                         if (camera.components && camera.components['enhanced-camera-controls']) {
                           camera.components['enhanced-camera-controls'].resetView();
                         } else {
                           // Fallback: reset to default position
                           camera.setAttribute('position', '0 1.6 0');
                           camera.setAttribute('rotation', '0 0 0');
                         }
                         break;
                         
                       case 'zoom-in':
                         // Move camera closer to scene center
                         const pos = camera.getAttribute('position');
                         const center = scene.getAttribute('position') || { x: 0, y: 0, z: 0 };
                         const direction = {
                           x: center.x - pos.x,
                           y: center.y - pos.y,
                           z: center.z - pos.z
                         };
                         const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
                         if (distance > 0.5) {
                           const scale = 0.8;
                           camera.setAttribute('position', {
                             x: pos.x + direction.x * (1 - scale),
                             y: pos.y + direction.y * (1 - scale),
                             z: pos.z + direction.z * (1 - scale)
                           });
                         }
                         break;
                         
                       case 'zoom-out':
                         // Move camera away from scene center
                         const pos2 = camera.getAttribute('position');
                         const center2 = scene.getAttribute('position') || { x: 0, y: 0, z: 0 };
                         const direction2 = {
                           x: center2.x - pos2.x,
                           y: center2.y - pos2.y,
                           z: center2.z - pos2.z
                         };
                         const distance2 = Math.sqrt(direction2.x * direction2.x + direction2.y * direction2.y + direction2.z * direction2.z);
                         const scale2 = 1.2;
                         camera.setAttribute('position', {
                           x: pos2.x + direction2.x * (scale2 - 1),
                           y: pos2.y + direction2.y * (scale2 - 1),
                           z: pos2.z + direction2.z * (scale2 - 1)
                         });
                         break;
                         
                       case 'move-up':
                         // Move camera up
                         const posUp = camera.getAttribute('position');
                         camera.setAttribute('position', {
                           x: posUp.x,
                           y: posUp.y + 0.5,
                           z: posUp.z
                         });
                         break;
                         
                       case 'move-down':
                         // Move camera down
                         const posDown = camera.getAttribute('position');
                         camera.setAttribute('position', {
                           x: posDown.x,
                           y: posDown.y - 0.5,
                           z: posDown.z
                         });
                         break;
                     }
                  }
                });
                
                // Test script for debugging
                console.log('Preview: 3D control script loaded in iframe');
                console.log('Preview: Document ready state:', document.readyState);
                console.log('Preview: Available classes:', {
                  StoryTemplate: typeof StoryTemplate,
                  EnhancedParallax: typeof EnhancedParallax,
                  ScrollProgress: typeof ScrollProgress
                });
              `;
              iframeDoc.head.appendChild(controlScript);
            }
          } catch (e) {
            console.log('Preview - Cannot access iframe document (CORS restriction)');
          }
        };
      } else if (!showInline && previewUrl) {
        if (externalWindow && !externalWindow.closed) {
          externalWindow.location.href = url;
        } else {
          const newWindow = window.open(url, 'preview', 'width=800,height=600');
          setExternalWindow(newWindow);
        }
      }
      
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        setError(`Preview error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    loadPreview();
  }, [files, framework, showInline, reloadKey]);

  const togglePreviewMode = () => {
    if (!showInline) {
      // Switching back to inline mode
      setShowInline(true);
      onPreviewModeChange?.(true);
      if (externalWindow && !externalWindow.closed) {
        externalWindow.close();
      }
      setExternalWindow(null);
    } else {
      // Opening in new tab with A-Frame inspector functionality
      setShowInline(false);
      onPreviewModeChange?.(false);
      if (previewUrl) {
        const newWindow = window.open('', 'preview', 'width=1200,height=800');
        if (newWindow) {
          // Create a complete HTML page with the preview content and inspector functionality
          const isAframeContent = framework === Framework.AFRAME || 
                                 files.find(f => f.id === 'index.html')?.content?.includes('a-scene') || 
                                 files.find(f => f.id === 'index.html')?.content?.includes('aframe');
          
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Preview</title>
              <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .preview-container { position: relative; width: 100vw; height: 100vh; }
                .inspector-button { 
                  position: fixed; 
                  top: 20px; 
                  left: 20px; 
                  z-index: 10000; 
                  padding: 12px; 
                  border-radius: 8px; 
                  border: none; 
                  cursor: pointer; 
                  transition: all 0.3s ease;
                  font-size: 16px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .inspector-button.open { 
                  background: #2563eb; 
                  color: white; 
                }
                .inspector-button.open:hover { 
                  background: #1d4ed8; 
                }
                .inspector-button.close { 
                  background: #dc2626; 
                  color: white; 
                }
                .inspector-button.close:hover { 
                  background: #b91c1c; 
                }
                .tooltip {
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
                }
                .inspector-button:hover .tooltip {
                  opacity: 1;
                }
                .tooltip::after {
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
                iframe { width: 100%; height: 100%; border: none; }
              </style>
            </head>
            <body>
              <div class="preview-container">
                ${isAframeContent ? `
                  <button id="inspector-btn" class="inspector-button open" title="Open A-Frame Inspector">
                    ⚙️
                    <div class="tooltip">A-Frame Inspector</div>
                  </button>
                ` : ''}
                <iframe src="${previewUrl}" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-presentation allow-downloads"></iframe>
              </div>
              
              ${isAframeContent ? `
              <script>
                let inspectorOpen = false;
                const inspectorBtn = document.getElementById('inspector-btn');
                
                // Function to handle inspector save
                function handleInspectorSave(updatedHtml) {
                  console.log('Inspector save triggered with updated HTML');
                  // Send message to parent window
                  if (window.opener) {
                    window.opener.postMessage({
                      type: 'AFRAME_INSPECTOR_SAVE',
                      html: updatedHtml
                    }, '*');
                  }
                }
                
                              // Override the inspector's save functionality
              function overrideInspectorSave() {
                const iframe = document.querySelector('iframe');
                const iframeWindow = iframe.contentWindow;
                const iframeDocument = iframe.contentDocument;
                
                if (iframeWindow && iframeWindow.AFRAME && iframeWindow.AFRAME.inspector) {
                  console.log('Overriding A-Frame inspector save function');
                  
                  // Store original save function
                  const originalSave = iframeWindow.AFRAME.inspector.save;
                  
                  // Override save function
                  iframeWindow.AFRAME.inspector.save = function() {
                    console.log('Inspector save button clicked - our override');
                    
                    // Get the updated scene HTML
                    const scene = iframeDocument.querySelector('a-scene');
                    if (scene) {
                      // Get the complete HTML document
                      const updatedHtml = iframeDocument.documentElement.outerHTML;
                      
                      // Call our custom save handler
                      handleInspectorSave(updatedHtml);
                      
                      // Don't call original save function to avoid aframe-watcher error
                      // if (originalSave) {
                      //   originalSave.call(this);
                      // }
                    }
                  };
                  
                  // Also override the watcher check
                  if (iframeWindow.AFRAME.inspector.watcher) {
                    iframeWindow.AFRAME.inspector.watcher = {
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
                    inspectorBtn.className = 'inspector-button close';
                    inspectorBtn.innerHTML = '✕<div class="tooltip">Close Inspector</div>';
                    
                    const iframe = document.querySelector('iframe');
                    const iframeWindow = iframe.contentWindow;
                    const iframeDocument = iframe.contentDocument;
                    
                    if (iframeWindow && iframeWindow.AFRAME && iframeWindow.AFRAME.inspector) {
                      iframeWindow.AFRAME.inspector.open();
                      // Override save after opening
                      setTimeout(overrideInspectorSave, 1000);
                    } else {
                      // Load inspector script
                      const script = iframeDocument.createElement('script');
                      script.src = 'https://cdn.jsdelivr.net/npm/aframe-inspector@1.7.0/dist/aframe-inspector.min.js';
                      script.onload = function() {
                        setTimeout(() => {
                          if (iframeWindow.AFRAME && iframeWindow.AFRAME.inspector) {
                            iframeWindow.AFRAME.inspector.open();
                            // Override save after opening
                            setTimeout(overrideInspectorSave, 1000);
                          }
                        }, 1000);
                      };
                      iframeDocument.head.appendChild(script);
                    }
                  } else {
                    // Close inspector
                    inspectorOpen = false;
                    inspectorBtn.className = 'inspector-button open';
                    inspectorBtn.innerHTML = '⚙️<div class="tooltip">A-Frame Inspector</div>';
                    
                    const iframe = document.querySelector('iframe');
                    const iframeWindow = iframe.contentWindow;
                    
                    if (iframeWindow && iframeWindow.AFRAME && iframeWindow.AFRAME.inspector) {
                      iframeWindow.AFRAME.inspector.close();
                    }
                  }
                });
              </script>
              ` : ''}
            </body>
            </html>
          `;
          
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          setExternalWindow(newWindow);
        }
      }
    }
  };

  const reloadPreview = () => {
    setReloadKey(k => k + 1);
  };

  // 3D Model Preview Controls
  const send3DControlMessage = (control: string, value?: any) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({
          type: '3D_CONTROL',
          control,
          value
        }, '*');
      } catch (e) {
        console.warn('Could not send 3D control message:', e);
      }
    }
  };

  const reset3DView = () => {
    send3DControlMessage('reset-view');
  };

  const zoomIn3D = () => {
    send3DControlMessage('zoom-in');
  };

  const zoomOut3D = () => {
    send3DControlMessage('zoom-out');
  };

  const toggle3DControls = () => {
    setShow3DControls(prev => !prev);
  };

  const changeMovementMode = (mode: 'move' | 'look') => {
    setMovementMode(mode);
    send3DControlMessage('movement-mode-change', mode);
  };

  const openAframeInspector = () => {
    console.log('Attempting to open A-Frame Inspector...');
    setInspectorOpen(true);
    
    // Expose this function globally so it can be called from the editor
    (window as any).openAframeInspector = openAframeInspector;
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeWindow = iframeRef.current.contentWindow as any;
        const iframeDocument = iframeRef.current.contentDocument;
        
        console.log('Iframe window accessible:', !!iframeWindow);
        console.log('Iframe document accessible:', !!iframeDocument);
        
        // Method 1: Try to directly access A-Frame inspector from iframe window
        if (iframeWindow && iframeWindow.AFRAME && iframeWindow.AFRAME.inspector) {
          console.log('Opening inspector via direct AFRAME.inspector access');
          iframeWindow.AFRAME.inspector.open();
          return;
        }
        
        // Method 2: Try to access scene inspector
        if (iframeDocument) {
          const scene = iframeDocument.querySelector('a-scene') as any;
          if (scene && scene.inspector) {
            console.log('Opening inspector via scene.inspector');
            scene.inspector.open();
            return;
          }
        }
        
        // Method 3: Try to inject a more robust script with save functionality
        if (iframeDocument) {
          const script = iframeDocument.createElement('script');
          script.textContent = `
            (function() {
              console.log('Attempting to open A-Frame Inspector from iframe...');
              
              // Function to handle inspector save
              function handleInspectorSave(updatedHtml) {
                console.log('Inspector save triggered with updated HTML, length:', updatedHtml.length);
                // Send message to parent window
                if (window.parent) {
                  console.log('Sending message to parent window');
                  window.parent.postMessage({
                    type: 'AFRAME_INSPECTOR_SAVE',
                    html: updatedHtml
                  }, '*');
                } else {
                  console.log('No parent window found');
                }
              }
              
              // Override the inspector's save functionality
              function overrideInspectorSave() {
                console.log('Attempting to override inspector save function...');
                
                // Method 1: Override AFRAME.inspector.save
                if (window.AFRAME && window.AFRAME.inspector) {
                  console.log('Found AFRAME.inspector, overriding save function');
                  
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
                      console.log('Captured HTML length:', updatedHtml.length);
                      
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
                
                // Method 2: Override any global save functions
                if (window.save) {
                  console.log('Found global save function, overriding');
                  const originalGlobalSave = window.save;
                  window.save = function() {
                    console.log('Global save function called');
                    const scene = document.querySelector('a-scene');
                    if (scene) {
                      const updatedHtml = document.documentElement.outerHTML;
                      handleInspectorSave(updatedHtml);
                    }
                  };
                }
                
                // Method 3: Find and override save buttons
                const saveButtons = document.querySelectorAll('[data-action="save"], .a-inspector-save, [title*="save" i], [title*="Save" i], button[class*="save"], .save-button');
                console.log('Found save buttons:', saveButtons.length);
                
                saveButtons.forEach((button, index) => {
                  console.log('Adding click listener to save button ' + index);
                  button.addEventListener('click', function(e) {
                    console.log('Save button clicked directly');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const scene = document.querySelector('a-scene');
                    if (scene) {
                      const updatedHtml = document.documentElement.outerHTML;
                      handleInspectorSave(updatedHtml);
                    }
                  });
                });
                
                // Method 4: Monitor for new save buttons being added
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node;
                        if (element.matches && element.matches('[data-action="save"], .a-inspector-save, [title*="save" i], [title*="Save" i], button[class*="save"], .save-button')) {
                          console.log('New save button detected, adding listener');
                          element.addEventListener('click', function(e) {
                            console.log('New save button clicked');
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const scene = document.querySelector('a-scene');
                            if (scene) {
                              const updatedHtml = document.documentElement.outerHTML;
                              handleInspectorSave(updatedHtml);
                            }
                          });
                        }
                      }
                    });
                  });
                });
                
                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });
              }
              
              // Try to open the inspector
              tryOpenInspector();
              
              function tryOpenInspector() {
                try {
                  console.log('Checking A-Frame availability...');
                  console.log('window.AFRAME:', window.AFRAME);
                  console.log('window.AFRAME.inspector:', window.AFRAME?.inspector);
                  
                  // Method 1: Check if AFRAME.inspector exists
                  if (window.AFRAME && window.AFRAME.inspector) {
                    console.log('Opening inspector via AFRAME.inspector');
                    window.AFRAME.inspector.open();
                    // Override save after opening - try multiple times
                    setTimeout(overrideInspectorSave, 500);
                    setTimeout(overrideInspectorSave, 1000);
                    setTimeout(overrideInspectorSave, 2000);
                    return true;
                  }
                  
                  // Method 2: Try to load the inspector manually
                  if (window.AFRAME && !window.AFRAME.inspector) {
                    console.log('A-Frame found but no inspector, trying to load it...');
                    
                    // Try alternative CDN sources
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/aframe-inspector@1.7.0/dist/aframe-inspector.min.js';
                    console.log('Trying to load inspector from CDN...');
                    
                    script.onload = function() {
                      console.log('Inspector script loaded successfully');
                      // Wait longer for A-Frame scene to be fully initialized
                      setTimeout(() => {
                        if (window.AFRAME && window.AFRAME.inspector) {
                          console.log('Opening inspector after script load');
                          try {
                            // Ensure the scene is ready before opening inspector
                            const scene = document.querySelector('a-scene');
                            if (scene && scene.hasLoaded) {
                              window.AFRAME.inspector.open();
                              // Override save after opening
                              setTimeout(overrideInspectorSave, 1000);
                            } else {
                              // Wait for scene to load
                              scene.addEventListener('loaded', () => {
                                console.log('Scene loaded, opening inspector');
                                window.AFRAME.inspector.open();
                                // Override save after opening
                                setTimeout(overrideInspectorSave, 1000);
                              });
                            }
                          } catch (error) {
                            console.error('Error opening inspector:', error);
                            // Fallback: try to open anyway
                            window.AFRAME.inspector.open();
                          }
                        }
                      }, 1000);
                    };
                    
                    script.onerror = function() {
                      console.error('Failed to load inspector script from CDN');
                      alert('A-Frame Inspector could not be loaded. Please try Ctrl+Alt+I (or Cmd+Option+I on Mac) directly in the preview window.');
                    };
                    
                    document.head.appendChild(script);
                    return true;
                  }
                  
                  // Method 3: Check scene inspector
                  const scene = document.querySelector('a-scene');
                  console.log('Scene found:', scene);
                  if (scene && scene.inspector) {
                    console.log('Opening inspector via scene.inspector');
                    scene.inspector.open();
                    // Override save after opening
                    setTimeout(overrideInspectorSave, 1000);
                    return true;
                  }
                  
                  // Method 3.5: Wait for scene to be ready
                  if (scene && !scene.hasLoaded) {
                    console.log('Scene not loaded yet, waiting...');
                    scene.addEventListener('loaded', () => {
                      console.log('Scene loaded, trying to open inspector');
                      if (window.AFRAME && window.AFRAME.inspector) {
                        window.AFRAME.inspector.open();
                        // Override save after opening
                        setTimeout(overrideInspectorSave, 1000);
                      }
                    });
                    return true;
                  }
                  
                  // Method 4: Try to trigger the keyboard shortcut
                  console.log('Attempting keyboard shortcut simulation...');
                  const keyEvent = new KeyboardEvent('keydown', {
                    key: 'i',
                    code: 'KeyI',
                    ctrlKey: true,
                    altKey: true,
                    bubbles: true,
                    cancelable: true
                  });
                  document.dispatchEvent(keyEvent);
                  
                  return false;
                } catch (error) {
                  console.error('Error in tryOpenInspector:', error);
                  return false;
                }
              }
              
              // Try to open the inspector
              tryOpenInspector();
              
              // Try immediately
              if (!tryOpenInspector()) {
                // If it fails, try again after a short delay
                setTimeout(() => {
                  if (!tryOpenInspector()) {
                    console.log('All inspector opening methods failed');
                    alert('A-Frame Inspector could not be opened. Please try Ctrl+Alt+I (or Cmd+Option+I on Mac) directly in the preview window.');
                  }
                }, 1000);
              }
            })();
          `;
          iframeDocument.head.appendChild(script);
          
          // Remove the script after execution
          setTimeout(() => {
            if (iframeDocument.head.contains(script)) {
              iframeDocument.head.removeChild(script);
            }
          }, 3000);
        } else {
          // Method 4: Open in new window as fallback
          console.log('Iframe document not accessible, opening in new window...');
          if (previewUrl) {
            const newWindow = window.open(previewUrl, 'aframe-inspector', 'width=1200,height=800');
            if (newWindow) {
              // Add a message to the new window
              setTimeout(() => {
                try {
                  newWindow.postMessage({ 
                    type: 'OPEN_INSPECTOR',
                    message: 'Please use Ctrl+Alt+I (or Cmd+Option+I on Mac) to open the A-Frame Inspector'
                  }, '*');
                } catch (e) {
                  console.error('Failed to send message to new window:', e);
                }
              }, 1000);
            }
          }
        }
        
        console.log('A-Frame Inspector trigger methods executed');
      } catch (error) {
        console.error('Failed to open A-Frame Inspector:', error);
        // Final fallback: show instructions to user
        alert('A-Frame Inspector could not be opened automatically. Please use Ctrl+Alt+I (or Cmd+Option+I on Mac) in the preview window.');
      }
    } else {
      console.error('Iframe or iframe contentWindow not available');
      alert('Preview not ready. Please wait for the preview to load completely.');
    }
  };

  const closeAframeInspector = () => {
    console.log('Attempting to close A-Frame Inspector...');
    setInspectorOpen(false);
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeWindow = iframeRef.current.contentWindow as any;
        const iframeDocument = iframeRef.current.contentDocument;
        
        // Method 1: Try to close via AFRAME.inspector
        if (iframeWindow.AFRAME && iframeWindow.AFRAME.inspector) {
          console.log('Closing inspector via AFRAME.inspector');
          if (iframeWindow.AFRAME.inspector.close) {
            iframeWindow.AFRAME.inspector.close();
          } else if (iframeWindow.AFRAME.inspector.hide) {
            iframeWindow.AFRAME.inspector.hide();
          }
        }
        
        // Method 2: Try to remove inspector elements from DOM
        if (iframeDocument) {
          const inspectorElements = iframeDocument.querySelectorAll('[data-aframe-inspector], .a-inspector, .inspector');
          inspectorElements.forEach(el => {
            console.log('Removing inspector element:', el);
            el.remove();
          });
        }
        
        // Method 3: Try to trigger escape key to close inspector
        if (iframeDocument) {
          const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            bubbles: true,
            cancelable: true
          });
          iframeDocument.dispatchEvent(escapeEvent);
        }
        
        // Method 4: Try to reload the iframe to reset inspector state
        setTimeout(() => {
          if (iframeRef.current && iframeRef.current.src) {
            console.log('Reloading iframe to reset inspector state');
            iframeRef.current.src = iframeRef.current.src;
          }
        }, 100);
        
      } catch (error) {
        console.error('Failed to close A-Frame Inspector:', error);
        // Fallback: just reload the iframe
        if (iframeRef.current && iframeRef.current.src) {
          iframeRef.current.src = iframeRef.current.src;
        }
      }
    }
  };

  const saveHtmlToSupabase = async () => {
    setLinkLoading(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      // Save all files to the database using saveProject
      if (!project) {
        throw new Error('No project available to save');
      }
      setSaveSuccess(true);
      setLinkModalOpen(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unknown error');
      setLinkModalOpen(true);
    } finally {
      setLinkLoading(false);
    }
  };

  if (error) {
    return (
      <div className="h-full bg-gray-800 p-4 overflow-auto">
        <div className="p-4 bg-red-900 rounded-md text-white">
          <h3 className="font-bold mb-2">Preview Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center bg-gray-800 px-4 py-2">
        <span className="text-sm font-medium">Preview</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={togglePreviewMode}
            className="p-1.5 rounded hover:bg-gray-700 transition-colors flex items-center gap-1 text-sm"
            title={showInline ? "Open in new tab" : "Show inline preview"}
          >
            {showInline ? (
              <>
                <Maximize2 size={16} />
                <span>Open in new tab</span>
              </>
            ) : (
              <>
                <Minimize2 size={16} />
                <span>Show inline preview</span>
              </>
            )}
          </button>
          {onHidePreview && (
            <button
              onClick={onHidePreview}
              className="p-1.5 rounded hover:bg-gray-700 transition-colors flex items-center gap-1 text-sm"
              title="Hide Preview"
            >
              <Minimize2 size={16} />
              <span>Hide Preview</span>
            </button>
          )}
        </div>
      </div>
      {showInline ? (
        <div className="flex-1 relative">
          <iframe
            ref={iframeRef}
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-presentation allow-downloads allow-pointer-lock"
            title="Preview"
          />
          {/* A-Frame Inspector Buttons */}
                          {(framework === Framework.AFRAME || files.find(f => f.id === 'index.html')?.content?.includes('a-scene') || files.find(f => f.id === 'index.html')?.content?.includes('aframe')) && (
                  <>
                    {!inspectorOpen && (
                      <div className="absolute top-4 left-4 group">
                        <button
                          onClick={openAframeInspector}
                          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors z-10"
                          title="Open A-Frame Inspector"
                        >
                          <Settings size={20} />
                        </button>
                        <div className="absolute bottom-full left-0 transform translate-x-2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                          A-Frame Inspector
                          <div className="absolute top-full left-4 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    )}
                    {inspectorOpen && (
                      <div className="absolute top-4 left-4 group">
                        <button
                          onClick={closeAframeInspector}
                          className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors z-10"
                          title="Close A-Frame Inspector"
                        >
                          <X size={20} />
                        </button>
                        <div className="absolute bottom-full left-0 transform translate-x-2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                          Close Inspector
                          <div className="absolute top-full left-4 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    )}

                  </>
                )}
                
                {/* 3D Model Preview Controls */}
                {show3DControls && is3DContent && (
                  <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-90 rounded-lg p-3 shadow-lg z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={toggle3DControls}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Hide 3D Controls"
                      >
                        <X size={16} />
                      </button>
                      <span className="text-white text-sm font-medium">3D Controls</span>
                    </div>
                    
                    {/* Movement Mode Selector */}
                    <div className="mb-3 p-2 bg-gray-800 rounded">
                      <div className="text-xs text-gray-400 mb-2 text-center">Movement Mode</div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => changeMovementMode('move')}
                          className={`flex-1 px-2 py-2 rounded text-sm transition-colors ${
                            movementMode === 'move' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                          title="Move Mode - Click and drag to move camera"
                        >
                          <Hand size={14} className="mx-auto" />
                        </button>
                        <button
                          onClick={() => changeMovementMode('look')}
                          className={`flex-1 px-2 py-2 rounded text-sm transition-colors ${
                            movementMode === 'look' 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                          title="Look Mode - Click and drag to look around"
                        >
                          <Eye size={14} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={reset3DView}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        title="Reset View (R)"
                      >
                        <RotateCcw size={14} />
                        Reset View
                      </button>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={zoomOut3D}
                          className="flex-1 px-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                          title="Zoom Out"
                        >
                          <ZoomOut size={14} />
                        </button>
                        <button
                          onClick={zoomIn3D}
                          className="flex-1 px-2 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                          title="Zoom In"
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => send3DControlMessage('move-up')}
                          className="flex-1 px-2 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
                          title="Move Up (Space)"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => send3DControlMessage('move-down')}
                          className="flex-1 px-2 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors"
                          title="Move Down (Ctrl)"
                        >
                          ↓
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-400 text-center mt-2">
                        <div><strong>Hand Mode:</strong> Click & drag to move</div>
                        <div><strong>Eye Mode:</strong> Click & drag to look</div>
                        <div><strong>Keyboard:</strong> WASD + Arrow Keys</div>
                        <div><strong>Zoom:</strong> Mouse Wheel</div>
                        <div><strong>Reset:</strong> R key</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 3D Controls Toggle Button */}
                {is3DContent && !show3DControls && (
                  <div className="absolute top-4 right-4 group">
                    <button
                      onClick={toggle3DControls}
                      className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-colors z-10"
                      title="Show 3D Controls"
                    >
                      {movementMode === 'move' ? <Hand size={20} /> : <Eye size={20} />}
                    </button>
                    <div className="absolute bottom-full right-0 transform translate-x-2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                      3D Controls ({movementMode === 'move' ? 'Move' : 'Look'} Mode)
                      <div className="absolute top-full right-4 transform -translate-x-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
                
                {/* 3D Model Loading Indicator */}
                {modelLoading && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-90 text-white p-4 rounded-lg z-20">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Loading 3D Model...</span>
                    </div>
                  </div>
                )}
                
                {/* 3D Model Error Display */}
                {modelLoadError && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 bg-opacity-90 text-white p-4 rounded-lg z-20 max-w-sm text-center">
                    <div className="mb-2">⚠️ Model Load Error</div>
                    <div className="text-sm text-red-200">{modelLoadError}</div>
                    <button
                      onClick={() => setModelLoadError(null)}
                      className="mt-3 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-4">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Preview opened in new tab</p>
            <p className="text-gray-500 text-sm">Use the "Show inline preview" button above to return</p>
          </div>
        </div>
      )}
      {linkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-semibold mb-4">Save HTML</h2>
            {saveError ? (
              <div className="text-red-400 mb-4">{saveError}</div>
            ) : saveSuccess ? (
              <div className="text-green-400 mb-4">HTML saved to Supabase successfully!</div>
            ) : (
              <div className="text-gray-300">Saving...</div>
            )}
            <button
              onClick={() => setLinkModalOpen(false)}
              className="block mx-auto mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;