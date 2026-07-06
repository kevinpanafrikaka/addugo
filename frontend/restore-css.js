const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const cssDir = path.join(__dirname, 'assets', 'css');

function getHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = getHtmlFiles(pagesDir);

for (const htmlFile of htmlFiles) {
  let htmlContent = fs.readFileSync(htmlFile, 'utf8');
  
  // Find the generated page.css link
  const linkRegex = /<link\s+rel="stylesheet"\s+href="([^"]+-page\.css)"\s*\/?>/gi;
  let match = linkRegex.exec(htmlContent);
  
  if (match) {
    const href = match[1]; // e.g. ../../assets/css/commerce-produits-page.css
    const cssFileName = path.basename(href);
    const cssFilePath = path.join(cssDir, cssFileName);
    
    if (fs.existsSync(cssFilePath)) {
      const cssContent = fs.readFileSync(cssFilePath, 'utf8');
      
      // Extract original file names
      const originalFiles = [];
      const cssRegex = /\/\* --- Contenu de (.*?) --- \*\//g;
      let cssMatch;
      while ((cssMatch = cssRegex.exec(cssContent)) !== null) {
        originalFiles.push(cssMatch[1]);
      }
      
      if (originalFiles.length > 0) {
        console.log(`Restauration pour ${htmlFile}`);
        console.log(`Fichiers trouvés: ${originalFiles.join(', ')}`);
        
        // Construct the relative path to assets/css from this HTML file
        const htmlDir = path.dirname(htmlFile);
        let relativePathToCssDir = path.relative(htmlDir, cssDir).replace(/\\/g, '/');
        if (!relativePathToCssDir.startsWith('.') && !relativePathToCssDir.startsWith('/')) {
            relativePathToCssDir = './' + relativePathToCssDir;
        }
        
        // Create new HTML links string with proper indentation
        const newLinks = originalFiles.map(file => {
          return `  <link rel="stylesheet" href="${relativePathToCssDir}/${file}" />`;
        }).join('\n');
        
        // Replace the single page.css link with the multiple original links
        htmlContent = htmlContent.replace(match[0], newLinks);
        
        // Add a dedicated page CSS if they selected Option 2 (Fichier dédié + Globaux)
        // Let's create a dedicated file for each page if it doesn't already have one
        const pageSpecificCssName = cssFileName.replace('-page.css', '.css');
        const pageSpecificCssPath = path.join(cssDir, pageSpecificCssName);
        
        // If the page doesn't already have its own css file in the original list, we add it
        if (!originalFiles.includes(pageSpecificCssName)) {
            if (!fs.existsSync(pageSpecificCssPath)) {
                fs.writeFileSync(pageSpecificCssPath, `/* Styles spécifiques pour ${path.basename(htmlFile)} */\n`);
            }
            const specificLink = `  <link rel="stylesheet" href="${relativePathToCssDir}/${pageSpecificCssName}" />`;
            // insert it right after the newly added links
            htmlContent = htmlContent.replace(newLinks, newLinks + '\n' + specificLink);
            console.log(`Fichier CSS dédié ajouté : ${pageSpecificCssName}`);
        }
        
        // Write the HTML file back
        fs.writeFileSync(htmlFile, htmlContent);
        
        // Delete the monolithic page.css file
        fs.unlinkSync(cssFilePath);
        console.log(`Suppression de ${cssFileName}`);
      }
    }
  }
}

console.log("Restauration et application de l'Option 2 terminées !");
