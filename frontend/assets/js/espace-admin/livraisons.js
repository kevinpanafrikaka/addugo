// ============================================================
// AdduGo — Gestion des Livraisons (Admin)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── INIT UTILISATEUR ──
const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();
document.getElementById('user-avatar').textContent    = initiales;
document.getElementById('user-nom').textContent       = `${user.prenom} ${user.nom}`;
document.getElementById('sidebar-avatar').textContent = initiales;
document.getElementById('sidebar-nom').textContent    = `${user.prenom} ${user.nom}`;

// ── VARIABLES GLOBALES ──
let listeLivraisons = [];

const STATUTS_CONFIG = {
  'assignee': { classe: 'badge-bleu',          label: 'Assignée' },
  'en_cours': { classe: 'badge-orange',        label: 'En cours' },
  'livree':   { classe: 'badge-succes',        label: 'Livrée'   },
  'echouee':  { classe: 'badge-erreur',        label: 'Échouée'  }
};

// ── UTILITAIRES ──
function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('fr-GN', { 
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatPrix(montant) {
  return new Intl.NumberFormat('fr-GN').format(montant) + ' GNF';
}

function badgeStatut(statut) {
  const cfg = STATUTS_CONFIG[statut] || { classe: 'badge-info', label: statut };
  return `<span class="badge ${cfg.classe}">${cfg.label}</span>`;
}

// ── RENDRE LE TABLEAU ──
function rendreTableau(donnees) {
  const conteneur = document.getElementById('liste-toutes-livraisons');

  if (donnees.length === 0) {
    conteneur.innerHTML = `
      <div class="vide">
        <div class="vide-icone"><i class="fas fa-motorcycle"></i></div>
        <p>Aucune livraison trouvée</p>
      </div>`;
    return;
  }

  conteneur.innerHTML = `
    <div class="tableau-conteneur">
      <table class="tableau">
        <thead>
          <tr>
            <th>ID Cmd</th>
            <th>Client</th>
            <th>Livreur</th>
            <th>Commerce</th>
            <th>Adresse</th>
            <th>Statut</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map(l => `
            <tr>
              <td>
                <span style="font-family:var(--police-mono); font-weight:700;">
                  #${String(l.commande_id).padStart(5, '0')}
                </span>
              </td>
              <td>
                <div style="font-weight:600">${l.client_prenom} ${l.client_nom}</div>
                <div style="font-size:0.85rem; color:var(--texte-gris)">${l.client_telephone || ''}</div>
              </td>
              <td>
                <div style="font-weight:600">${l.livreur_prenom} ${l.livreur_nom}</div>
                <div style="font-size:0.85rem; color:var(--texte-gris)">${l.livreur_telephone || ''}</div>
              </td>
              <td>
                <div style="color:var(--texte)">${l.commerce_nom || '—'}</div>
              </td>
              <td>
                <div style="font-size:0.85rem; color:var(--texte-gris);">
                  <i class="fas fa-map-marker-alt"></i> ${l.adresse_livraison || '—'}
                </div>
              </td>
              <td>${badgeStatut(l.statut)}</td>
              <td>
                <div style="font-size:0.85rem;">${formatDate(l.date_assignation)}</div>
              </td>
              <td>
                <select class="form-controle" style="padding: 5px; font-size: 0.85rem; width: 120px;" onchange="changerStatutLivraison(${l.id}, this.value)">
                  <option value="" disabled selected>Modifier...</option>
                  <option value="assignee" ${l.statut === 'assignee' ? 'disabled' : ''}>Assignée</option>
                  <option value="en_cours" ${l.statut === 'en_cours' ? 'disabled' : ''}>En cours</option>
                  <option value="livree" ${l.statut === 'livree' ? 'disabled' : ''}>Livrée</option>
                  <option value="echouee" ${l.statut === 'echouee' ? 'disabled' : ''}>Échouée</option>
                </select>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── CHARGER LES LIVRAISONS DEPUIS L'API ──
async function chargerToutesLivraisons() {
  try {
    const res = await apiFetch('/admin/livraisons');
    const data = await res.json();

    if (data.success) {
      listeLivraisons = data.livraisons || [];
      filtrerEtRechercher(); // Rendu initial
    } else {
      document.getElementById('liste-toutes-livraisons').innerHTML = `
        <div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur serveur.</div>`;
    }
  } catch (err) {
    document.getElementById('liste-toutes-livraisons').innerHTML = `
      <div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de réseau.</div>`;
  }
}

// ── MODIFIER LE STATUT ──
window.changerStatutLivraison = async (id, nouveauStatut) => {
  if (!confirm(`Voulez-vous vraiment passer la livraison à "${nouveauStatut}" ?`)) {
    chargerToutesLivraisons(); // Recharger pour annuler le select
    return;
  }

  try {
    const res = await apiFetch(`/admin/livraisons/${id}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ statut: nouveauStatut })
    });
    
    const data = await res.json();
    
    if (data.success) {
      afficherAlerte('success', 'Statut de la livraison mis à jour avec succès.');
      chargerToutesLivraisons();
    } else {
      afficherAlerte('erreur', data.message || 'Erreur lors de la mise à jour.');
      chargerToutesLivraisons();
    }
  } catch (err) {
    afficherAlerte('erreur', 'Erreur de communication avec le serveur.');
    chargerToutesLivraisons();
  }
};

function afficherAlerte(type, message) {
  const alerteBox = document.getElementById('alerte-action');
  alerteBox.innerHTML = `
    <div class="alerte alerte-${type}">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i> 
      ${message}
    </div>`;
  
  setTimeout(() => {
    alerteBox.innerHTML = '';
  }, 4000);
}

// ── FILTRAGE ET RECHERCHE ──
function filtrerEtRechercher() {
  const termeRecherche = document.getElementById('recherche-livraison').value.toLowerCase();
  const filtreStatut = document.getElementById('filtre-statut').value;

  const resultats = listeLivraisons.filter(l => {
    // 1. Filtre par texte (ID Commande, client, livreur)
    const idStr = String(l.commande_id).padStart(5, '0');
    const nomClient = `${l.client_prenom} ${l.client_nom}`.toLowerCase();
    const nomLivreur = `${l.livreur_prenom} ${l.livreur_nom}`.toLowerCase();
    
    const texteMatch = 
      idStr.includes(termeRecherche) ||
      nomClient.includes(termeRecherche) ||
      nomLivreur.includes(termeRecherche);

    // 2. Filtre par statut
    const statutMatch = filtreStatut === 'tous' || l.statut === filtreStatut;

    return texteMatch && statutMatch;
  });

  rendreTableau(resultats);
}

// ── ÉCOUTEURS D'ÉVÉNEMENTS ──
document.getElementById('recherche-livraison').addEventListener('input', filtrerEtRechercher);
document.getElementById('filtre-statut').addEventListener('change', filtrerEtRechercher);

document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── DÉMARRAGE ──
chargerToutesLivraisons();
