// ============================================================
// AdduGo — Dashboard Livreur (dashboard-livreur.js)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── INIT UTILISATEUR ──
const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();
if (document.getElementById('user-avatar')) document.getElementById('user-avatar').textContent = initiales;
if (document.getElementById('user-nom')) document.getElementById('user-nom').textContent = `${user.prenom} ${user.nom}`;
if (document.getElementById('sidebar-avatar')) document.getElementById('sidebar-avatar').textContent = initiales;
if (document.getElementById('sidebar-nom')) document.getElementById('sidebar-nom').textContent = `${user.prenom} ${user.nom}`;
if (document.getElementById('prenom-utilisateur')) document.getElementById('prenom-utilisateur').textContent = user.prenom || 'Livreur';

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

// ── DISPONIBILITÉ ──
let estDisponible = true;

async function toggleDisponibilite() {
  estDisponible = !estDisponible;
  mettreAJourUI();

  try {
    await apiFetch('/livreurs/disponibilite', {
      method: 'PUT',
      body: JSON.stringify({ est_disponible: estDisponible ? 1 : 0 })
    });
  } catch (err) {
    console.error('Erreur disponibilite:', err);
  }
}

function mettreAJourUI() {
  const carte = document.getElementById('carte-disponibilite');
  const icone = document.getElementById('dispo-icone');
  const titre = document.getElementById('dispo-titre');
  const desc  = document.getElementById('dispo-desc');

  if (!carte || !icone || !titre || !desc) return;

  if (estDisponible) {
    carte.classList.remove('indisponible');
    icone.textContent = '<i class="fas fa-circle" style="color:#10B981;font-size:0.7rem;"></i>';
    titre.textContent = 'Vous êtes disponible';
    desc.textContent  = 'Vous pouvez recevoir des livraisons';
  } else {
    carte.classList.add('indisponible');
    icone.textContent = '<i class="fas fa-circle" style="color:#EF4444;font-size:0.7rem;"></i>';
    titre.textContent = 'Vous êtes indisponible';
    desc.textContent  = 'Vous ne recevrez pas de nouvelles livraisons';
  }
}

document.getElementById('btn-toggle-dispo')?.addEventListener('click', toggleDisponibilite);
document.getElementById('toggle-dispo-btn')?.addEventListener('click', toggleDisponibilite);

// ── CHARGER COMMANDES DISPONIBLES ──
async function chargerCommandesDisponibles() {
  const liste = document.getElementById('liste-disponibles');
  if (!liste) return;

  try {
    const res  = await apiFetch('/livreurs/commandes-disponibles');
    const data = await res.json();

    const totalEl = document.getElementById('stat-disponibles');
    const totalCount = data.total !== undefined ? data.total : (data.commandes ? data.commandes.length : 0);
    if (totalEl) totalEl.textContent = totalCount;

    if (!data.success || !data.commandes || data.commandes.length === 0) {
      liste.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-box" style="margin-right:4px;"></i></div>
          <p>Aucune commande disponible pour l'instant</p>
          <p style="font-size:0.82rem; color:var(--texte-clair); font-weight:normal; margin-top:4px;">Les commandes apparaissent ici dès qu'elles sont prêtes en boutique.</p>
        </div>`;
      return;
    }

    liste.innerHTML = data.commandes.map(c => `
      <div class="livraison-dispo-carte">
        <div class="livraison-dispo-entete">
          <div class="livraison-dispo-commerce">${c.commerce_nom || 'Boutique AdduGo'}</div>
          <span class="prix">${formatPrix(c.montant_total)}</span>
        </div>
        <div class="livraison-dispo-infos">
          <div class="livraison-dispo-info">
            <i class="fas fa-map-marker-alt"></i>
            <span><strong>Retrait :</strong> ${c.commerce_adresse || 'Conakry'}</span>
          </div>
          <div class="livraison-dispo-info">
            <i class="fas fa-home"></i>
            <span><strong>Livraison :</strong> ${c.adresse_livraison || 'Conakry'}</span>
          </div>
          <div class="livraison-dispo-info">
            <i class="fas fa-user"></i>
            <span><strong>Client :</strong> ${c.client_nom || ''} ${c.client_prenom || 'Client'}</span>
          </div>
          <div class="livraison-dispo-info">
            <i class="fas fa-phone"></i>
            <span><strong>Téléphone :</strong> ${c.client_telephone || '—'}</span>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 4px;">
          ${c.commerce_utilisateur_id ? `
          <a href="../client/messages.html?user=${c.commerce_utilisateur_id}"
             class="btn btn-contour-orange btn-sm"
             style="border-radius:10px; font-weight:700; flex:1; padding:10px; display:flex; align-items:center; justify-content:center; gap:6px; text-decoration:none;">
            <i class="fas fa-comment-dots"></i> Contacter
          </a>` : ''}
          <button class="btn btn-orange btn-sm" style="border-radius:10px; font-weight:700; flex:2; padding:10px;"
            onclick="accepterLivraison(${c.id})">
            <i class="fas fa-motorcycle"></i> Accepter cette livraison
          </button>
        </div>
      </div>`).join('');

  } catch (err) {
    console.error('Erreur chargerCommandesDisponibles:', err);
    if (liste) {
      liste.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-box" style="margin-right:4px;"></i></div>
          <p>Aucune commande disponible pour l'instant</p>
        </div>`;
    }
  }
}

