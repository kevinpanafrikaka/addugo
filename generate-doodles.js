/**
 * AdduGo — generate-doodles.js
 * Génère frontend/assets/images/doodle-pattern.svg
 * en téléchargeant de vraies icônes depuis l'API Iconify.
 *
 * Usage : node generate-doodles.js
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── CONFIG ───────────────────────────────────────────────
const ICON_SIZE   = 28;   // taille de chaque icône (px)
const CELL_SIZE   = 50;   // taille de chaque cellule de la grille
const COLS        = 8;    // colonnes
const STROKE      = '#000000';
const OPACITY     = 0.18;
const OUTPUT      = path.join(__dirname, 'frontend', 'assets', 'images', 'doodle-pattern.svg');

// ── LISTE DES ICÔNES (set/nom) ────────────────────────────
// On utilise "tabler" — style line-art pur, parfait pour les doodles
const ICONS = [
  // Livraison & logistique
  'tabler/motorbike',
  'tabler/package',
  'tabler/truck-delivery',
  'tabler/map-pin',
  'tabler/home',
  'tabler/shopping-bag',
  'tabler/shopping-cart',
  'tabler/receipt',

  // Commerce & argent
  'tabler/building-store',
  'tabler/tag',
  'tabler/wallet',
  'tabler/credit-card',
  'tabler/coin',
  'tabler/cash',
  'tabler/chart-line',
  'tabler/chart-bar',

  // Communication & UI
  'tabler/bell',
  'tabler/message',
  'tabler/phone',
  'tabler/mail',
  'tabler/send',
  'tabler/search',
  'tabler/eye',
  'tabler/lock',

  // Fun & lifestyle
  'tabler/star',
  'tabler/heart',
  'tabler/gift',
  'tabler/crown',
  'tabler/diamond',
  'tabler/trophy',
  'tabler/coffee',
  'tabler/pizza',

  // Nature & ambiance
  'tabler/sun',
  'tabler/moon',
  'tabler/leaf',
  'tabler/cloud',
  'tabler/bolt',
  'tabler/flame',
  'tabler/snowflake',
  'tabler/droplet',

  // Transport
  'tabler/bike',
  'tabler/car',
  'tabler/bus',
  'tabler/plane',
  'tabler/rocket',
  'tabler/anchor',
  'tabler/compass',
  'tabler/map',

  // Tech & outils
  'tabler/device-mobile',
  'tabler/camera',
  'tabler/headphones',
  'tabler/bulb',
  'tabler/pencil',
  'tabler/tool',
  'tabler/key',
  'tabler/puzzle',

  // Divers créatifs
  'tabler/palette',
  'tabler/music',
  'tabler/book',
  'tabler/flag',
  'tabler/award',
  'tabler/recycle',
  'tabler/hourglass',
  'tabler/confetti',
];

// ── UTILITAIRE : fetch SVG depuis Iconify ─────────────────
function fetchSVG(iconPath) {
  return new Promise((resolve, reject) => {
    const url = `https://api.iconify.design/${iconPath}.svg?width=${ICON_SIZE}&height=${ICON_SIZE}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.warn(`  ⚠ ${iconPath} → HTTP ${res.statusCode}, ignoré`);
          resolve(null);
        } else {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      console.warn(`  ⚠ ${iconPath} → ${err.message}, ignoré`);
      resolve(null);
    });
  });
}

// ── UTILITAIRE : extraire le contenu interne du SVG ───────
function extractInner(svgText) {
  // Retire la balise <svg ...> et </svg> pour ne garder que les paths
  return svgText
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();
}

// ── MAIN ──────────────────────────────────────────────────
async function generate() {
  console.log('🎨 Génération du doodle-pattern AdduGo...\n');

  const rows       = Math.ceil(ICONS.length / COLS);
  const svgWidth   = COLS  * CELL_SIZE;
  const svgHeight  = rows  * CELL_SIZE;

  const groups = [];

  for (let i = 0; i < ICONS.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x   = col * CELL_SIZE + (CELL_SIZE - ICON_SIZE) / 2;
    const y   = row * CELL_SIZE + (CELL_SIZE - ICON_SIZE) / 2;

    console.log(`  ⬇  [${i + 1}/${ICONS.length}] ${ICONS[i]}`);
    const svgText = await fetchSVG(ICONS[i]);
    if (!svgText) continue;

    const inner = extractInner(svgText);

    // Chaque icône est encapsulée dans un <g> positionné et stylé
    groups.push(`
  <!-- ${ICONS[i].split('/')[1]} -->
  <g transform="translate(${x}, ${y})"
     fill="none"
     stroke="${STROKE}"
     stroke-width="1.4"
     stroke-linecap="round"
     stroke-linejoin="round"
     opacity="${OPACITY}">
    ${inner}
  </g>`);
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg"
     width="${svgWidth}" height="${svgHeight}"
     viewBox="0 0 ${svgWidth} ${svgHeight}">
${groups.join('\n')}
</svg>`;

  fs.writeFileSync(OUTPUT, svgContent, 'utf-8');
  console.log(`\n✅ Fichier généré : ${OUTPUT}`);
  console.log(`   Dimensions : ${svgWidth}×${svgHeight}px`);
  console.log(`   Icônes     : ${groups.length}/${ICONS.length}`);
}

generate().catch(console.error);
