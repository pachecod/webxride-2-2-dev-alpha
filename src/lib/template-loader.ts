import { Project, Framework, FileType } from '../types';

export interface TemplateInfo {
  id: string;
  title: string;
  path: string;
  type: string;
}

function toAbsolutePath(assetPath: string, basePath: string): string {
  if (!assetPath || assetPath.startsWith('http') || assetPath.startsWith('data:') || assetPath.startsWith('blob:') || assetPath.startsWith('/')) {
    return assetPath;
  }
  // Remove leading './' or '../' for simplicity (could be improved)
  if (assetPath.startsWith('./')) assetPath = assetPath.slice(2);
  if (assetPath.startsWith('../')) assetPath = assetPath.replace(/^\.\.\//, '');
  return basePath + '/' + assetPath;
}

function rewriteHtmlAssetPaths(html: string, basePath: string): string {
  // Rewrite src/href in script, link, img, audio, source, iframe, etc.
  return html
    // src="..."
    .replace(/(<(?:script|img|audio|source|iframe)[^>]+src=["'])([^"']+)(["'])/gi, (m, p1, p2, p3) => p1 + toAbsolutePath(p2, basePath) + p3)
    // href="..." (for link, a)
    .replace(/(<(?:link|a)[^>]+href=["'])([^"']+)(["'])/gi, (m, p1, p2, p3) => p1 + toAbsolutePath(p2, basePath) + p3)
    // srcset="..."
    .replace(/(<img[^>]+srcset=["'])([^"']+)(["'])/gi, (m, p1, p2, p3) => {
      // srcset can have multiple comma-separated URLs
      const rewritten = p2.split(',').map((part: string) => {
        const [url, size] = part.trim().split(' ');
        return toAbsolutePath(url, basePath) + (size ? ' ' + size : '');
      }).join(', ');
      return p1 + rewritten + p3;
    });
}

function rewriteCssAssetPaths(css: string, basePath: string): string {
  // Rewrite url(...) in CSS
  return css.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (m, quote, url) => {
    return 'url(' + quote + toAbsolutePath(url, basePath) + quote + ')';
  });
}

