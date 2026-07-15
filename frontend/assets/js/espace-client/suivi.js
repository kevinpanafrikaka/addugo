// ============================================================
// AdduGo — Suivi de Livraison Client
// ============================================================


const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── INIT UTILISATEUR ──
// L'avatar et le nom sont gérés par navbar.js

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
let carteSuivi = null;
let marqueurLivreur = null;
let marqueurClient = null;
let socketSuivi = null;

// ── UTILITAIRES ──
function formatPrix(montant) {
  return new Intl.NumberFormat('fr-GN').format(montant) + ' GNF';
}

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));
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

// ── ORDRE DES STATUTS ──
const ordreStatuts = [
  'en_attente', 'confirmee', 'en_preparation',
  'prete', 'en_livraison', 'livree'
];

// ── INITIALISATION CARTE LEAFLET ──
function initMap(statut) {
  const mapContainer = document.getElementById('map-suivi');
  if (!mapContainer) return;

  if (carteSuivi) {
    carteSuivi.remove();
    carteSuivi = null;
  }
  
  if (socketSuivi) {
    socketSuivi.disconnect();
    socketSuivi = null;
  }

  // Si on n'est pas au moins en cours de livraison ou prête, on ne montre pas la carte
  if (!['prete', 'en_livraison', 'livree'].includes(statut)) {
    mapContainer.style.display = 'none';
    return;
  }
  mapContainer.style.display = 'block';

  // Point de livraison fictif (Conakry centre)
  const clientCoords = [9.509167, -13.712222];
  
  carteSuivi = L.map('map-suivi').setView(clientCoords, 14);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(carteSuivi);

  // Icône Client (Maison)
  const iconeClient = L.divIcon({
    html: '<div style="background:var(--orange);color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-home"></i></div>',
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
  marqueurClient = L.marker(clientCoords, {icon: iconeClient}).addTo(carteSuivi);

  // Icône Livreur (Moto)
  const iconeLivreur = L.divIcon({
    html: '<div style="background:var(--texte);color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-motorcycle"></i></div>',
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  if (statut === 'en_livraison') {
    // Point de départ par défaut du livreur (si pas encore de signal GPS)
    let livreurCoords = [9.5350, -13.6600];
    marqueurLivreur = L.marker(livreurCoords, {icon: iconeLivreur}).addTo(carteSuivi);
    
    // Zoom pour englober les deux
    const bounds = L.latLngBounds(clientCoords, livreurCoords);
    carteSuivi.fitBounds(bounds, { padding: [30, 30] });

    // ── CONNEXION WEBSOCKET POUR LE SUIVI RÉEL ──
    socketSuivi = io('http://localhost:5000');
    
    socketSuivi.on('connect', () => {
      console.log('Client connecté au WebSocket. Join room: commande_', window.commandeActuelleId);
      socketSuivi.emit('join_commande', window.commandeActuelleId);
    });

    socketSuivi.on('update_position', (data) => {
      console.log('Nouvelle position reçue du livreur:', data);
      const newCoords = [data.lat, data.lng];
      
      // Mettre à jour la position de la moto sur la carte
      marqueurLivreur.setLatLng(newCoords);
      
      // Optionnel : Recadrer la carte pour toujours voir le livreur et le client
      // const newBounds = L.latLngBounds(clientCoords, newCoords);
      // carteSuivi.fitBounds(newBounds, { padding: [30, 30] });
    });
    
  } else if (statut === 'livree') {
    marqueurLivreur = L.marker(clientCoords, {icon: iconeLivreur}).addTo(carteSuivi);
    carteSuivi.setView(clientCoords, 16);
  } else if (statut === 'prete') {
    // Commerce coords
    let commerceCoords = [9.5350, -13.6600];
    const iconeCommerce = L.divIcon({
      html: '<div style="background:var(--info);color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-store"></i></div>',
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker(commerceCoords, {icon: iconeCommerce}).addTo(carteSuivi);
    const bounds = L.latLngBounds(clientCoords, commerceCoords);
    carteSuivi.fitBounds(bounds, { padding: [30, 30] });
  }

  // Patch pour éviter que la carte soit grise à cause de l'affichage display:none
  setTimeout(() => { if(carteSuivi) carteSuivi.invalidateSize(); }, 400);
}

// ── CHARGER COMMANDES EN COURS ──
async function chargerCommandesEnCours() {
  try {
    const res  = await apiFetch('/commandes/mes-commandes');
    const data = await res.json();

    const liste = document.getElementById('liste-en-cours');

    if (data.success) {
      const enCours = data.commandes.filter(c =>
        !['livree', 'annulee'].includes(c.statut)
      );

      if (enCours.length === 0) {
        liste.innerHTML = `
          <div class="vide">
            <div class="vide-icone"><i class="fas fa-box"></i></div>
            <p>Aucune commande en cours</p>
            <a href="commandes.html" class="btn btn-orange mt-md">
              Passer une commande
            </a>
          </div>`;
        return;
      }

      liste.innerHTML = enCours.map(c => `
        <div class="commande-en-cours-carte" onclick="afficherSuivi(${c.id})">
          <div>
            <div style="font-weight:700;font-family:var(--police-titre)">${c.commerce_nom}</div>
            <div class="texte-sm gris">#${String(c.id).padStart(5, '0')} — ${formatDate(c.date_creation)}</div>
          </div>
          <div class="flex gap-md" style="align-items:center">
            ${badgeStatut(c.statut)}
            <span class="prix">${formatPrix(c.montant_total)}</span>
            <i class="fas fa-chevron-right" style="color:var(--texte-gris)"></i>
          </div>
        </div>`).join('');
    }

  } catch (err) {
    document.getElementById('liste-en-cours').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── AFFICHER SUIVI DÉTAILLÉ ──
async function afficherSuivi(commandeId) {
  try {
    const res  = await apiFetch(`/commandes/${commandeId}`);
    const data = await res.json();

    if (!data.success) return;

    const c = data.commande;

    // Basculer l'affichage
    document.getElementById('commandes-en-cours').classList.add('cache');
    document.getElementById('detail-suivi').classList.remove('cache');

    // Infos commande
    document.getElementById('suivi-commerce').textContent = c.commerce_nom;
    document.getElementById('suivi-id').textContent       = `#${String(c.id).padStart(5, '0')}`;
    document.getElementById('suivi-badge').innerHTML      = badgeStatut(c.statut);
    document.getElementById('suivi-adresse').textContent  = c.adresse_livraison;
    document.getElementById('suivi-montant').textContent  = formatPrix(c.montant_total);
    document.getElementById('suivi-date').textContent     = formatDate(c.date_creation);

    // Timeline
    const indexActuel = ordreStatuts.indexOf(c.statut);
    ordreStatuts.forEach((statut, index) => {
      const etape = document.getElementById(`etape-${statut}`);
      if (!etape) return;
      etape.classList.remove('actif', 'complete');
      if (index < indexActuel)  etape.classList.add('complete');
      if (index === indexActuel) etape.classList.add('actif');
    });

    // Articles
    document.getElementById('suivi-liste-articles').innerHTML =
      (c.articles || []).map(a => `
        <div class="suivi-article-item">
          <div>
            <div class="suivi-article-nom">${a.produit_nom}</div>
            <div class="suivi-article-qte">Quantité : ${a.quantite}</div>
          </div>
          <div class="suivi-article-prix">${formatPrix(a.sous_total)}</div>
        </div>`).join('');

    // Rafraîchissement automatique toutes les 30s
    if (window.suiviInterval) clearInterval(window.suiviInterval);
    if (!['livree', 'annulee'].includes(c.statut)) {
      window.suiviInterval = setInterval(() => afficherSuivi(commandeId), 30000);
    }

    // Initialisation de la carte Leaflet (uniquement si nouveau ou changement de statut)
    if (window.commandeActuelleId !== commandeId || window.statutPrecedent !== c.statut) {
      window.commandeActuelleId = commandeId;
      window.statutPrecedent = c.statut;
      initMap(c.statut);
    }

  } catch (err) {
    console.error('Erreur suivi:', err);
  }
}

// ── RETOUR LISTE ──
document.getElementById('btn-retour-liste').addEventListener('click', () => {
  if (window.suiviInterval) clearInterval(window.suiviInterval);
  if (socketSuivi) { socketSuivi.disconnect(); socketSuivi = null; }
  window.commandeActuelleId = null;
  window.statutPrecedent = null;
  document.getElementById('detail-suivi').classList.add('cache');
  document.getElementById('commandes-en-cours').classList.remove('cache');
});

// ── RECHERCHE PAR ID ──
document.getElementById('btn-rechercher-commande').addEventListener('click', () => {
  const id = document.getElementById('input-commande-id').value.trim();
  if (id) afficherSuivi(parseInt(id));
});

// ── DÉCONNEXION ──
document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── VÉRIFIER URL PARAMS ──
const urlParams = new URLSearchParams(window.location.search);
const commandeId = urlParams.get('id');

// ── INIT ──
chargerCommandesEnCours();
if (commandeId) afficherSuivi(parseInt(commandeId));
