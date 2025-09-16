const fs = require('fs');
const path = require('path');

// Configuration
const TEMPLATES_DIR = path.join(__dirname, '../public/templates');
const INDEX_FILE = path.join(TEMPLATES_DIR, 'index.html');

// HTML template
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Templates in Development</title>
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
    <h1>Templates in Development</h1>
    {{TEMPLATE_LINKS}}
    <div class="note">This page lists all templates in <code>public/templates/</code> that have an <code>index.html</code> for local preview. Add new folders and index.html files to see them here.</div>
  </div>
</body>
</html>`;

function generateTemplatesIndex() {
  try {
    // Check if templates directory exists
    if (!fs.existsSync(TEMPLATES_DIR)) {
      console.log('Templates directory does not exist, creating it...');
      fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
    }

    // Get all directories in templates folder
    const items = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true });
    const templateFolders = items
      .filter(item => item.isDirectory())
      .map(item => item.name);

    // Find folders that contain index.html
    const validTemplates = templateFolders.filter(folderName => {
      const indexPath = path.join(TEMPLATES_DIR, folderName, 'index.html');
      return fs.existsSync(indexPath);
    });

    // Generate template links HTML
    let templateLinksHtml;
    if (validTemplates.length === 0) {
      templateLinksHtml = '<p class="empty-state">No templates found. Add folders with index.html files to see them here.</p>';
    } else {
      const links = validTemplates
        .sort() // Sort alphabetically
        .map(template => `<li><a href="/templates/${template}/index.html" target="_blank">${template}</a></li>`)
        .join('\n      ');
      templateLinksHtml = `<ul>\n      ${links}\n    </ul>`;
    }

    // Generate the complete HTML
    const html = HTML_TEMPLATE.replace('{{TEMPLATE_LINKS}}', templateLinksHtml);

    // Write the file
    fs.writeFileSync(INDEX_FILE, html, 'utf8');
    
    console.log(`✅ Templates index generated successfully!`);
    console.log(`📁 Found ${validTemplates.length} template(s): ${validTemplates.join(', ')}`);
    console.log(`📄 Index file: ${INDEX_FILE}`);
    
    return validTemplates;
  } catch (error) {
    console.error('❌ Error generating templates index:', error.message);
    return [];
  }
}

// Run the script
if (require.main === module) {
  generateTemplatesIndex();
}

module.exports = { generateTemplatesIndex }; 