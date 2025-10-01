const fs = require('fs');
const path = require('path');

function scanTemplates(baseDir, type) {
  const templates = [];
  
  if (!fs.existsSync(baseDir)) {
    return templates;
  }
  
  const items = fs.readdirSync(baseDir);
  
  for (const item of items) {
    const itemPath = path.join(baseDir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      const indexPath = path.join(itemPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        // Read the HTML file to extract title
        const htmlContent = fs.readFileSync(indexPath, 'utf8');
        const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : item;
        
        templates.push({
          id: item,
          title: title,
          path: `/${type}/${item}/index.html`,
          type: type
        });
      }
    }
  }
  
  return templates;
}

function generateStartersData() {
  const embeds = scanTemplates('public/embeds', 'embeds');
  const storytelling = scanTemplates('public/storytelling_templates', 'storytelling_templates');
  
  const data = {
    embeds: embeds,
    storytelling: storytelling,
    generatedAt: new Date().toISOString()
  };
  
  // Write to both files - one for the React app and one for the public server
  fs.writeFileSync('src/data/starters-data.json', JSON.stringify(data, null, 2));
  fs.writeFileSync('public/starters-data.json', JSON.stringify(data, null, 2));
  
  console.log(`Generated starters data with ${embeds.length} embeds and ${storytelling.length} storytelling templates`);
  console.log('Updated both src/data/starters-data.json and public/starters-data.json');
}

generateStartersData(); 