const fs = require('fs');
const path = require('path');

const styleCssPath = path.join(__dirname, 'assets', 'css', 'commun', 'style.css');
let styleCss = fs.readFileSync(styleCssPath, 'utf8');

// 1. Remove the extra .hero we appended at the bottom
styleCss = styleCss.replace(
  /\.hero {\s*background: linear-gradient\(135deg, #111111 0%, #1a1a2e 50%, #16213e 100%\);\s*}/g,
  ''
);

// 2. Fix the original .hero (remove black gradient, make it white/orange)
styleCss = styleCss.replace(
  /\.hero {\s*background: linear-gradient\(135deg, var\(--noir\) 0%, var\(--noir-light\) 50%, var\(--texte\) 100%\);\s*color: var\(--blanc\);/g,
  `.hero {
  background: linear-gradient(135deg, #FFF4EE 0%, #FFFFFF 60%, #FFF8F2 100%);
  color: var(--texte);`
);

// 3. Fix hero texts to not be white
styleCss = styleCss.replace(
  /\.hero p {\s*font-size: 1\.1rem;\s*color: rgba\(255,255,255,0\.85\);/g,
  `.hero p {\n  font-size: 1.1rem;\n  color: var(--texte-gris);`
);

// 4. Fix hero icon title and desc
styleCss = styleCss.replace(
  /\.hero-icone-titre {\s*font-size: 1\.25rem;\s*font-weight: 700;\s*text-align: center;\s*color: var\(--blanc\);/g,
  `.hero-icone-titre {\n  font-size: 1.25rem;\n  font-weight: 700;\n  text-align: center;\n  color: var(--texte);`
);

styleCss = styleCss.replace(
  /\.hero-icone-desc {\s*font-size: 0\.85rem;\s*text-align: center;\s*color: rgba\(255,255,255,0\.6\);/g,
  `.hero-icone-desc {\n  font-size: 0.85rem;\n  text-align: center;\n  color: var(--texte-gris);`
);

// 5. Fix hero stats to have a white background instead of transparent white
styleCss = styleCss.replace(
  /\.hero-stat {\s*text-align: center;\s*padding: 20px 16px;\s*background: rgba\(255,255,255,0\.08\);\s*border-radius: 16px;\s*border: 1px solid rgba\(255,255,255,0\.1\);\s*}/g,
  `.hero-stat {
  text-align: center;
  padding: 20px 16px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid rgba(255,107,53,0.1);
  box-shadow: 0 4px 15px rgba(255,107,53,0.05);
}`
);

// 6. Fix hero-stat-label color
styleCss = styleCss.replace(
  /\.hero-stat-label {\s*font-size: 0\.75rem;\s*color: rgba\(255,255,255,0\.7\);/g,
  `.hero-stat-label {\n  font-size: 0.75rem;\n  color: var(--texte-gris);`
);

// 7. Fix hero-illustration background
styleCss = styleCss.replace(
  /\.hero-illustration {\s*width: 100%;\s*max-width: 480px;\s*background: rgba\(255,255,255,0\.05\);\s*border: 1px solid rgba\(255,255,255,0\.1\);\s*border-radius: 24px;\s*padding: 40px;\s*backdrop-filter: blur\(10px\);\s*}/g,
  `.hero-illustration {
  width: 100%;
  max-width: 480px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,107,53,0.2);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(255,107,53,0.08);
}`
);

// 8. Fix the CTA section gradient (it was orange, which is fine, but maybe let's ensure it's not dark orange)
// The user explicitly complained about "noir", so the orange CTA is probably okay.

fs.writeFileSync(styleCssPath, styleCss, 'utf8');
console.log('UI améliorée: mode clair activé.');
