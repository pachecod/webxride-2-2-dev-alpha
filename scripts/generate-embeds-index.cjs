const fs = require('fs');
const path = require('path');

// Configuration
const EMBEDS_DIR = path.join(__dirname, '../public/embeds');
const INDEX_FILE = path.join(EMBEDS_DIR, 'index.html');

// HTML template
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebXR Embeds</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 32px; }
    h1 { color: #2563eb; margin-bottom: 24px; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 18px; }
    a { color: #2563eb; text-decoration: none; font-size: 1.2em; }
    a:hover { text-decoration: underline; }
    .note { color: #888; font-size: 0.95em; margin-top: 24px; }
    .empty-state { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <h1>WebXR Embeds</h1>
    {{EMBED_LINKS}}
    <div class="note">This page lists all WebXR embeds in <code>public/embeds/</code> that can be embedded into storytelling templates. Add new folders and index.html files to see them here.</div>
  </div>
</body>
</html>`;

function generateEmbedsIndex() {
  try {
    // Check if embeds directory exists
    if (!fs.existsSync(EMBEDS_DIR)) {
      console.log('Embeds directory does not exist, creating it...');
      fs.mkdirSync(EMBEDS_DIR, { recursive: true });
    }

    // Get all directories in embeds folder
    const items = fs.readdirSync(EMBEDS_DIR, { withFileTypes: true });
    const embedFolders = items
      .filter(item => item.isDirectory())
      .map(item => item.name);

    // Find folders that contain index.html
    const validEmbeds = embedFolders.filter(folderName => {
      const indexPath = path.join(EMBEDS_DIR, folderName, 'index.html');
      return fs.existsSync(indexPath);
    });

    // Generate embed links HTML
    let embedLinksHtml;
    if (validEmbeds.length === 0) {
      embedLinksHtml = '<p class="empty-state">No embeds found. Add folders with index.html files to see them here.</p>';
    } else {
      const links = validEmbeds
        .sort() // Sort alphabetically
        .map(embed => `<li><a href="/embeds/${embed}/index.html" target="_blank">${embed}</a></li>`)
        .join('\n      ');
      embedLinksHtml = `<ul>\n      ${links}\n    </ul>`;
    }

    // Generate the complete HTML
    const html = HTML_TEMPLATE.replace('{{EMBED_LINKS}}', embedLinksHtml);

    // Write the file
    fs.writeFileSync(INDEX_FILE, html, 'utf8');
    
    console.log(`✅ Embeds index generated successfully!`);
    console.log(`📁 Found ${validEmbeds.length} embed(s): ${validEmbeds.join(', ')}`);
    console.log(`📄 Index file: ${INDEX_FILE}`);
    
    return validEmbeds;
  } catch (error) {
    console.error('❌ Error generating embeds index:', error.message);
    return [];
  }
}

// Run the script
if (require.main === module) {
  generateEmbedsIndex();
}

module.exports = { generateEmbedsIndex }; 