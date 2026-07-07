// ============================================================
// AdduGo — Gestion des Utilisateurs (Admin)
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

// ── VARIABLES GLOBALES ──
let listeUtilisateurs = [];

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

function badgeRole(roles) {
  if (!roles || roles.length === 0) return '<span class="badge badge-info">Client</span>';
  return roles.map(r => {
    let classe = 'badge-info';
    if (r === 'admin') classe = 'badge-erreur';
    if (r === 'commerce') classe = 'badge-orange';
    if (r === 'livreur') classe = 'badge-bleu';
    return `<span class="badge ${classe}" style="margin-right:4px; margin-bottom:4px; display:inline-block;">
      ${r.charAt(0).toUpperCase() + r.slice(1)}
    </span>`;
  }).join('');
}

// ── CHANGER LE STATUT D'UN UTILISATEUR ──
async function toggleStatutUtilisateur(userId, estActifActuel) {
  // Sécurité: Empêcher l'admin de se bloquer lui-même
  if (userId === Number(user.id)) {
    afficherAlerte("Vous ne pouvez pas bloquer votre propre compte admin !", 'erreur');
    return;
  }

  const nouveauStatut = !estActifActuel; // Inversion du statut

  try {
    const res = await apiFetch(`/admin/utilisateurs/${userId}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ est_actif: nouveauStatut })
    });

    const data = await res.json();

    if (data.success) {
      afficherAlerte(`Compte utilisateur ${nouveauStatut ? 'activé' : 'bloqué'} avec succès !`, 'succes');
      // Mettre à jour la variable globale et re-rendre
      const userIndex = listeUtilisateurs.findIndex(u => u.id === userId);
      if (userIndex > -1) {
        listeUtilisateurs[userIndex].est_actif = nouveauStatut;
        rendreTableau(listeUtilisateurs);
      }
    } else {
      afficherAlerte(data.message || 'Erreur lors du changement de statut.', 'erreur');
    }
  } catch (err) {
    console.error('Erreur toggleStatutUtilisateur:', err);
    afficherAlerte('Erreur réseau.', 'erreur');
  }
}

// ── RENDRE LE TABLEAU ──
function rendreTableau(donnees) {
  const conteneur = document.getElementById('liste-tous-utilisateurs');

  if (donnees.length === 0) {
    conteneur.innerHTML = `
      <div class="vide">
        <div class="vide-icone"><i class="fas fa-users"></i></div>
        <p>Aucun utilisateur trouvé</p>
      </div>`;
    return;
  }

  conteneur.innerHTML = `
    <div class="tableau-conteneur">
      <table class="tableau">
        <thead>
          <tr>
            <th>ID</th>
            <th>Utilisateur</th>
            <th>Contact</th>
            <th>Rôles</th>
            <th>Inscription</th>
            <th style="text-align:center">Statut (Bloquer/Débloquer)</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map(u => {
            const isActif = u.est_actif === 1 || u.est_actif === true;
            return `
            <tr>
              <td>
                <span style="font-family:var(--police-mono); font-size:0.8rem; color:var(--texte-gris)">
                  #${String(u.id).padStart(4, '0')}
                </span>
              </td>
              <td>
                <div style="font-weight:700;color:var(--texte)">${u.prenom} ${u.nom}</div>
              </td>
              <td>
                <div style="font-size:0.85rem;"><i class="fas fa-envelope" style="color:var(--texte-gris)"></i> ${u.email}</div>
                <div style="font-size:0.85rem; margin-top:2px;"><i class="fas fa-phone" style="color:var(--texte-gris)"></i> ${u.telephone || '—'}</div>
              </td>
              <td>
                <div style="display:flex; flex-wrap:wrap; max-width: 150px;">
                  ${badgeRole(u.roles)}
                </div>
              </td>
              <td>${formatDate(u.date_creation)}</td>
              <td style="text-align:center">
                <div class="switch-conteneur ${isActif ? 'switch-actif' : ''}" onclick="toggleStatutUtilisateur(${u.id}, ${isActif})">
                  <div class="switch"></div>
                  <span class="switch-label ${isActif ? 'actif' : 'inactif'}">
                    ${isActif ? 'Actif' : 'Bloqué'}
                  </span>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── CHARGER LES UTILISATEURS DEPUIS L'API ──
async function chargerTousUtilisateurs() {
  try {
    const res = await apiFetch('/admin/utilisateurs');
    const data = await res.json();

    if (data.success) {
      listeUtilisateurs = data.utilisateurs || [];
      filtrerEtRechercher(); // Rendu initial
    } else {
      document.getElementById('liste-tous-utilisateurs').innerHTML = `
        <div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur serveur.</div>`;
    }
  } catch (err) {
    document.getElementById('liste-tous-utilisateurs').innerHTML = `
      <div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de réseau.</div>`;
  }
}

// ── FILTRAGE ET RECHERCHE ──
function filtrerEtRechercher() {
  const termeRecherche = document.getElementById('recherche-utilisateur').value.toLowerCase();
  const filtreRole = document.getElementById('filtre-role').value;
  const filtreStatut = document.getElementById('filtre-statut').value;

  const resultats = listeUtilisateurs.filter(u => {
    // 1. Filtre par texte (nom, email)
    const texteMatch = 
      (u.nom || '').toLowerCase().includes(termeRecherche) ||
      (u.prenom || '').toLowerCase().includes(termeRecherche) ||
      (u.email || '').toLowerCase().includes(termeRecherche);

    // 2. Filtre par rôle
    let roleMatch = true;
    if (filtreRole !== 'tous') {
      const rolesStr = (u.roles || []).join(',');
      roleMatch = rolesStr.includes(filtreRole) || (filtreRole === 'client' && rolesStr === '');
    }

    // 3. Filtre par statut
    const isActif = u.est_actif === 1 || u.est_actif === true;
    let statutMatch = true;
    if (filtreStatut === 'actifs') statutMatch = isActif;
    if (filtreStatut === 'inactifs') statutMatch = !isActif;

    return texteMatch && roleMatch && statutMatch;
  });

  rendreTableau(resultats);
}

// ── ÉCOUTEURS D'ÉVÉNEMENTS ──
document.getElementById('recherche-utilisateur').addEventListener('input', filtrerEtRechercher);
document.getElementById('filtre-role').addEventListener('change', filtrerEtRechercher);
document.getElementById('filtre-statut').addEventListener('change', filtrerEtRechercher);

document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── DÉMARRAGE ──
chargerTousUtilisateurs();