export async function loadTemplateFromPublicPath(templatePath: string): Promise<Project> {
  try {
    console.log(`Loading template from public path: ${templatePath}`);
    
    // Fetch the main HTML file
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    let htmlContent = await response.text();
    const basePath = templatePath.replace(/\/index.html$/, '');
    htmlContent = rewriteHtmlAssetPaths(htmlContent, basePath);
    
    // Extract title from HTML
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Template';
    
    const files = [
      {
        id: 'index.html',
        name: 'index.html',
        type: FileType.HTML,
        content: htmlContent
      }
    ];
    
    // Try to load style.css
    for (const cssName of ['styles.css', 'style.css']) {
      try {
        const cssUrl = `${basePath}/${cssName}`;
        console.log(`Template loader: Trying to load CSS file: ${cssUrl}`);
        const cssResponse = await fetch(cssUrl);
        if (cssResponse.ok) {
          let cssContent = await cssResponse.text();
          console.log(`Template loader: Successfully loaded CSS file: ${cssName}, content length: ${cssContent.length}`);
          console.log(`Template loader: CSS content preview: ${cssContent.substring(0, 200)}...`);
          
          // Verify this is actually CSS (not the main app HTML)
          if (cssContent.includes('<!doctype html>') || cssContent.includes('<!DOCTYPE html>')) {
            console.log(`Template loader: WARNING - ${cssName} contains HTML, likely wrong file`);
            continue; // Skip this file as it's probably the wrong one
          }
          
          cssContent = rewriteCssAssetPaths(cssContent, basePath);
          files.push({
            id: cssName,
            name: cssName,
            type: FileType.CSS,
            content: cssContent
          });
          break; // Found the CSS file, stop looking
        } else {
          console.log(`Template loader: CSS file not found: ${cssName}, status: ${cssResponse.status}`);
        }
      } catch (e) {
        console.log(`Template loader: Error loading CSS file ${cssName}:`, e);
      }
    }
    // Try to load script.js
    try {
      const jsUrl = `${basePath}/script.js`;
      console.log(`Template loader: Trying to load JavaScript file: ${jsUrl}`);
      const jsResponse = await fetch(jsUrl);
      if (jsResponse.ok) {
        let jsContent = await jsResponse.text();
        console.log(`Template loader: Successfully loaded JavaScript file, content length: ${jsContent.length}`);
        console.log(`Template loader: JavaScript content preview: ${jsContent.substring(0, 200)}...`);
        
        // Verify this is actually JavaScript (not the main app HTML)
        if (jsContent.includes('<!doctype html>') || jsContent.includes('<!DOCTYPE html>')) {
          console.log(`Template loader: WARNING - script.js contains HTML, likely wrong file`);
          throw new Error('script.js contains HTML, likely wrong file');
        }
        
        // Add initialization code to ensure classes are instantiated
        jsContent += `
// Initialize the template
console.log('Template loader: Initializing template...');
document.addEventListener('DOMContentLoaded', function() {
  console.log('Template loader: DOMContentLoaded fired');
  
  // Initialize StoryTemplate if it exists
  if (typeof StoryTemplate !== 'undefined') {
    console.log('Template loader: Creating StoryTemplate instance');
    new StoryTemplate();
  } else {
    console.log('Template loader: StoryTemplate not found');
  }
  
  // Initialize EnhancedParallax if it exists
  if (typeof EnhancedParallax !== 'undefined') {
    console.log('Template loader: Creating EnhancedParallax instance');
    new EnhancedParallax();
  } else {
    console.log('Template loader: EnhancedParallax not found');
  }
  
  // Initialize ScrollProgress if it exists
  if (typeof ScrollProgress !== 'undefined') {
    console.log('Template loader: Creating ScrollProgress instance');
    new ScrollProgress();
  } else {
    console.log('Template loader: ScrollProgress not found');
  }
  
  // Call addInteractiveFeatures if it exists
  if (typeof addInteractiveFeatures === 'function') {
    console.log('Template loader: Calling addInteractiveFeatures');
    addInteractiveFeatures();
  } else {
    console.log('Template loader: addInteractiveFeatures not found');
  }
  
  console.log('Template loader: Initialization complete');
});
`;
        files.push({
          id: 'script.js',
          name: 'script.js',
          type: FileType.JS,
          content: jsContent
        });
      } else {
        console.log(`Template loader: JavaScript file not found: ${basePath}/script.js, status: ${jsResponse.status}`);
      }
    } catch (e) {
      console.log(`Template loader: Error loading JavaScript file: ${basePath}/script.js`, e);
    }
    
    // Try to load common custom files (config.json, data.json, etc.)
    const customFiles = ['config.json', 'data.json', 'settings.json'];
    console.log(`Template loader: Attempting to load custom files for template: ${title}`);
    console.log(`Template loader: Base path: ${basePath}`);
    
    for (const customFileName of customFiles) {
      try {
        // Use absolute path to ensure we're loading from the correct location
        const customUrl = customFileName.startsWith('/') ? customFileName : `${basePath}/${customFileName}`;
        console.log(`Template loader: Trying to load custom file: ${customUrl}`);
        const customResponse = await fetch(customUrl);
        console.log(`Template loader: Response for ${customFileName}:`, {
          status: customResponse.status,
          ok: customResponse.ok,
          statusText: customResponse.statusText
        });
        
        if (customResponse.ok) {
          const customContent = await customResponse.text();
          console.log(`Template loader: Successfully loaded custom file: ${customFileName}, content length: ${customContent.length}`);
          console.log(`Template loader: Custom file content preview: ${customContent.substring(0, 200)}...`);
          
          // Verify this is actually the file we want (not the main app HTML)
          if (customContent.includes('<!doctype html>') || customContent.includes('<!DOCTYPE html>')) {
            console.log(`Template loader: WARNING - ${customFileName} contains HTML, likely wrong file`);
            continue; // Skip this file as it's probably the wrong one
          }
          
          files.push({
            id: customFileName,
            name: customFileName,
            type: FileType.CUSTOM,
            content: customContent
          });
          console.log(`Template loader: Added custom file to project: ${customFileName}`);
        } else {
          console.log(`Template loader: Custom file not found: ${customFileName}, status: ${customResponse.status}`);
        }
      } catch (e) {
        console.log(`Template loader: Error loading custom file ${customFileName}:`, e);
      }
    }
    
    const project: Project = {
      name: title,
      framework: Framework.HTML,
      files
    };
    
    console.log(`Successfully loaded template: ${title} with ${files.length} files`);
    console.log('Template files:', files.map(f => ({ id: f.id, name: f.name, type: f.type, contentLength: f.content.length })));
    return project;
    
  } catch (error) {
    console.error('Error loading template from public path:', error);
    throw error;
  }
}

export async function loadStartersData(): Promise<{ embeds: TemplateInfo[], storytelling: TemplateInfo[] }> {
  try {
    // Add cache-busting parameter to prevent browser caching
    const timestamp = new Date().getTime();
    const url = `/starters-data.json?t=${timestamp}`;
    console.log('loadStartersData: Fetching from URL:', url);
    
    const response = await fetch(url);
    console.log('loadStartersData: Response status:', response.status);
    console.log('loadStartersData: Response ok:', response.ok);
    
    if (!response.ok) {
      throw new Error('Failed to load starters data');
    }
    
    const data = await response.json();
    console.log('loadStartersData: Received data:', data);
    console.log('loadStartersData: Embeds count:', data.embeds?.length || 0);
    console.log('loadStartersData: Storytelling count:', data.storytelling?.length || 0);
    
    return data;
  } catch (error) {
    console.error('Error loading starters data:', error);
    return { embeds: [], storytelling: [] };
  }
} 