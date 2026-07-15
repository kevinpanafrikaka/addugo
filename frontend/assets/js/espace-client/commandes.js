// ============================================================
// AdduGo — Mes Commandes Client (commandes-client.js)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

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
    'en_attente':     { classe: 'statut-attente',    texte: '<i class="fas fa-hourglass-half"></i> En attente' },
    'confirmee':      { classe: 'statut-attente',    texte: '<i class="fas fa-check-circle"></i> Confirmée'   },
    'en_preparation': { classe: 'statut-livraison',  texte: '<i class="fas fa-wrench"></i> En préparation' },
    'prete':          { classe: 'statut-livraison',  texte: '<i class="fas fa-box"></i> Prête'          },
    'en_livraison':   { classe: 'statut-livraison',  texte: '<i class="fas fa-motorcycle"></i> En livraison' },
    'livree':         { classe: 'statut-livree',     texte: '<i class="fas fa-check-circle"></i> Livrée'     },
    'annulee':        { classe: 'statut-annulee',    texte: '<i class="fas fa-times-circle"></i> Annulée'    }
  };
  const c = config[statut] || { classe: 'statut-attente', texte: statut };
  return `<span class="badge-statut ${c.classe}">${c.texte}</span>`;
}

// ── CHARGER COMMANDES ──
let toutesCommandes = [];
let filtreActif = 'tous';

async function chargerCommandes() {
  try {
    const res  = await apiFetch('/commandes/mes-commandes');
    const data = await res.json();

    if (data.success) {
      toutesCommandes = data.commandes || [];
      afficherCommandes();
    }
  } catch (err) {
    const el = document.getElementById('liste-commandes');
    if (el) {
      el.innerHTML = '<div class="alerte alerte-erreur" style="grid-column:1/-1;"><i class="fas fa-times-circle"></i> Erreur lors du chargement des commandes.</div>';
    }
  }
}

function afficherCommandes() {
  const liste = document.getElementById('liste-commandes');
  if (!liste) return;

  let commandes = toutesCommandes;

  if (filtreActif !== 'tous') {
    commandes = commandes.filter(c => c.statut === filtreActif);
  }

  if (commandes.length === 0) {
    liste.innerHTML = `
      <div class="commande-vide" style="grid-column: 1/-1;">
        <i class="fas fa-shopping-bag"></i>
        <p style="font-weight:700; color:var(--texte); font-size:1.05rem;">Aucune commande trouvée</p>
        <p style="font-size:0.85rem; color:var(--texte-gris); margin-top:4px;">Vous n'avez pas encore passé de commande dans cette catégorie.</p>
      </div>`;
    return;
  }

  liste.innerHTML = commandes.map(c => {
    const logoUrl = c.commerce_logo 
      ? (c.commerce_logo.startsWith('http') ? c.commerce_logo : `https://addugo.up.railway.app${c.commerce_logo}`)
      : null;
    return `
    <div class="commande-carte">
      <div class="commande-carte-entete">
        <div>
          <div class="commande-carte-commerce" style="display:flex; align-items:center; gap:8px;">
            ${logoUrl 
              ? `<img src="${logoUrl}" alt="${c.commerce_nom}" style="width:24px; height:24px; border-radius:6px; object-fit:cover; border:1px solid var(--bordure);">`
              : `<i class="fas fa-store" style="color:var(--orange);"></i>`
            }
            ${c.commerce_nom || 'Boutique AdduGo'}
          </div>
          <div class="commande-carte-id">Commande #${String(c.id).padStart(5, '0')}</div>
        </div>
        ${badgeStatut(c.statut)}
      </div>
      <div class="commande-carte-corps">
        <div class="commande-carte-infos">
          <div class="commande-carte-info">
            <i class="fas fa-calendar-alt"></i>
            ${formatDate(c.date_creation)}
          </div>
          <div class="commande-carte-info">
            <i class="fas fa-map-marker-alt"></i>
            ${c.adresse_livraison || 'Adresse non spécifiée'}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--texte-gris); font-weight: 700; text-transform: uppercase;">Total TTC</div>
          <div class="commande-carte-montant">${formatPrix(c.montant_total)}</div>
        </div>
      </div>
      <div class="commande-carte-actions">
        ${c.statut === 'en_livraison' ? `
          <a href="suivi.html?id=${c.id}" class="btn btn-orange btn-sm" style="border-radius:10px; text-decoration:none; font-weight:700;">
            <i class="fas fa-motorcycle"></i> Suivre ma livraison
          </a>` : ''}
        ${c.statut === 'en_attente' ? `
          <button class="btn btn-sm" style="border-radius:10px; background:rgba(239,68,68,0.1); color:#EF4444; border:1px solid rgba(239,68,68,0.2); font-weight:700;" onclick="annulerCommande(${c.id})">
            <i class="fas fa-times"></i> Annuler la commande
          </button>` : ''}
        ${c.statut !== 'en_livraison' ? `
        <button class="btn btn-contour-orange btn-sm" style="border-radius:10px; font-weight:700;" onclick="voirDetails(${c.id})">
          <i class="fas fa-eye"></i> Détails
        </button>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ── FILTRES ──
document.querySelectorAll('.filtre-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('actif'));
    btn.classList.add('actif');
    filtreActif = btn.dataset.statut;
    afficherCommandes();
  });
});



// ── ANNULER COMMANDE ──
window.annulerCommande = async (id) => {
  if (!confirm('Voulez-vous vraiment annuler cette commande ?')) return;

  const res  = await apiFetch(`/commandes/${id}/statut`, {
    method: 'PUT',
    body: JSON.stringify({ statut: 'annulee', commentaire: 'Annulée par le client' })
  });
  const data = await res.json();
  if (data.success) await chargerCommandes();
};

// ── VOIR DÉTAILS ──
window.voirDetails = (id) => {
  window.location.href = `suivi.html?id=${id}`;
};

// ── INIT ──
chargerCommandes();
