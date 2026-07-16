/* ============================================================
   AdduGo — doodles.js
   Générateur de motifs aléatoires en arrière-plan (Style WhatsApp Pro)
   ============================================================ */

document.addEventListener('DOMContentLoaded', initRandomDoodles);

function initRandomDoodles() {
  const container = document.createElement('div');
  container.id = 'addugo-doodle-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.zIndex = '-1';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'hidden';
  
  const doodleOpacity = '0.07'; // Légèrement boosté car le mode "transparent" adoucit l'icône

  // Les gros dessins "principaux"
  const bigIcons = [
    'fa-bicycle', 'fa-leaf', 'fa-moon', 'fa-paw', 'fa-music', 'fa-headphones', 
    'fa-lightbulb', 'fa-coffee', 'fa-utensils', 'fa-camera', 'fa-video', 
    'fa-book', 'fa-pencil-alt', 'fa-paper-plane', 'fa-bus', 'fa-car', 
    'fa-cat', 'fa-dog', 'fa-feather', 'fa-guitar', 'fa-motorcycle', 
    'fa-plane', 'fa-ship', 'fa-train', 'fa-tv', 'fa-umbrella', 'fa-anchor', 
    'fa-basketball-ball', 'fa-bell', 'fa-bolt', 'fa-bomb', 'fa-cloud', 
    'fa-compass', 'fa-crown', 'fa-drum', 'fa-futbol', 'fa-ghost', 'fa-hammer', 
    'fa-key', 'fa-lemon', 'fa-magnet', 'fa-meteor', 'fa-puzzle-piece', 
    'fa-robot', 'fa-rocket', 'fa-seedling', 'fa-star', 'fa-sun', 'fa-trophy', 
    'fa-truck', 'fa-umbrella-beach', 'fa-heart', 'fa-smile', 'fa-gamepad'
  ];

  // Les petits éléments "bouche-trous"
  const fillerIcons = ['fa-circle', 'fa-star', 'fa-plus', 'fa-asterisk', 'fa-ring', 'fa-sparkles', 'fa-dot-circle'];

  // --- LOGIQUE DE GRILLE POUR ÉVITER LES CHEVAUCHEMENTS ---
  // On divise l'écran en cellules carrées de 110px
  const cellSize = 110;
  const cols = Math.ceil(window.innerWidth / cellSize);
  const rows = Math.ceil(window.innerHeight / cellSize);

  // 1. Placer les éléments principaux dans les cellules
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 15% de chance de laisser la case vide pour aérer
      if (Math.random() > 0.85) continue;

      const isFiller = Math.random() > 0.8; // Parfois, on met un bouche-trou au centre
      const iconsArray = isFiller ? fillerIcons : bigIcons;
      const iconClass = iconsArray[Math.floor(Math.random() * iconsArray.length)];
      
      const iElem = document.createElement('i');
      iElem.className = `fas ${iconClass}`;
      
      // Jitter : Mouvement aléatoire au sein de sa cellule (-20px à +20px) pour casser la grille
      const jitterX = (Math.random() * 40) - 20; 
      const jitterY = (Math.random() * 40) - 20;
      
      const leftPx = (c * cellSize) + (cellSize / 2) + jitterX;
      const topPx = (r * cellSize) + (cellSize / 2) + jitterY;

      // Très faible rotation (-8° à +8°) pour rester droit comme WhatsApp
      const rotation = (Math.random() * 16) - 8; 
      const scale = isFiller ? (0.4 + Math.random() * 0.3) : (0.8 + Math.random() * 0.4);

      iElem.style.position = 'absolute';
      iElem.style.left = `${leftPx}px`;
      iElem.style.top = `${topPx}px`;
      iElem.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
      
      // L'astuce du Line Art : intérieur transparent, bordure grise !
      iElem.style.color = 'transparent';
      iElem.style.webkitTextStroke = '1px #777777';
      iElem.style.opacity = doodleOpacity;
      iElem.style.fontSize = isFiller ? '12px' : '28px';

      container.appendChild(iElem);
    }
  }

  // 2. Placer les minuscules bouche-trous aux intersections de la grille
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      // Seulement 40% des intersections reçoivent un point
      if (Math.random() > 0.40) continue; 
      
      const iconClass = fillerIcons[Math.floor(Math.random() * fillerIcons.length)];
      const iElem = document.createElement('i');
      iElem.className = `fas ${iconClass}`;
      
      // Placé à la bordure des cellules
      const leftPx = (c * cellSize) + ((Math.random() * 20) - 10);
      const topPx = (r * cellSize) + ((Math.random() * 20) - 10);
      
      const scale = 0.2 + Math.random() * 0.4; // Très petit
      const rotation = Math.random() * 90;
      
      iElem.style.position = 'absolute';
      iElem.style.left = `${leftPx}px`;
      iElem.style.top = `${topPx}px`;
      iElem.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
      
      iElem.style.color = 'transparent';
      iElem.style.webkitTextStroke = '1px #777777';
      iElem.style.opacity = doodleOpacity;
      iElem.style.fontSize = '16px';
      
      container.appendChild(iElem);
    }
  }

  document.body.appendChild(container);
}
