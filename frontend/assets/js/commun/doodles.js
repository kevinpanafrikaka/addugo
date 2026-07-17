/* ============================================================
   AdduGo — doodles.js
   Fond décoratif style WhatsApp avec vrais SVG
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  // Ne pas afficher sur index.html, login.html et register.html
  const path = window.location.pathname;
  if (
    path === '/' ||
    path.endsWith('index.html') ||
    path.endsWith('login.html') ||
    path.endsWith('register.html')
  ) return;

  initDoodles();
});

function getSVGPath() {
  const path  = window.location.pathname;
  const depth = (path.match(/\//g) || []).length;

  if (depth <= 2) return '../assets/images/doodle-pattern.svg';
  if (depth === 3) return '../../assets/images/doodle-pattern.svg';
  return '../../../assets/images/doodle-pattern.svg';
}

function initDoodles() {
  // Injection du CSS avec chemin dynamique
  const style = document.createElement('style');
  style.textContent = `
    #addugo-doodle-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      pointer-events: none;
      overflow: hidden;
      background-color: #F8F9FA;
      background-image: url('${getSVGPath()}');
      background-repeat: repeat;
      background-size: 200px 200px;
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  // Création du conteneur
  const bg = document.createElement('div');
  bg.id = 'addugo-doodle-bg';
  document.body.appendChild(bg);
}
