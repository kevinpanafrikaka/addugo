// ============================================================
// AdduGo — Dashboard Admin
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
    day: '2-digit', month: 'short', year: 'numeric'
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

// ── CHARGER COMMERCES ──
async function chargerCommerces() {
  try {
    const res  = await apiFetch('/admin/commerces');
    const data = await res.json();

    document.getElementById('stat-commerces').textContent =
      data.total || 0;

    const liste = document.getElementById('liste-commerces');

    if (!data.success || data.commerces.length === 0) {
      liste.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-store"></i></div>
          <p>Aucun commerce enregistré</p>
        </div>`;
      return;
    }

    liste.innerHTML = `
      <div class="tableau-conteneur">
        <table class="tableau">
          <thead>
            <tr>
              <th>Commerce</th>
              <th>Propriétaire</th>
              <th>Adresse</th>
              <th>Téléphone</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.commerces.map(c => `
              <tr>
                <td>
                  <div style="font-weight:700;color:var(--texte)">${c.nom}</div>
                  <div class="texte-xs gris">${c.description || '—'}</div>
                </td>
                <td>${c.proprio_prenom} ${c.proprio_nom}</td>
                <td>${c.adresse || '—'}</td>
                <td>${c.telephone || '—'}</td>
                <td>
                  <span class="badge ${c.est_actif ? 'badge-succes' : 'badge-erreur'}">
                    ${c.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>${formatDate(c.date_creation)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  } catch (err) {
    document.getElementById('liste-commerces').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── CHARGER PRODUITS ──
async function chargerProduits() {
  try {
    const res  = await apiFetch('/produits');
    const data = await res.json();

    document.getElementById('stat-produits').textContent =
      data.total || 0;

    const liste   = document.getElementById('liste-produits-admin');
    const recents = (data.produits || []).slice(0, 6);

    if (recents.length === 0) {
      liste.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-box"></i></div>
          <p>Aucun produit enregistré</p>
        </div>`;
      return;
    }

    liste.innerHTML = `
      <div class="grille grille-3" style="gap:var(--espace-md)">
        ${recents.map(p => `
          <div class="carte carte-orange">
            <div style="font-weight:700;font-family:var(--police-titre);margin-bottom:4px">
              ${p.nom}
            </div>
            <div class="texte-xs gris mb-sm">${p.commerce_nom}</div>
            <span class="badge badge-bleu">${p.categorie_nom}</span>
            <div class="prix mt-sm">${formatPrix(p.prix)}</div>
            <div class="texte-xs gris mt-sm">Stock : ${p.stock}</div>
          </div>`).join('')}
      </div>`;

  } catch (err) {
    document.getElementById('liste-produits-admin').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── CHARGER STATS UTILISATEURS ──
async function chargerStatsUtilisateurs() {
  try {
    const res  = await apiFetch('/admin/utilisateurs');
    const data = await res.json();
    document.getElementById('stat-utilisateurs').textContent = data.total || 0;
  } catch (err) {
    console.error('Erreur stats:', err);
  }
}

// ── CHARGER COMMANDES ADMIN ──
async function chargerCommandesAdmin() {
  try {
    const res  = await apiFetch('/admin/commandes');
    const data = await res.json();

    const liste    = document.getElementById('liste-commandes-admin');
    const commandes = data.commandes || [];

    document.getElementById('stat-commandes').textContent = commandes.length;

    if (commandes.length === 0) {
      liste.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-shopping-bag"></i></div>
          <p>Aucune commande enregistrée</p>
        </div>`;
      return;
    }

    liste.innerHTML = `
      <div class="tableau-conteneur">
        <table class="tableau">
          <thead>
            <tr>
              <th>#</th>
              <th>Commerce</th>
              <th>Client</th>
              <th>Adresse livraison</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${commandes.map(c => `
              <tr>
                <td class="texte-sm" style="font-family:var(--police-mono)">
                  #${String(c.id).padStart(5, '0')}
                </td>
                <td>${c.commerce_nom}</td>
                <td>${c.client_prenom} ${c.client_nom}</td>
                <td>${c.adresse_livraison}</td>
                <td><span class="prix">${formatPrix(c.montant_total)}</span></td>
                <td>${badgeStatut(c.statut)}</td>
                <td>${formatDate(c.date_creation)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  } catch (err) {
    document.getElementById('liste-commandes-admin').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── DÉCONNEXION ──
document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── INIT ──
chargerStatsUtilisateurs();
chargerCommerces();
chargerProduits();
chargerCommandesAdmin();
