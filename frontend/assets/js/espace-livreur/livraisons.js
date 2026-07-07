// ============================================================
// AdduGo — Livraisons Livreur (livraisons-livreur.js)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../login.html';

// ── INIT UTILISATEUR ──
const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();
if (document.getElementById('user-avatar')) document.getElementById('user-avatar').textContent = initiales;
if (document.getElementById('user-nom')) document.getElementById('user-nom').textContent = `${user.prenom} ${user.nom}`;
if (document.getElementById('sidebar-avatar')) document.getElementById('sidebar-avatar').textContent = initiales;
if (document.getElementById('sidebar-nom')) document.getElementById('sidebar-nom').textContent = `${user.prenom} ${user.nom}`;

// ── UTILITAIRES ──
function formatPrix(montant) {
  return new Intl.NumberFormat('fr-GN').format(montant || 0) + ' GNF';
}

function formatDate(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));
}

function badgeStatutLivraison(statut) {
  const config = {
    'assignee': { classe: 'badge-avertissement', texte: '<i class="fas fa-clipboard-list"></i> Assignée' },
    'en_cours': { classe: 'badge-orange',        texte: '<i class="fas fa-motorcycle"></i> En cours' },
    'en_livraison': { classe: 'badge-orange',   texte: '<i class="fas fa-motorcycle"></i> En livraison' },
    'livree':   { classe: 'badge-succes',        texte: '<i class="fas fa-check-circle"></i> Livrée' },
    'echouee':  { classe: 'badge-erreur',        texte: '<i class="fas fa-times-circle"></i> Échouée' }
  };
  const c = config[statut] || { classe: 'badge-info', texte: statut };
  return `<span class="badge ${c.classe}">${c.texte}</span>`;
}

// ── VARIABLES ──
let toutesLivraisons = [];
let filtreActif      = 'tous';

// ── CHARGER LIVRAISONS ──
async function chargerLivraisons() {
  const liste = document.getElementById('liste-livraisons');
  if (!liste) return;

  try {
    const res  = await apiFetch('/livreurs/mes-livraisons');
    const data = await res.json();

    toutesLivraisons = data.livraisons || [];
    afficherLivraisons();

  } catch (err) {
    console.error('Erreur chargerLivraisons:', err);
    if (liste) {
      liste.innerHTML = `
        <div class="vide" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--blanc); border-radius: 16px; border: 1px solid var(--bordure);">
          <div class="vide-icone" style="font-size:2.5rem; margin-bottom:10px;"><i class="fas fa-bicycle" style="color:var(--orange);margin-right:4px;"></i></div>
          <p style="font-weight:700; color:var(--texte);">Aucune livraison effectuée pour l'instant</p>
        </div>`;
    }
  }
}

// ── AFFICHER LIVRAISONS ──
function afficherLivraisons() {
  const liste = document.getElementById('liste-livraisons');
  if (!liste) return;

  let livraisons = toutesLivraisons;

  if (filtreActif !== 'tous') {
    livraisons = livraisons.filter(l => l.statut === filtreActif);
  }

  if (livraisons.length === 0) {
    liste.innerHTML = `
      <div class="vide" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--blanc); border-radius: 16px; border: 1px solid var(--bordure);">
        <div class="vide-icone" style="font-size:2.5rem; margin-bottom:10px;"><i class="fas fa-bicycle" style="color:var(--orange);margin-right:4px;"></i></div>
        <p style="font-weight:700; color:var(--texte);">Aucune livraison trouvée</p>
        <p style="font-size:0.85rem; color:var(--texte-gris); margin-top:4px;">Vous n'avez pas encore de course dans cette catégorie.</p>
        <a href="dashboard.html" class="btn btn-orange btn-sm" style="border-radius:10px; text-decoration:none; display:inline-block; font-weight:700; margin-top:12px; padding:8px 16px;">
          Voir les commandes disponibles
        </a>
      </div>`;
    return;
  }

  liste.innerHTML = livraisons.map(l => `
    <div class="livraison-dispo-carte" style="background:var(--blanc); border-radius:16px; border:1px solid var(--bordure); padding:18px 20px; box-shadow:0 4px 14px rgba(0,0,0,0.03);">
      <div class="livraison-dispo-entete" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #F3F4F6; padding-bottom:12px; margin-bottom:12px;">
        <div>
          <div style="font-size:1.05rem; font-weight:800; font-family:var(--police-titre); color:var(--texte);">${l.commerce_nom || 'Boutique AdduGo'}</div>
          <div style="font-size:0.78rem; color:var(--texte-clair);">Livraison #${String(l.id).padStart(5, '0')}</div>
        </div>
        ${badgeStatutLivraison(l.statut)}
      </div>
      <div class="livraison-dispo-infos" style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-size:0.86rem; color:var(--texte-gris); display:flex; align-items:center; gap:8px;">
          <i class="fas fa-calendar-alt" style="color:var(--orange);"></i> ${formatDate(l.date_assignation)}
        </div>
        <div style="font-size:0.86rem; color:var(--texte-gris); display:flex; align-items:center; gap:8px;">
          <i class="fas fa-user" style="color:var(--orange);"></i> Client: ${l.client_nom || ''} ${l.client_prenom || 'Client'}
        </div>
        <div style="font-size:0.86rem; color:var(--texte-gris); display:flex; align-items:center; gap:8px;">
          <i class="fas fa-phone" style="color:var(--orange);"></i> ${l.client_telephone || '—'}
        </div>
        <div style="font-size:0.86rem; color:var(--texte-gris); display:flex; align-items:center; gap:8px;">
          <i class="fas fa-map-marker-alt" style="color:var(--orange);"></i> ${l.adresse_livraison || 'Conakry'}
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:12px; border-top:1px solid #F3F4F6;">
        <span style="font-size:1.1rem; font-weight:800; font-family:var(--police-titre); color:var(--orange);">${formatPrix(l.montant_total)}</span>
        ${l.statut !== 'livree' ? `
          <button class="btn btn-orange btn-sm" onclick="marquerLivree(${l.id})" style="border-radius:10px; font-weight:700; padding:6px 14px;">
            <i class="fas fa-check-circle"></i> Marquer livrée
          </button>
        ` : '<span style="color:#10B981; font-weight:700; font-size:0.85rem;"><i class="fas fa-check"></i> Terminée</span>'}
      </div>
    </div>`).join('');
}

// ── FILTRES PAR STATUT ──
document.querySelectorAll('.filtres-barre .filtre-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtres-barre .filtre-btn').forEach(b => b.classList.remove('actif'));
    btn.classList.add('actif');
    filtreActif = btn.dataset.statut || 'tous';
    afficherLivraisons();
  });
});

// ── MARQUER LIVRÉE ──
window.marquerLivree = async (id) => {
  if (!confirm('Confirmez-vous que cette commande a été livrée au client ?')) return;

  try {
    const res = await apiFetch(`/livreurs/statut-livraison/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ statut: 'livree' })
    });
    const data = await res.json();
    if (data.success) {
      alert('Livraison marquée comme livrée !');
      await chargerLivraisons();
    } else {
      alert(data.message || 'Erreur lors de la mise à jour.');
    }
  } catch (err) {
    console.error('Erreur marquerLivree:', err);
  }
};

// ── DÉCONNEXION ──
document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  chargerLivraisons();
});

chargerLivraisons();
