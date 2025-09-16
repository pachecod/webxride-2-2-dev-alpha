const fs = require('fs');
const path = require('path');

// Configuration
const EXAMPLES_DIR = path.join(__dirname, '../public/examples');
const INDEX_FILE = path.join(EXAMPLES_DIR, 'index.html');

// HTML template
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebXRide Examples</title>
  <link rel="preload" href="/src/assets/webxride-logo.png" as="image">
  <style>
    body {
      background: #0f172a;
      color: #f1f5f9;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 48px;
      margin-bottom: 24px;
    }
    .header img {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      box-shadow: 0 2px 8px #0003;
      background: #fff;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 700;
      margin: 0;
      color: #38bdf8;
      letter-spacing: 1px;
    }
    .examples-list {
      background: #1e293b;
      border-radius: 12px;
      box-shadow: 0 2px 12px #0002;
      padding: 32px 40px;
      min-width: 320px;
      max-width: 480px;
      margin-bottom: 48px;
    }
    .examples-list h2 {
      color: #fbbf24;
      font-size: 1.3rem;
      margin-bottom: 18px;
      font-weight: 600;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      margin-bottom: 18px;
    }
    a {
      color: #38bdf8;
      text-decoration: none;
      font-size: 1.1em;
      font-weight: 500;
      transition: color 0.2s;
    }
    a:hover {
      color: #fbbf24;
      text-decoration: underline;
    }
    .footer {
      margin-top: auto;
      padding: 24px 0 12px 0;
      color: #64748b;
      font-size: 0.95em;
      text-align: center;
    }
    .empty-state {
      color: #64748b;
      font-style: italic;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="/src/assets/webxride-logo.png" alt="WebXRide Logo">
    <h1>WebXRide Examples</h1>
  </div>
  <div class="examples-list">
    <h2>Available Examples</h2>
    {{EXAMPLE_LINKS}}
  </div>
  <div class="footer">
    &copy; 2025 WebXRide &mdash; A platform for immersive web creation.
  </div>
</body>
</html>`;

function generateExamplesIndex() {
  try {
    // Check if examples directory exists
    if (!fs.existsSync(EXAMPLES_DIR)) {
      console.log('Examples directory does not exist, creating it...');
      fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    }

    // Get all directories in examples folder
    const items = fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true });
    const exampleFolders = items
      .filter(item => item.isDirectory())
      .map(item => item.name);

    // Find folders that contain index.html
    const validExamples = exampleFolders.filter(folderName => {
      const indexPath = path.join(EXAMPLES_DIR, folderName, 'index.html');
      return fs.existsSync(indexPath);
    });

    // Generate example links HTML
    let exampleLinksHtml;
    if (validExamples.length === 0) {
      exampleLinksHtml = '<p class="empty-state">No examples found. Add folders with index.html files to see them here.</p>';
    } else {
      const links = validExamples
        .sort() // Sort alphabetically
        .map(example => {
          // Convert folder name to display name (e.g., "farmscene_example" -> "Farm Scene Example")
          const displayName = example
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          return `<li><a href="/examples/${example}/index.html" target="_blank">${displayName}</a></li>`;
        })
        .join('\n      ');
      exampleLinksHtml = `<ul>\n      ${links}\n    </ul>`;
    }

    // Generate the complete HTML
    const html = HTML_TEMPLATE.replace('{{EXAMPLE_LINKS}}', exampleLinksHtml);

    // Write the file
    fs.writeFileSync(INDEX_FILE, html, 'utf8');
    
    console.log(`✅ Examples index generated successfully!`);
    console.log(`📁 Found ${validExamples.length} example(s): ${validExamples.join(', ')}`);
    console.log(`📄 Index file: ${INDEX_FILE}`);
    
    return validExamples;
  } catch (error) {
    console.error('❌ Error generating examples index:', error.message);
    return [];
  }
}

// Export for use in other scripts
module.exports = { generateExamplesIndex };

// Run the script
if (require.main === module) {
  generateExamplesIndex();
} 