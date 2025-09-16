const fs = require('fs');
const path = require('path');
const { generateTemplatesIndex } = require('./generate-templates-index.cjs');

// Configuration
const TEMPLATES_DIR = path.join(__dirname, '../public/templates');

console.log('🔍 Watching for template changes...');
console.log(`📁 Monitoring: ${TEMPLATES_DIR}`);
console.log('Press Ctrl+C to stop watching');

// Initial generation
generateTemplatesIndex();

// Watch for changes
fs.watch(TEMPLATES_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Only regenerate if it's a directory change or index.html change
  if (eventType === 'rename' || filename.endsWith('index.html')) {
    console.log(`\n🔄 Detected change: ${eventType} - ${filename}`);
    console.log('📝 Regenerating templates index...');
    
    // Small delay to ensure file operations are complete
    setTimeout(() => {
      generateTemplatesIndex();
    }, 100);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping template watcher...');
  process.exit(0);
}); 