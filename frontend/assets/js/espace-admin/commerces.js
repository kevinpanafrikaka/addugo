// ============================================================
// AdduGo — Gestion des Commerces (Admin)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── INIT UTILISATEUR ──
const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();

const avatarHtml = user.photo_profil 
  ? `<img src="${user.photo_profil.startsWith('http') ? user.photo_profil : 'http://localhost:5000' + user.photo_profil}" alt="Profil" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` 
  : initiales;

document.getElementById('user-avatar').innerHTML    = avatarHtml;
document.getElementById('user-nom').textContent       = `${user.prenom} ${user.nom}`;
document.getElementById('sidebar-avatar').innerHTML = avatarHtml;
document.getElementById('sidebar-nom').textContent    = `${user.prenom} ${user.nom}`;

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
let listeCommerces = [];

// ── UTILITAIRES ──
function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('fr-GN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function afficherAlerte(message, type = 'succes') {
  const conteneur = document.getElementById('alerte-action');
  const icone = type === 'succes' ? 'fa-check-circle' : 'fa-times-circle';
  conteneur.innerHTML = `
    <div class="alerte alerte-${type} anime-slide-up" style="margin-bottom:var(--espace-md)">
      <i class="fas ${icone}"></i> ${message}
    </div>`;
  
  setTimeout(() => {
    conteneur.innerHTML = '';
  }, 4000);
}

// ── CHANGER LE STATUT D'UN COMMERCE ──
async function toggleStatutCommerce(commerceId, estActifActuel) {
  const nouveauStatut = !estActifActuel; // Inversion du statut

  try {
    const res = await apiFetch(`/admin/commerces/${commerceId}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ est_actif: nouveauStatut })
    });

    const data = await res.json();

    if (data.success) {
      afficherAlerte(`Commerce ${nouveauStatut ? 'activé' : 'suspendu'} avec succès !`, 'succes');
      // Mettre à jour la variable globale et re-rendre
      const commerceIndex = listeCommerces.findIndex(c => c.id === commerceId);
      if (commerceIndex > -1) {
        listeCommerces[commerceIndex].est_actif = nouveauStatut;
        rendreTableau(listeCommerces);
      }
    } else {
      afficherAlerte(data.message || 'Erreur lors du changement de statut.', 'erreur');
    }
  } catch (err) {
    console.error('Erreur toggleStatutCommerce:', err);
    afficherAlerte('Erreur réseau.', 'erreur');
  }
}

// ── RENDRE LE TABLEAU ──
function rendreTableau(donnees) {
  const conteneur = document.getElementById('liste-tous-commerces');

  if (donnees.length === 0) {
    conteneur.innerHTML = `
      <div class="vide">
        <div class="vide-icone"><i class="fas fa-store"></i></div>
        <p>Aucun commerce trouvé</p>
      </div>`;
    return;
  }

  conteneur.innerHTML = `
    <div class="tableau-conteneur">
      <table class="tableau">
        <thead>
          <tr>
            <th>ID</th>
            <th>Commerce</th>
            <th>Propriétaire</th>
            <th>Contact</th>
            <th>Date de création</th>
            <th style="text-align:center">Statut (Activer/Désactiver)</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map(c => {
            const isActif = c.est_actif === 1 || c.est_actif === true;
            return `
            <tr>
              <td>
                <span style="font-family:var(--police-mono); font-size:0.8rem; color:var(--texte-gris)">
                  #${String(c.id).padStart(3, '0')}
                </span>
              </td>
              <td>
                <div style="font-weight:700;color:var(--texte)">${c.nom}</div>
                <div style="font-size:0.78rem;color:var(--texte-gris)">${c.description || '—'}</div>
              </td>
              <td>
                <div style="font-weight:600">${c.proprio_prenom} ${c.proprio_nom}</div>
              </td>
              <td>
                <div><i class="fas fa-phone" style="font-size:0.7rem; color:var(--texte-gris)"></i> ${c.telephone || '—'}</div>
                <div style="font-size:0.75rem; color:var(--texte-gris); margin-top:2px;">
                  <i class="fas fa-map-marker-alt"></i> ${c.adresse || '—'}
                </div>
              </td>
              <td>${formatDate(c.date_creation)}</td>
              <td style="text-align:center">
                <div class="switch-conteneur ${isActif ? 'switch-actif' : ''}" onclick="toggleStatutCommerce(${c.id}, ${isActif})">
                  <div class="switch"></div>
                  <span class="switch-label ${isActif ? 'actif' : 'inactif'}">
                    ${isActif ? 'Actif' : 'Suspendu'}
                  </span>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── CHARGER LES COMMERCES DEPUIS L'API ──
async function chargerTousCommerces() {
  try {
    const res = await apiFetch('/admin/commerces');
    const data = await res.json();

    if (data.success) {
      listeCommerces = data.commerces || [];
      filtrerEtRechercher(); // Rendu initial
    } else {
      document.getElementById('liste-tous-commerces').innerHTML = `
        <div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur serveur.</div>`;
    }
  } catch (err) {
    document.getElementById('liste-tous-commerces').innerHTML = `
      <div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de réseau.</div>`;
  }
}

// ── FILTRAGE ET RECHERCHE ──
function filtrerEtRechercher() {
  const termeRecherche = document.getElementById('recherche-commerce').value.toLowerCase();
  const filtreStatut = document.getElementById('filtre-statut').value;

  const resultats = listeCommerces.filter(c => {
    // 1. Filtre par texte (nom commerce, nom proprio)
    const texteMatch = 
      (c.nom || '').toLowerCase().includes(termeRecherche) ||
      (c.proprio_nom || '').toLowerCase().includes(termeRecherche) ||
      (c.proprio_prenom || '').toLowerCase().includes(termeRecherche);

    // 2. Filtre par statut
    const isActif = c.est_actif === 1 || c.est_actif === true;
    let statutMatch = true;
    if (filtreStatut === 'actifs') statutMatch = isActif;
    if (filtreStatut === 'inactifs') statutMatch = !isActif;

    return texteMatch && statutMatch;
  });

  rendreTableau(resultats);
}

// ── ÉCOUTEURS D'ÉVÉNEMENTS ──
document.getElementById('recherche-commerce').addEventListener('input', filtrerEtRechercher);
document.getElementById('filtre-statut').addEventListener('change', filtrerEtRechercher);

document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── DÉMARRAGE ──
chargerTousCommerces();
