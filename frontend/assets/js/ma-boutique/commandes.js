// ============================================================
// AdduGo — Commandes Commerce
// ============================================================


const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── INIT UTILISATEUR ──
const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();
const elUserAvatar = document.getElementById('user-avatar');
if (elUserAvatar) elUserAvatar.textContent = initiales;
const elUserNom = document.getElementById('user-nom');
if (elUserNom) elUserNom.textContent = `${user.prenom} ${user.nom}`;
const elSidebarAvatar = document.getElementById('sidebar-avatar');
if (elSidebarAvatar) elSidebarAvatar.textContent = initiales;
const elSidebarNom = document.getElementById('sidebar-nom');
if (elSidebarNom) elSidebarNom.textContent = `${user.prenom} ${user.nom}`;

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

// ── PROCHAINS STATUTS ──
function prochainsStatuts(statutActuel) {
  const flux = {
    'en_attente':     ['confirmee', 'annulee'],
    'confirmee':      ['en_preparation', 'annulee'],
    'en_preparation': ['prete'],
    'prete':          [],
    'en_livraison':   [],
    'livree':         [],
    'annulee':        []
  };
  return flux[statutActuel] || [];
}

// ── VARIABLES ──
let commerceId     = localStorage.getItem('addugo_commerce_id');
let toutesCommandes = [];
let filtreActif    = 'tous';
let commandeActive = null;

// ── INIT COMMERCE ──
async function initCommerce() {
  if (!commerceId) {
    const res  = await apiFetch('/commerces/mes/commerces');
    const data = await res.json();
    if (data.success && data.commerces.length > 0) {
      commerceId = data.commerces[0].id;
      localStorage.setItem('addugo_commerce_id', commerceId);
    }
  }
  await chargerCommandes();
}

