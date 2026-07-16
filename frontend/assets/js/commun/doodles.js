/* ============================================================
   AdduGo — doodles.js
   Générateur de motifs aléatoires en arrière-plan
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
  
  // Gris neutre avec très faible transparence
  const doodleColor = '#888888';
  const doodleOpacity = '0.04';

  const icons = [
    'fa-shopping-cart', 'fa-box-open', 'fa-heart', 'fa-coffee', 'fa-star', 
    'fa-gift', 'fa-motorcycle', 'fa-truck', 'fa-store', 'fa-wallet',
    'fa-camera', 'fa-music', 'fa-paper-plane', 'fa-smile', 'fa-gem',
    'fa-crown', 'fa-bolt', 'fa-gamepad', 'fa-pizza-slice', 'fa-mug-hot',
    'fa-ice-cream', 'fa-comment-dots', 'fa-envelope', 'fa-tag', 'fa-ticket-alt',
    'fa-fire', 'fa-clock', 'fa-compass', 'fa-map-marker-alt', 'fa-globe',
    'fa-shopping-bag', 'fa-store-alt', 'fa-tags', 'fa-receipt', 'fa-tshirt',
    'fa-shoe-prints', 'fa-headphones', 'fa-laptop', 'fa-mobile-alt', 'fa-glasses',
    'fa-hamburger', 'fa-leaf', 'fa-sun', 'fa-moon', 'fa-bicycle', 'fa-car',
    'fa-plane', 'fa-rocket', 'fa-umbrella', 'fa-magic', 'fa-key', 'fa-lock'
  ];

  // Quantité dynamique selon la taille de l'écran pour bien remplir l'espace
  const screenArea = window.innerWidth * window.innerHeight;
  const numDoodles = Math.min(Math.floor(screenArea / 12000), 100);

  for (let i = 0; i < numDoodles; i++) {
    const iconClass = icons[Math.floor(Math.random() * icons.length)];
    const iElem = document.createElement('i');
    iElem.className = `fas ${iconClass}`;
    
    // Position totalement chaotique
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    
    // Rotation créative (0 à 360)
    const rotation = Math.random() * 360;
    
    // Taille variée (0.5 à 2.5)
    const scale = 0.5 + Math.random() * 2;

    iElem.style.position = 'absolute';
    iElem.style.top = `${top}%`;
    iElem.style.left = `${left}%`;
    iElem.style.transform = `rotate(${rotation}deg) scale(${scale})`;
    iElem.style.color = doodleColor;
    iElem.style.opacity = doodleOpacity;
    iElem.style.fontSize = '24px';

    container.appendChild(iElem);
  }

  document.body.appendChild(container);
}
