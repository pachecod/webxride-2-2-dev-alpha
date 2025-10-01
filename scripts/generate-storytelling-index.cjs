const fs = require('fs');
const path = require('path');

// Configuration
const STORYTELLING_DIR = path.join(__dirname, '../public/storytelling_templates');
const INDEX_FILE = path.join(STORYTELLING_DIR, 'index.html');

// HTML template
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Storytelling Templates</title>
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
    <h1>Storytelling Templates</h1>
    {{STORYTELLING_LINKS}}
    <div class="note">This page lists all storytelling templates that embed WebXR experiences. These templates combine narrative storytelling with interactive 3D content.</div>
  </div>
</body>
</html>`;

function generateStorytellingIndex() {
  try {
    // Check if storytelling_templates directory exists
    if (!fs.existsSync(STORYTELLING_DIR)) {
      console.log('Storytelling templates directory does not exist, creating it...');
      fs.mkdirSync(STORYTELLING_DIR, { recursive: true });
    }

    // Get all directories in storytelling_templates folder
    const items = fs.readdirSync(STORYTELLING_DIR, { withFileTypes: true });
    const templateFolders = items
      .filter(item => item.isDirectory())
      .map(item => item.name);

    // Find folders that contain index.html
    const validTemplates = templateFolders.filter(folderName => {
      const indexPath = path.join(STORYTELLING_DIR, folderName, 'index.html');
      return fs.existsSync(indexPath);
    });

    // Generate template links HTML
    let templateLinksHtml;
    if (validTemplates.length === 0) {
      templateLinksHtml = '<p class="empty-state">No storytelling templates found. Add folders with index.html files to see them here.</p>';
    } else {
      const links = validTemplates
        .sort() // Sort alphabetically
        .map(template => `<li><a href="/storytelling_templates/${template}/index.html" target="_blank">${template}</a></li>`)
        .join('\n      ');
      templateLinksHtml = `<ul>\n      ${links}\n    </ul>`;
    }

    // Generate the complete HTML
    const html = HTML_TEMPLATE.replace('{{STORYTELLING_LINKS}}', templateLinksHtml);

    // Write the file
    fs.writeFileSync(INDEX_FILE, html, 'utf8');
    
    console.log(`✅ Storytelling templates index generated successfully!`);
    console.log(`📁 Found ${validTemplates.length} template(s): ${validTemplates.join(', ')}`);
    console.log(`📄 Index file: ${INDEX_FILE}`);
    
    return validTemplates;
  } catch (error) {
    console.error('❌ Error generating storytelling templates index:', error.message);
    return [];
  }
}

// Run the script
if (require.main === module) {
  generateStorytellingIndex();
}

module.exports = { generateStorytellingIndex }; 