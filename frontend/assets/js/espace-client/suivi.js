// ============================================================
// AdduGo — Suivi de Livraison Client (Architecture Multi-Cartes)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// Simulation chargement notifications
setTimeout(() => {
  const notifBadge = document.querySelector('.notif-badge');
  if (notifBadge) {
    const notifs = Math.floor(Math.random() * 5) + 1;
    notifBadge.textContent = notifs;
    notifBadge.style.display = 'flex';
  }
}, 1000);

// ── VARIABLES GLOBALES ──
let cartes = {};
let marqueursLivreur = {};
let marqueursClient = {};
let sockets = {};

let refreshInterval = null;

// ── UTILITAIRES ──
function formatPrix(montant) {
  return new Intl.NumberFormat('fr-GN').format(montant) + ' GNF';
}

function badgeStatut(statut) {
  const config = {
    'en_attente':     { classe: 'badge-avertissement', texte: '<i class="fas fa-hourglass-half"></i> En attente'     },
    'confirmee':      { classe: 'badge-info',          texte: '<i class="fas fa-check-circle"></i> Confirmée'       },
    'en_preparation': { classe: 'badge-bleu',          texte: '<i class="fas fa-wrench"></i> En préparation'  },
    'prete':          { classe: 'badge-succes',        texte: '<i class="fas fa-box"></i> Prête'           },
    'en_livraison':   { classe: 'badge-orange',        texte: '<i class="fas fa-motorcycle"></i> En livraison'    },
    'livree':         { classe: 'badge-succes',        texte: '<i class="fas fa-check-circle"></i> Livrée'          },
    'annulee':        { classe: 'badge-erreur',        texte: '<i class="fas fa-times-circle"></i> Annulée'         }
  };
  const c = config[statut] || { classe: 'badge-info', texte: statut };
  return `<span class="badge ${c.classe}">${c.texte}</span>`;
}

const ordreStatuts = [
  'en_attente', 'confirmee', 'en_preparation',
  'prete', 'en_livraison', 'livree'
];

const configEtapes = {
  'en_attente': { i: 'fas fa-clock', t: 'Reçue' },
  'confirmee': { i: 'fas fa-check', t: 'Confirmée' },
  'en_preparation': { i: 'fas fa-box-open', t: 'Préparation' },
  'prete': { i: 'fas fa-box', t: 'Prête' },
  'en_livraison': { i: 'fas fa-motorcycle', t: 'En route' },
  'livree': { i: 'fas fa-home', t: 'Livrée' }
};

// ── INITIALISATION CARTE LEAFLET PAR COMMANDE ──
function initMap(commandeId, statut, adresseLivraison) {
  const mapContainer = document.getElementById(`map-suivi-${commandeId}`);
  if (!mapContainer) return;

  // Astuce de Performance : Ne charger la carte Leaflet que lorsque la commande est "En livraison"
  if (statut !== 'en_livraison') {
    if (cartes[commandeId]) {
      cartes[commandeId].remove();
      delete cartes[commandeId];
    }
    if (sockets[commandeId]) {
      sockets[commandeId].disconnect();
      delete sockets[commandeId];
    }
    mapContainer.style.display = 'none';
    return;
  }

  // Rendre visible le conteneur
  mapContainer.style.display = 'block';

  // Si déjà initialisée, ne rien faire
  if (cartes[commandeId]) return;

  const centreConakry = [9.509167, -13.712222]; // Centre par défaut

  cartes[commandeId] = L.map(`map-suivi-${commandeId}`).setView(centreConakry, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(cartes[commandeId]);

  // WebSockets multi-room (connexion à la bonne adresse)
  const baseUrl = typeof API_URL !== 'undefined' ? API_URL.replace('/api', '') : 'http://localhost:5000';
  sockets[commandeId] = io(baseUrl);
  sockets[commandeId].on('connect', () => {
    sockets[commandeId].emit('join_commande', commandeId);
  });
  
  sockets[commandeId].on('update_position', (data) => {
    const latlng = [data.lat, data.lng];
    if (marqueursLivreur[commandeId]) {
      marqueursLivreur[commandeId].setLatLng(latlng);
    } else {
      // Création du vrai marqueur seulement quand on a de vraies coordonnées
      const iconeLivreur = L.divIcon({
        html: '<div style="background:var(--texte);color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-motorcycle"></i></div>',
        className: '', iconSize: [30, 30], iconAnchor: [15, 15]
      });
      marqueursLivreur[commandeId] = L.marker(latlng, {icon: iconeLivreur}).addTo(cartes[commandeId]);
      cartes[commandeId].setView(latlng, 15);
    }
  });

  // Géocodage de l'adresse de livraison pour placer la vraie icône Maison
  if (adresseLivraison) {
    // On ajoute 'Conakry' si ce n'est pas précisé pour aider la recherche
    const query = adresseLivraison.toLowerCase().includes('conakry') ? adresseLivraison : `${adresseLivraison}, Conakry`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const clientCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          const iconeClient = L.divIcon({
            html: '<div style="background:var(--orange);color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-home"></i></div>',
            className: '', iconSize: [30, 30], iconAnchor: [15, 15]
          });
          marqueursClient[commandeId] = L.marker(clientCoords, {icon: iconeClient}).addTo(cartes[commandeId]);
          cartes[commandeId].setView(clientCoords, 14);
        }
      })
      .catch(err => console.error("Erreur géocodage:", err));
  }

  // Force le recalcul de la taille après l'affichage pour éviter les bugs de tuiles grises
  setTimeout(() => { if(cartes[commandeId]) cartes[commandeId].invalidateSize(); }, 1000);
}

