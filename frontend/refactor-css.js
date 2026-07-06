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
  let content = fs.readFileSync(htmlFile, 'utf8');
  
  const linkRegex = /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/gi;
  let match;
  const localCssFiles = [];
  
  const contentCopy = content;
  while ((match = linkRegex.exec(contentCopy)) !== null) {
    const href = match[1];
    if (!href.startsWith('http') && href.includes('.css')) {
      localCssFiles.push(href);
    }
  }

  if (localCssFiles.length > 0) {
    let combinedCssContent = `/* Styles uniques pour ${path.basename(htmlFile)} */\n`;
    const htmlDir = path.dirname(htmlFile);

    for (const href of localCssFiles) {
      const cssPath = path.resolve(htmlDir, href);
      if (fs.existsSync(cssPath)) {
        combinedCssContent += `\n/* --- Contenu de ${path.basename(href)} --- */\n`;
        combinedCssContent += fs.readFileSync(cssPath, 'utf8') + '\n';
      } else {
        console.warn(`Fichier CSS introuvable: ${cssPath} (depuis ${htmlFile})`);
      }
    }

    const parentDirName = path.basename(htmlDir);
    let newCssFileName = '';
    if (parentDirName !== 'pages') {
      newCssFileName = `${parentDirName}-${path.basename(htmlFile, '.html')}-page.css`;
    } else {
      newCssFileName = `${path.basename(htmlFile, '.html')}-page.css`;
    }
    
    const newCssFilePath = path.join(cssDir, newCssFileName);

    fs.writeFileSync(newCssFilePath, combinedCssContent);
    console.log(`Créé: ${newCssFilePath}`);

    let relativePathToCss = path.relative(htmlDir, newCssFilePath).replace(/\\/g, '/');
    if (!relativePathToCss.startsWith('.') && !relativePathToCss.startsWith('/')) {
        relativePathToCss = './' + relativePathToCss;
    }
    const newLinkTag = `  <link rel="stylesheet" href="${relativePathToCss}" />`;

    let firstLinkReplaced = false;
    
    const lines = content.split('\n');
    const newLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/i)) {
        const hrefMatch = line.match(/href="([^"]+)"/i);
        if (hrefMatch && !hrefMatch[1].startsWith('http') && hrefMatch[1].includes('.css')) {
          if (!firstLinkReplaced) {
            newLines.push(newLinkTag);
            firstLinkReplaced = true;
          }
          continue;
        }
      }
      newLines.push(line);
    }
    
    content = newLines.join('\n');

    fs.writeFileSync(htmlFile, content);
    console.log(`Mis à jour: ${htmlFile}`);
  }
}

console.log("Terminé !");
