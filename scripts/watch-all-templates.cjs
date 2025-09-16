const fs = require('fs');
const path = require('path');
const { generateEmbedsIndex } = require('./generate-embeds-index.cjs');
const { generateStorytellingIndex } = require('./generate-storytelling-index.cjs');
const { generateExamplesIndex } = require('./generate-examples-index.cjs');

// Configuration
const EMBEDS_DIR = path.join(__dirname, '../public/embeds');
const STORYTELLING_DIR = path.join(__dirname, '../public/storytelling_templates');
const EXAMPLES_DIR = path.join(__dirname, '../public/examples');

console.log('🔍 Watching for template, embed, and example changes...');
console.log(`📁 Monitoring embeds: ${EMBEDS_DIR}`);
console.log(`📁 Monitoring storytelling templates: ${STORYTELLING_DIR}`);
console.log(`📁 Monitoring examples: ${EXAMPLES_DIR}`);
console.log('Press Ctrl+C to stop watching');

// Initial generation
console.log('\n📝 Generating initial indexes...');
generateEmbedsIndex();
generateStorytellingIndex();
generateExamplesIndex();

// Watch embeds directory
fs.watch(EMBEDS_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Only regenerate if it's a directory change or index.html change
  if (eventType === 'rename' || filename.endsWith('index.html')) {
    console.log(`\n🔄 Detected embeds change: ${eventType} - ${filename}`);
    console.log('📝 Regenerating embeds index...');
    
    // Small delay to ensure file operations are complete
    setTimeout(() => {
      generateEmbedsIndex();
    }, 100);
  }
});

// Watch storytelling_templates directory
fs.watch(STORYTELLING_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Only regenerate if it's a directory change or index.html change
  if (eventType === 'rename' || filename.endsWith('index.html')) {
    console.log(`\n🔄 Detected storytelling templates change: ${eventType} - ${filename}`);
    console.log('📝 Regenerating storytelling templates index...');
    
    // Small delay to ensure file operations are complete
    setTimeout(() => {
      generateStorytellingIndex();
    }, 100);
  }
});

// Watch examples directory
fs.watch(EXAMPLES_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  
  // Only regenerate if it's a directory change or index.html change
  if (eventType === 'rename' || filename.endsWith('index.html')) {
    console.log(`\n🔄 Detected examples change: ${eventType} - ${filename}`);
    console.log('📝 Regenerating examples index...');
    
    // Small delay to ensure file operations are complete
    setTimeout(() => {
      generateExamplesIndex();
    }, 100);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping template watcher...');
  process.exit(0);
}); 