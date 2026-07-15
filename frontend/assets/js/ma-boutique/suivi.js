// ============================================================
// AdduGo — Suivi de Livraison Boutique
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── VARIABLES GLOBALES ──
let cartes = {};
let marqueursLivreur = {};
let marqueursClient = {};
let sockets = {};

let refreshInterval = null;

const urlParams = new URLSearchParams(window.location.search);
const commandeIdUrl = urlParams.get('id');

if (!commandeIdUrl) {
    document.getElementById('conteneur-cartes-commandes').innerHTML = `
      <div class="vide" style="background: white; border-radius: 18px; padding: 50px; text-align: center; border: 1px solid var(--bordure);">
        <div class="vide-icone" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"><i class="fas fa-search"></i></div>
        <p style="font-size: 1.1rem; color: var(--texte-gris);">Aucune commande spécifiée.</p>
        <a href="commandes.html" class="btn btn-orange mt-md">
          <i class="fas fa-arrow-left"></i> Retour aux commandes
        </a>
      </div>`;
}

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

  mapContainer.style.display = 'block';

  if (cartes[commandeId]) return;

  const centreConakry = [9.509167, -13.712222];

  cartes[commandeId] = L.map(`map-suivi-${commandeId}`).setView(centreConakry, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(cartes[commandeId]);

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
      const iconeLivreur = L.divIcon({
        html: '<div style="background:var(--texte);color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-motorcycle"></i></div>',
        className: '', iconSize: [30, 30], iconAnchor: [15, 15]
      });
      marqueursLivreur[commandeId] = L.marker(latlng, {icon: iconeLivreur}).addTo(cartes[commandeId]);
      cartes[commandeId].setView(latlng, 15);
    }
  });

  if (adresseLivraison) {
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

  setTimeout(() => { if(cartes[commandeId]) cartes[commandeId].invalidateSize(); }, 1000);
}

// ── GENERATION HTML COMPLET CARTE ──
function genererHtmlComplet(c) {
  const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.client_nom || 'Client')}&background=FFEDD5&color=FF6B00&size=100`;

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
    <div class="carte-boutique-en-tete">
      <img src="${fallbackLogo}" alt="Client" class="carte-boutique-logo" style="border-radius: 50%;">
      <div>
        <h3 style="margin:0; font-size: 1.4rem; font-family: var(--police-titre); color: var(--texte);">${c.client_prenom} ${c.client_nom}</h3>
        <div class="texte-sm gris" style="margin-top: 4px;">Commande #${String(c.id).padStart(5, '0')}</div>
      </div>
      <div style="margin-left: auto;" id="badge-statut-${c.id}">${badgeStatut(c.statut)}</div>
    </div>

    <div class="timeline-horizontale-container">
      <div class="timeline-horizontale">
        ${etapesHtml}
        <div class="timeline-horizontale-ligne-active" id="timeline-ligne-${c.id}" style="width: ${progression}%; background: #1a1a1a;"></div>
      </div>
    </div>

    <!-- CARTE SUIVI EN DIRECT -->
    <div id="map-suivi-${c.id}" style="width: 100%; height: 350px; border-radius: var(--rayon-lg); margin: 2rem 0; background: var(--bg-secondaire); display: none; z-index: 1;"></div>
    
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

function majCarte(c) {
  const conteneurPrincipal = document.getElementById('conteneur-cartes-commandes');
  let carte = document.getElementById(`carte-commande-${c.id}`);

  if (!carte) {
    carte = document.createElement('div');
    carte.id = `carte-commande-${c.id}`;
    carte.className = 'suivi-conteneur-carte anime-slide-up';
    carte.style.cssText = 'background: var(--blanc); border: 1px solid var(--bordure); border-radius: 18px; padding: 25px; box-shadow: 0 4px 16px rgba(0,0,0,0.02); position: relative; margin-bottom: 30px;';
    
    carte.innerHTML = genererHtmlComplet(c);
    conteneurPrincipal.appendChild(carte);
  } else {
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

  initMap(c.id, c.statut, c.adresse_livraison);
}

// ── BOUCLE DE CHARGEMENT ──
async function chargerCommandeUnique() {
  if (!commandeIdUrl) return;

  try {
    const res  = await apiFetch('/commandes/' + commandeIdUrl);
    const data = await res.json();
    const conteneurPrincipal = document.getElementById('conteneur-cartes-commandes');

    if (data.success && data.commande) {
      const isInitialLoad = conteneurPrincipal.querySelector('.chargement') !== null;
      if (isInitialLoad) conteneurPrincipal.innerHTML = '';
      majCarte(data.commande);
    } else {
      conteneurPrincipal.innerHTML = `
      <div class="vide" style="background: white; border-radius: 18px; padding: 50px; text-align: center; border: 1px solid var(--bordure);">
        <div class="vide-icone" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 20px;"><i class="fas fa-exclamation-triangle"></i></div>
        <p style="font-size: 1.1rem; color: var(--texte-gris);">Commande introuvable.</p>
      </div>`;
    }
  } catch (err) {
    document.getElementById('conteneur-cartes-commandes').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur lors du chargement de la commande.</div>';
  }
}

// ── DÉCONNEXION ──
document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── INIT ──
chargerCommandeUnique();
refreshInterval = setInterval(chargerCommandeUnique, 10000); // 10 secondes pour refresh le status si ça change
