/* ============================================================
   AdduGo — doodles.js
   Générateur de motifs aléatoires en arrière-plan (Style WhatsApp)
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
  
  // Gris neutre pour un effet filigrane (watermark)
  const doodleColor = '#888888';
  const doodleOpacity = '0.06'; // Légèrement plus visible pour l'effet WhatsApp

  // Sélection d'icônes évoquant le style WhatsApp (nature, objets du quotidien, fun)
  const icons = [
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

  // Densité augmentée pour ressembler à la fresque WhatsApp
  const screenArea = window.innerWidth * window.innerHeight;
  const numDoodles = Math.min(Math.floor(screenArea / 6000), 200);

  for (let i = 0; i < numDoodles; i++) {
    const iconClass = icons[Math.floor(Math.random() * icons.length)];
    const iElem = document.createElement('i');
    iElem.className = `fas ${iconClass}`;
    
    // Position chaotique
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    
    // Rotation plus douce pour garder une certaine cohérence visuelle
    const rotation = (Math.random() * 60) - 30; // -30° à +30°
    
    // Taille plus homogène (comme sur WhatsApp)
    const scale = 0.8 + Math.random() * 0.7; // 0.8x à 1.5x

    iElem.style.position = 'absolute';
    iElem.style.top = `${top}%`;
    iElem.style.left = `${left}%`;
    iElem.style.transform = `rotate(${rotation}deg) scale(${scale})`;
    iElem.style.color = doodleColor;
    iElem.style.opacity = doodleOpacity;
    iElem.style.fontSize = '24px';
    
    // Effet "dessin au trait" simulé
    iElem.style.webkitTextStroke = '0.5px #888';
    // iElem.style.color = 'transparent'; // Optionnel : pour rendre l'intérieur transparent, mais avec FontAwesome Free, Solid rend mieux avec juste une couleur.

    container.appendChild(iElem);
  }

  document.body.appendChild(container);
}
