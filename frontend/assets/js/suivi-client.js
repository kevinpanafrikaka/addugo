// ============================================================
// AdduGo — Suivi de Livraison Client
// ============================================================


const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../login.html';

// ── INIT UTILISATEUR ──
const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();
document.getElementById('user-avatar').textContent    = initiales;
document.getElementById('user-nom').textContent       = `${user.prenom} ${user.nom}`;
document.getElementById('sidebar-avatar').textContent = initiales;
document.getElementById('sidebar-nom').textContent    = `${user.prenom} ${user.nom}`;

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

  } catch (err) {
    console.error('Erreur suivi:', err);
  }
}

// ── RETOUR LISTE ──
document.getElementById('btn-retour-liste').addEventListener('click', () => {
  if (window.suiviInterval) clearInterval(window.suiviInterval);
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
