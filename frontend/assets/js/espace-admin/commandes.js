// ============================================================
// AdduGo — Gestion des Commandes (Admin)
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
let listeCommandes = [];

const STATUTS_CONFIG = {
  'en_attente':     { classe: 'badge-avertissement', label: 'En attente'     },
  'confirmee':      { classe: 'badge-info',          label: 'Confirmée'      },
  'en_preparation': { classe: 'badge-bleu',          label: 'En préparation' },
  'prete':          { classe: 'badge-succes',        label: 'Prête'          },
  'en_livraison':   { classe: 'badge-orange',        label: 'En livraison'   },
  'livree':         { classe: 'badge-succes',        label: 'Livrée'         },
  'annulee':        { classe: 'badge-erreur',        label: 'Annulée'        }
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
  const conteneur = document.getElementById('liste-toutes-commandes');

  if (donnees.length === 0) {
    conteneur.innerHTML = `
      <div class="vide">
        <div class="vide-icone"><i class="fas fa-shopping-bag"></i></div>
        <p>Aucune commande trouvée</p>
      </div>`;
    return;
  }

  conteneur.innerHTML = `
    <div class="tableau-conteneur">
      <table class="tableau">
        <thead>
          <tr>
            <th>ID Commande</th>
            <th>Commerce</th>
            <th>Client</th>
            <th>Adresse livraison</th>
            <th>Montant</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${donnees.map(c => `
            <tr>
              <td>
                <span style="font-family:var(--police-mono); font-weight:700;">
                  #${String(c.id).padStart(5, '0')}
                </span>
              </td>
              <td>
                <div style="font-weight:600;color:var(--texte)">${c.commerce_nom || '—'}</div>
              </td>
              <td>
                <div style="font-weight:600">${c.client_prenom} ${c.client_nom}</div>
              </td>
              <td>
                <div style="font-size:0.85rem; color:var(--texte-gris);">
                  <i class="fas fa-map-marker-alt"></i> ${c.adresse_livraison || '—'}
                </div>
              </td>
              <td><span class="prix">${formatPrix(c.montant_total)}</span></td>
              <td>${badgeStatut(c.statut)}</td>
              <td>
                <div style="font-size:0.85rem;">${formatDate(c.date_creation)}</div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── CHARGER LES COMMANDES DEPUIS L'API ──
async function chargerToutesCommandes() {
  try {
    const res = await apiFetch('/admin/commandes');
    const data = await res.json();

    if (data.success) {
      listeCommandes = data.commandes || [];
      filtrerEtRechercher(); // Rendu initial
    } else {
      document.getElementById('liste-toutes-commandes').innerHTML = `
        <div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur serveur.</div>`;
    }
  } catch (err) {
    document.getElementById('liste-toutes-commandes').innerHTML = `
      <div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de réseau.</div>`;
  }
}

// ── FILTRAGE ET RECHERCHE ──
function filtrerEtRechercher() {
  const termeRecherche = document.getElementById('recherche-commande').value.toLowerCase();
  const filtreStatut = document.getElementById('filtre-statut').value;

  const resultats = listeCommandes.filter(c => {
    // 1. Filtre par texte (ID, client, commerce)
    const idStr = String(c.id).padStart(5, '0');
    const nomClient = `${c.client_prenom} ${c.client_nom}`.toLowerCase();
    
    const texteMatch = 
      idStr.includes(termeRecherche) ||
      (c.commerce_nom || '').toLowerCase().includes(termeRecherche) ||
      nomClient.includes(termeRecherche);

    // 2. Filtre par statut
    const statutMatch = filtreStatut === 'tous' || c.statut === filtreStatut;

    return texteMatch && statutMatch;
  });

  rendreTableau(resultats);
}

// ── ÉCOUTEURS D'ÉVÉNEMENTS ──
document.getElementById('recherche-commande').addEventListener('input', filtrerEtRechercher);
document.getElementById('filtre-statut').addEventListener('change', filtrerEtRechercher);

document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── DÉMARRAGE ──
chargerToutesCommandes();