// ── CHARGER COMMANDES ──
async function chargerCommandes() {
  try {
    const res  = await apiFetch(`/commandes/commerce/${commerceId}`);
    const data = await res.json();

    toutesCommandes = data.commandes || [];

    // ── MINI-STATS HEADER ──
    const elTotal    = document.getElementById('stat-total');
    const elAttente  = document.getElementById('stat-attente');
    const elLivrees  = document.getElementById('stat-livrees');
    if (elTotal)   elTotal.textContent   = toutesCommandes.length;
    if (elAttente) elAttente.textContent = toutesCommandes.filter(c => c.statut === 'en_attente').length;
    if (elLivrees) elLivrees.textContent = toutesCommandes.filter(c => c.statut === 'livree').length;

    afficherCommandes();

  } catch (err) {
    document.getElementById('liste-commandes').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── AFFICHER COMMANDES ──
function afficherCommandes() {
  const liste = document.getElementById('liste-commandes');
  let commandes = toutesCommandes;

  if (filtreActif !== 'tous') {
    commandes = commandes.filter(c => c.statut === filtreActif);
  }

  if (commandes.length === 0) {
    liste.innerHTML = `
      <div class="vide">
        <div class="vide-icone"><i class="fas fa-shopping-cart"></i></div>
        <p>Aucune commande trouvée</p>
      </div>`;
    return;
  }

  liste.innerHTML = commandes.map(c => `
    <div class="commande-carte">
      <div class="commande-carte-entete">
        <div>
          <div class="commande-carte-commerce">
            ${c.client_nom} ${c.client_prenom}
          </div>
          <div class="commande-carte-id">#${String(c.id).padStart(5, '0')}</div>
        </div>
        ${badgeStatut(c.statut)}
      </div>
      <div class="commande-carte-corps">
        <div class="commande-carte-infos">
          <div class="commande-carte-info">
            <i class="fas fa-calendar"></i>
            ${formatDate(c.date_creation)}
          </div>
          <div class="commande-carte-info">
            <i class="fas fa-phone"></i>
            ${c.client_telephone || '—'}
          </div>
          <div class="commande-carte-info">
            <i class="fas fa-map-marker-alt"></i>
            ${c.adresse_livraison}
          </div>
        </div>
        <div class="commande-carte-droite">
          <div class="commande-carte-montant">${formatPrix(c.montant_total)}</div>
        </div>
      </div>
      <div class="commande-carte-actions">
        <button class="btn btn-contour-orange btn-sm"
          onclick="voirDetail(${c.id})">
          <i class="fas fa-eye"></i> Voir détail
        </button>
        ${c.statut === 'en_livraison' ? `
        <a href="suivi.html?id=${c.id}" class="btn btn-sm btn-orange" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
          <i class="fas fa-map-marker-alt"></i> Suivre la livraison
        </a>` : ''}
        ${prochainsStatuts(c.statut).map(s => `
          <button class="btn btn-sm ${s === 'annulee' ? '' : 'btn-bleu'}"
            style="${s === 'annulee' ? 'background:var(--erreur-bg);color:var(--erreur)' : ''}"
            onclick="changerStatut(${c.id}, '${s}')">
            ${labelStatut(s)}
          </button>`).join('')}
      </div>
    </div>`).join('');
}

function labelStatut(statut) {
  const labels = {
    'confirmee':      '<i class="fas fa-check-circle"></i> Confirmer',
    'en_preparation': '<i class="fas fa-wrench"></i> Préparer',
    'prete':          '<i class="fas fa-box"></i> Prête',
    'annulee':        '<i class="fas fa-times-circle"></i> Annuler'
  };
  return labels[statut] || statut;
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

// ── VOIR DÉTAIL ──
const modal = document.getElementById('modal-commande');

async function voirDetail(commandeId) {
  commandeActive = commandeId;
  document.getElementById('modal-commande-id').textContent = `#${String(commandeId).padStart(5, '0')}`;
  modal.classList.add('ouvert');

  try {
    const res  = await apiFetch(`/commandes/${commandeId}`);
    const data = await res.json();

    if (data.success) {
      const c = data.commande;

      document.getElementById('detail-commande-contenu').innerHTML = `
        <div class="flex-entre mb-md">
          <div>
            <div style="font-weight:700;font-family:var(--police-titre);font-size:1.1rem">
              ${c.client_nom} ${c.client_prenom}
            </div>
            <div class="texte-sm gris">${formatDate(c.date_creation)}</div>
          </div>
          ${badgeStatut(c.statut)}
        </div>

        <div class="suivi-infos mb-md">
          <div class="suivi-info-item">
            <i class="fas fa-map-marker-alt"></i>
            <div>
              <div class="suivi-info-label">Adresse livraison</div>
              <div class="suivi-info-val">${c.adresse_livraison}</div>
            </div>
          </div>
          <div class="suivi-info-item">
            <i class="fas fa-money-bill-wave"></i>
            <div>
              <div class="suivi-info-label">Montant total</div>
              <div class="suivi-info-val prix">${formatPrix(c.montant_total)}</div>
            </div>
          </div>
        </div>

        <h4 class="mb-md">Articles commandés</h4>
        ${(c.articles || []).map(a => `
          <div class="suivi-article-item">
            <div>
              <div class="suivi-article-nom">${a.produit_nom}</div>
              <div class="suivi-article-qte">Quantité : ${a.quantite}</div>
            </div>
            <div class="suivi-article-prix">${formatPrix(a.sous_total)}</div>
          </div>`).join('')}

        <h4 class="mt-lg mb-md">Historique des statuts</h4>
        ${(c.historique || []).map(h => `
          <div class="flex gap-md mb-sm" style="align-items:center">
            ${badgeStatut(h.statut)}
            <span class="texte-xs gris">${formatDate(h.date_changement)}</span>
            ${h.commentaire ? `<span class="texte-xs">${h.commentaire}</span>` : ''}
          </div>`).join('')}`;

      // Boutons statut
      const btnGroupe = document.getElementById('btn-statut-groupe');
      btnGroupe.innerHTML = prochainsStatuts(c.statut).map(s => `
        <button class="btn btn-sm ${s === 'annulee' ? '' : 'btn-orange'}"
          style="${s === 'annulee' ? 'background:var(--erreur-bg);color:var(--erreur)' : ''}"
          onclick="changerStatut(${c.id}, '${s}')">
          ${labelStatut(s)}
        </button>`).join('');
    }
  } catch (err) {
    document.getElementById('detail-commande-contenu').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── CHANGER STATUT ──
async function changerStatut(commandeId, nouveauStatut) {
  try {
    const res  = await apiFetch(`/commandes/${commandeId}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ statut: nouveauStatut })
    });
    const data = await res.json();

    if (data.success) {
      modal.classList.remove('ouvert');
      await chargerCommandes();
    }
  } catch (err) {
    console.error('Erreur changerStatut:', err);
  }
}

// ── FERMER MODAL ──
document.getElementById('modal-fermer').addEventListener('click',
  () => modal.classList.remove('ouvert'));
document.getElementById('btn-fermer-detail').addEventListener('click',
  () => modal.classList.remove('ouvert'));

// ── DÉCONNEXION ──
document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── INIT ──
initCommerce();