// ── GENERATION HTML COMPLET CARTE ──
function genererHtmlComplet(c) {
  // Gestion du logo du commerce avec un fallback fiable
  const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.commerce_nom || 'Boutique')}&background=FFEDD5&color=FF6B00&size=100`;
  let imageLogo = fallbackLogo;
  if (c.commerce_logo) {
    const baseUrl = typeof API_URL !== 'undefined' ? API_URL.replace('/api', '') : 'http://localhost:5000';
    if (c.commerce_logo.startsWith('http') || c.commerce_logo.startsWith('data:')) {
      imageLogo = c.commerce_logo;
    } else if (c.commerce_logo.startsWith('/')) {
      imageLogo = `${baseUrl}${c.commerce_logo}`;
    } else {
      imageLogo = `${baseUrl}/uploads/commerces/${c.commerce_logo}`;
    }
  }

  const indexActuel = ordreStatuts.indexOf(c.statut);
  const progression = indexActuel > 0 ? (indexActuel / (ordreStatuts.length - 1)) * 100 : 0;

  const etapesHtml = ordreStatuts.map((st, i) => {
    let className = '';
    if (i < indexActuel) className = 'done';
    else if (i === indexActuel) className = 'active';
    
    return `
      <div class="timeline-step ${className}" id="etape-${c.id}-${st}">
        <div class="timeline-step-icone"><i class="${configEtapes[st].i}"></i></div>
        <div class="timeline-step-texte">${configEtapes[st].t}</div>
      </div>
    `;
  }).join('');

  return `
    <!-- En-tête Boutique -->
    <div class="carte-boutique-en-tete">
      <img src="${imageLogo}" alt="Logo Boutique" class="carte-boutique-logo" onerror="this.src='${fallbackLogo}'">
      <div>
        <h3 style="margin:0; font-size: 1.4rem; font-family: var(--police-titre); color: var(--texte);">${c.commerce_nom}</h3>
        <div class="texte-sm gris" style="margin-top: 4px;">Commande #${String(c.id).padStart(5, '0')}</div>
      </div>
      <div style="margin-left: auto;" id="badge-statut-${c.id}">${badgeStatut(c.statut)}</div>
    </div>

    <!-- Timeline Horizontale -->
    <div class="timeline-horizontale-container">
      <div class="timeline-horizontale">
        ${etapesHtml}
        <div class="timeline-horizontale-ligne-active" id="timeline-ligne-${c.id}" style="width: ${progression}%;"></div>
      </div>
    </div>

    <!-- ENCART CODE PIN SI EN LIVRAISON -->
    ${c.statut === 'en_livraison' && c.code_pin ? `
      <div style="background: linear-gradient(135deg, var(--noir), #2a2a2a); color: white; border-radius: 12px; padding: 20px; margin: 2rem 0 0 0; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 15px rgba(0,0,0,0.15); flex-wrap: wrap; gap: 15px;">
        <div style="flex: 1; min-width: 250px;">
          <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 5px;"><i class="fas fa-lock"></i> Code secret de livraison</div>
          <div style="font-size: 1.05rem; line-height: 1.4;">Veuillez donner ce code au livreur à son arrivée pour valider la réception du colis.</div>
        </div>
        <div style="background: white; color: var(--noir); font-size: 2.2rem; font-weight: 900; letter-spacing: 4px; padding: 10px 25px; border-radius: 8px; font-family: monospace; text-align: center;">
          ${c.code_pin}
        </div>
      </div>
    ` : ''}

    <!-- CARTE SUIVI EN DIRECT -->
    <div id="map-suivi-${c.id}" style="width: 100%; height: 350px; border-radius: var(--rayon-lg); margin: 2rem 0; background: var(--bg-secondaire); display: none; z-index: 1;"></div>
    
    <!-- INFOS LIVRAISON ET ARTICLES -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 1.5rem; background: #f8fafc; padding: 20px; border-radius: 16px;">
      <div>
        <div style="font-weight:600; margin-bottom:10px; color:var(--texte);"><i class="fas fa-map-marker-alt" style="color:var(--orange);"></i> Adresse de livraison</div>
        <div style="color:var(--texte-gris); font-size: 0.95rem;">${c.adresse_livraison}</div>
      </div>
      <div>
        <div style="font-weight:600; margin-bottom:10px; color:var(--texte);"><i class="fas fa-money-bill-wave" style="color:var(--orange);"></i> Montant Total</div>
        <div class="prix" style="font-size: 1.1rem;">${formatPrix(c.montant_total)}</div>
      </div>
      <div>
        <div style="font-weight:600; margin-bottom:10px; color:var(--texte);"><i class="fas fa-shopping-bag" style="color:var(--orange);"></i> Articles</div>
        <div style="color:var(--texte-gris); font-size: 0.9rem; line-height: 1.5;">
          ${(c.articles || []).map(a => `<span style="font-weight:600;color:var(--texte);">${a.quantite}x</span> ${a.produit_nom}`).join('<br>')}
        </div>
      </div>
    </div>
  `;
}

// ── LOGIQUE PRINCIPALE DE MISE A JOUR DOM ──
function majCarte(c) {
  const conteneurPrincipal = document.getElementById('conteneur-cartes-commandes');
  let carte = document.getElementById(`carte-commande-${c.id}`);

  // Création de la carte si elle n'existe pas
  if (!carte) {
    carte = document.createElement('div');
    carte.id = `carte-commande-${c.id}`;
    carte.className = 'suivi-conteneur-carte anime-slide-up';
    carte.style.cssText = 'background: var(--blanc); border: 1px solid var(--bordure); border-radius: 18px; padding: 25px; box-shadow: 0 4px 16px rgba(0,0,0,0.02); position: relative; margin-bottom: 30px;';
    
    carte.innerHTML = genererHtmlComplet(c);
    conteneurPrincipal.appendChild(carte);
  } else {
    // Si la carte existe, on met juste à jour l'état visuel sans détruire la div map-suivi (Leaflet)
    document.getElementById(`badge-statut-${c.id}`).innerHTML = badgeStatut(c.statut);
    
    const indexActuel = ordreStatuts.indexOf(c.statut);
    const progression = indexActuel > 0 ? (indexActuel / (ordreStatuts.length - 1)) * 100 : 0;
    
    document.getElementById(`timeline-ligne-${c.id}`).style.width = progression + '%';
    
    ordreStatuts.forEach((st, i) => {
      const etape = document.getElementById(`etape-${c.id}-${st}`);
      if (etape) {
        etape.className = 'timeline-step';
        if (i < indexActuel) etape.classList.add('done');
        else if (i === indexActuel) etape.classList.add('active');
      }
    });
  }

  // Logique Leaflet & Socket
  initMap(c.id, c.statut);
}

// ── BOUCLE DE CHARGEMENT ──
async function chargerCommandesEnCours() {
  try {
    const res  = await apiFetch('/commandes/mes-commandes');
    const data = await res.json();
    const conteneurPrincipal = document.getElementById('conteneur-cartes-commandes');

    if (data.success) {
      const enCours = data.commandes.filter(c =>
        !['livree', 'annulee'].includes(c.statut)
      );

      // Si c'est le premier chargement (squelette présent) et qu'on a des données
      const isInitialLoad = conteneurPrincipal.querySelector('.chargement') !== null;
      if (isInitialLoad) conteneurPrincipal.innerHTML = '';

      if (enCours.length === 0) {
        conteneurPrincipal.innerHTML = `
          <div class="vide" style="background: white; border-radius: 18px; padding: 50px; text-align: center; border: 1px solid var(--bordure);">
            <div class="vide-icone" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"><i class="fas fa-box-open"></i></div>
            <p style="font-size: 1.1rem; color: var(--texte-gris);">Aucune commande en cours de livraison.</p>
            <a href="commandes.html" class="btn btn-orange mt-md">
              <i class="fas fa-shopping-bag"></i> Voir l'historique
            </a>
          </div>`;
        return;
      }

      // Mettre à jour ou créer chaque carte
      enCours.forEach(c => majCarte(c));
    }
  } catch (err) {
    document.getElementById('conteneur-cartes-commandes').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur lors du chargement des commandes.</div>';
  }
}

// ── DÉCONNEXION ──
document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── INIT ──
chargerCommandesEnCours();
// Rafraichissement automatique du statut global (timeline) toutes les 30s
refreshInterval = setInterval(chargerCommandesEnCours, 30000);
