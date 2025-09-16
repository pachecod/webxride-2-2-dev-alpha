export interface PrettierOptions {
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  semi?: boolean;
  singleQuote?: boolean;
  trailingComma?: 'none' | 'es5' | 'all';
  bracketSpacing?: boolean;
  bracketSameLine?: boolean;
}

const defaultOptions: PrettierOptions = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
};

// Simple HTML formatter
function formatHTML(html: string, options: PrettierOptions): string {
  const tabSize = options.tabWidth || 2;
  const indent = ' '.repeat(tabSize);
  
  // Clean up the HTML first - be very conservative
  let formatted = html
    .replace(/>\s*</g, '>\n<') // Add line breaks between tags
    .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
    .trim();
  
  let result = '';
  let level = 0;
  const lines = formatted.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    // Handle special cases
    if (line.startsWith('<!DOCTYPE')) {
      result += line + '\n';
      continue;
    }
    
    if (line.startsWith('<!--')) {
      result += indent.repeat(level) + line + '\n';
      continue;
    }
    
    // Decrease level for closing tags
    if (line.startsWith('</') && !line.startsWith('</!')) {
      level = Math.max(0, level - 1);
    }
    
    // Add indentation
    result += indent.repeat(level) + line + '\n';
    
    // Increase level for opening tags (but not self-closing or closing tags)
    if (line.startsWith('<') && !line.startsWith('</') && !line.startsWith('<!') && !line.endsWith('/>')) {
      level++;
    }
  }
  
  return result.trim();
}

// Simple CSS formatter
function formatCSS(css: string, options: PrettierOptions): string {
  const tabSize = options.tabWidth || 2;
  const indent = ' '.repeat(tabSize);
  
  let formatted = css
    .replace(/;\s*/g, ';\n') // Add line breaks after semicolons
    .replace(/\{\s*/g, ' {\n') // Add line breaks after opening braces
    .replace(/\s*\}/g, '\n}') // Add line breaks before closing braces
    .replace(/:\s*/g, ': ') // Fix spacing after colons
    .replace(/\s*,\s*/g, ', ') // Fix spacing around commas
    .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
    .trim();
  
  let result = '';
  let level = 0;
  const lines = formatted.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Handle selectors
    if (trimmed.includes('{')) {
      result += indent.repeat(level) + trimmed + '\n';
      level++;
      continue;
    }
    
    // Handle closing braces
    if (trimmed === '}') {
      level = Math.max(0, level - 1);
      result += indent.repeat(level) + trimmed + '\n';
      continue;
    }
    
    // Handle properties
    if (trimmed.includes(':')) {
      result += indent.repeat(level) + trimmed + '\n';
      continue;
    }
    
    // Handle other lines
    result += indent.repeat(level) + trimmed + '\n';
  }
  
  return result.trim();
}

// Simple JavaScript formatter
function formatJS(js: string, options: PrettierOptions): string {
  const tabSize = options.tabWidth || 2;
  const indent = ' '.repeat(tabSize);
  
  let formatted = js
    .replace(/;\s*/g, ';\n') // Add line breaks after semicolons
    .replace(/\{\s*/g, ' {\n') // Add line breaks after opening braces
    .replace(/\s*\}/g, '\n}') // Add line breaks before closing braces
    .replace(/,\s*/g, ', ') // Fix spacing around commas
    .replace(/:\s*/g, ': ') // Fix spacing after colons
    .replace(/\s*\(\s*/g, ' (') // Fix spacing around parentheses
    .replace(/\s*\)\s*/g, ') ') // Fix spacing around parentheses
    .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
    .trim();
  
  let result = '';
  let level = 0;
  const lines = formatted.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Handle function declarations and control structures
    if (trimmed.includes('{') && (trimmed.includes('function') || trimmed.includes('if') || trimmed.includes('for') || trimmed.includes('while') || trimmed.includes('switch'))) {
      result += indent.repeat(level) + trimmed + '\n';
      level++;
      continue;
    }
    
    // Handle object literals
    if (trimmed.includes('{') && !trimmed.includes('function') && !trimmed.includes('if') && !trimmed.includes('for') && !trimmed.includes('while') && !trimmed.includes('switch')) {
      result += indent.repeat(level) + trimmed + '\n';
      level++;
      continue;
    }
    
    // Handle closing braces
    if (trimmed === '}') {
      level = Math.max(0, level - 1);
      result += indent.repeat(level) + trimmed + '\n';
      continue;
    }
    
    // Handle other lines
    result += indent.repeat(level) + trimmed + '\n';
  }
  
  return result.trim();
}

export async function formatCode(
  code: string,
  fileType: string,
  options: PrettierOptions = {}
): Promise<string> {
  try {
    const mergedOptions = { ...defaultOptions, ...options };
    
    console.log('Formatting with:', { fileType, codeLength: code.length });
    
    let formatted: string;
    
    switch (fileType.toLowerCase()) {
      case 'html':
        formatted = formatHTML(code, mergedOptions);
        break;
      case 'css':
        formatted = formatCSS(code, mergedOptions);
        break;
      case 'javascript':
      case 'js':
        formatted = formatJS(code, mergedOptions);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('Formatting successful');
    return formatted;
  } catch (error) {
    console.error('Formatting failed:', error);
    throw error;
  }
}

export function canFormatFile(fileType: string): boolean {
  const supportedTypes = ['html', 'css', 'javascript', 'js'];
  return supportedTypes.includes(fileType.toLowerCase());
} 