// ── ACCEPTER LIVRAISON ──
window.accepterLivraison = async (commandeId) => {
  if (!confirm('Voulez-vous accepter cette livraison ?')) return;

  try {
    const res  = await apiFetch('/livreurs/accepter', {
      method: 'POST',
      body: JSON.stringify({ commande_id: commandeId })
    });
    const data = await res.json();

    if (data.success) {
      alert('Livraison acceptée ! Rendez-vous chez le commerce.');
      await chargerCommandesDisponibles();
      await chargerLivraisons();
    } else {
      alert(data.message || 'Erreur lors de l\'acceptation.');
    }
  } catch (err) {
    console.error('Erreur accepterLivraison:', err);
  }
};

// ── CHARGER MES LIVRAISONS RÉCENTES ──
async function chargerLivraisons() {
  const liste = document.getElementById('liste-livraisons-recentes');
  if (!liste) return;

  try {
    const res  = await apiFetch('/livreurs/mes-livraisons');
    const data = await res.json();

    const livraisons = data.livraisons || [];

    const elTotal = document.getElementById('stat-total');
    if (elTotal) elTotal.textContent = livraisons.length;

    const elEnCours = document.getElementById('stat-en-cours');
    if (elEnCours) elEnCours.textContent = livraisons.filter(l => ['assignee','en_cours','en_livraison'].includes(l.statut)).length;

    const elTerminees = document.getElementById('stat-terminees');
    if (elTerminees) elTerminees.textContent = livraisons.filter(l => l.statut === 'livree').length;

    if (livraisons.length === 0) {
      liste.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-bicycle" style="color:var(--orange);margin-right:4px;"></i></div>
          <p>Aucune livraison effectuée pour l'instant</p>
        </div>`;
      return;
    }

    const recentes = livraisons.slice(0, 5);
    liste.innerHTML = recentes.map(l => `
      <div class="commande-item">
        <div class="commande-info">
          <div class="commande-icone"><i class="fas fa-bicycle" style="color:var(--orange);margin-right:4px;"></i></div>
          <div>
            <div class="commande-nom">${l.commerce_nom || 'Boutique AdduGo'}</div>
            <div class="commande-date">${formatDate(l.date_assignation)}</div>
          </div>
        </div>
        <div style="display:flex; gap:14px; align-items:center;">
          <span class="badge ${l.statut === 'livree' ? 'badge-succes' : 'badge-orange'}">
            ${l.statut === 'livree' ? 'Livrée' : l.statut === 'en_cours' ? '<i class="fas fa-bicycle" style="color:var(--orange);margin-right:4px;"></i>En cours' : '<i class="fas fa-clipboard-list" style="margin-right:4px;"></i>Assignée'}
          </span>
          <span class="commande-montant">${formatPrix(l.montant_total)}</span>
        </div>
      </div>`).join('');

  } catch (err) {
    console.error('Erreur chargerLivraisons:', err);
    if (liste) {
      liste.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-bicycle" style="color:var(--orange);margin-right:4px;"></i></div>
          <p>Aucune livraison effectuée pour l'instant</p>
        </div>`;
    }
  }
}

// ── RAFRAÎCHIR ──
document.getElementById('btn-rafraichir')?.addEventListener('click', async () => {
  await chargerCommandesDisponibles();
  await chargerLivraisons();
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  chargerCommandesDisponibles();
  chargerLivraisons();
});

// Lancement immédiat au cas où le DOM est déjà disponible
chargerCommandesDisponibles();
chargerLivraisons();
