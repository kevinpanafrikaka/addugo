// ============================================================
// AdduGo — Dashboard Commerce
// ============================================================


const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../login.html';

// ── INIT UTILISATEUR ──
// L'initialisation du profil (nom, avatar, menu déroulant) est désormais 
// gérée globalement par navbar.js. On n'a plus besoin de le faire ici.

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

// ── CHARGER MON COMMERCE ──
let monCommerce = null;

async function chargerMonCommerce() {
  try {
    const res  = await apiFetch('/commerces/mes/commerces');
    const data = await res.json();

    if (data.success && data.commerces.length > 0) {
      monCommerce = data.commerces[0];
      document.getElementById('titre-bienvenue').textContent =
        `Salut ${user.prenom}, Bienvenue dans ta boutique ${monCommerce.nom}`;
      localStorage.setItem('addugo_commerce_id', monCommerce.id);

      await chargerCommandes();
      await chargerProduits();
    } else {
      document.getElementById('titre-bienvenue').innerHTML = `
        Vous n'avez pas encore de commerce —
        <a href="#" class="lien-orange" id="creer-commerce" style="font-size: 1rem;">Créer mon commerce</a>`;
      const cmdsList = document.getElementById('liste-commandes-recentes');
      const prodsList = document.getElementById('liste-produits-recents');
      if(cmdsList) cmdsList.innerHTML =
        '<div class="vide"><div class="vide-icone"><i class="fas fa-store" style="margin-right:4px;"></i></div><p>Créez d\'abord votre commerce</p></div>';
      if(prodsList) prodsList.innerHTML =
        '<div class="vide"><div class="vide-icone"><i class="fas fa-box" style="margin-right:4px;"></i></div><p>Aucun produit pour l\'instant</p></div>';
    }
  } catch (err) {
    console.error('Erreur chargerMonCommerce:', err);
  }
}

// ── CHARGER COMMANDES ──
async function chargerCommandes() {
  if (!monCommerce) return;
  try {
    const res  = await apiFetch(`/commandes/commerce/${monCommerce.id}`);
    const data = await res.json();

    if (data.success) {
      const commandes = data.commandes || [];

      document.getElementById('stat-total').textContent =
        commandes.length;
      document.getElementById('stat-attente').textContent =
        commandes.filter(c => c.statut === 'en_attente').length;
      document.getElementById('stat-livrees').textContent =
        commandes.filter(c => c.statut === 'livree').length;

      const recentes = commandes.slice(0, 5);
      const liste    = document.getElementById('liste-commandes-recentes');
      if(!liste) return;

      if (recentes.length === 0) {
        liste.innerHTML = `
          <div class="vide">
            <div class="vide-icone"><i class="fas fa-shopping-cart" style="margin-right:4px;"></i></div>
            <p>Aucune commande reçue pour l'instant</p>
          </div>`;
        return;
      }

      liste.innerHTML = recentes.map(c => `
        <div class="commande-item">
          <div class="commande-info">
            <div class="commande-icone"><i class="fas fa-shopping-cart" style="margin-right:4px;"></i></div>
            <div>
              <div class="commande-nom">${c.client_nom} ${c.client_prenom}</div>
              <div class="commande-date">${formatDate(c.date_creation)}</div>
            </div>
          </div>
          <div class="flex gap-md" style="align-items:center">
            ${badgeStatut(c.statut)}
            <span class="commande-montant">${formatPrix(c.montant_total)}</span>
            <button class="btn btn-contour-orange btn-sm"
              onclick="changerStatut(${c.id}, '${c.statut}')">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>`).join('');
    }
  } catch (err) {
    console.error('Erreur chargerCommandes:', err);
  }
}

// ── CHARGER PRODUITS ──
async function chargerProduits() {
  if (!monCommerce) return;
  try {
    const res  = await apiFetch(`/produits?commerce_id=${monCommerce.id}`);
    const data = await res.json();

    if (data.success) {
      const produits = data.produits || [];
      document.getElementById('stat-produits').textContent = produits.length;

      const recents = produits.slice(0, 5);
      const liste   = document.getElementById('liste-produits-recents');
      if(!liste) return;
      
      if (recents.length === 0) {
        liste.innerHTML = `
          <div class="vide">
            <div class="vide-icone"><i class="fas fa-box" style="margin-right:4px;"></i></div>
            <p>Aucun produit ajouté</p>
            <a href="produits.html" class="btn btn-orange mt-md">
              Ajouter mon premier produit
            </a>
          </div>`;
        return;
      }

      liste.innerHTML = `
        <div class="grille grille-4" style="gap:var(--espace-md)">
          ${recents.map(p => `
            <div class="carte">
              <div style="font-size:2rem;margin-bottom:8px"><i class="fas fa-box" style="margin-right:4px;"></i></div>
              <div style="font-weight:700;font-family:var(--police-titre);margin-bottom:4px">
                ${p.nom}
              </div>
              <div class="prix">${formatPrix(p.prix)}</div>
              <div class="texte-xs gris mt-sm">Stock : ${p.stock}</div>
              <span class="badge ${p.est_disponible ? 'badge-succes' : 'badge-erreur'} mt-sm">
                ${p.est_disponible ? 'Disponible' : 'Indisponible'}
              </span>
            </div>`).join('')}
        </div>`;
    }
  } catch (err) {
    console.error('Erreur chargerProduits:', err);
  }
}

// ── CHANGER STATUT COMMANDE ──
async function changerStatut(commandeId, statutActuel) {
  const statuts = [
    'en_attente', 'confirmee', 'en_preparation',
    'prete', 'en_livraison', 'livree', 'annulee'
  ];
  const indexActuel = statuts.indexOf(statutActuel);
  const prochains   = statuts.slice(indexActuel + 1);

  if (prochains.length === 0) {
    alert('Cette commande est déjà au statut final.');
    return;
  }

  const choix = prompt(
    `Changer le statut de la commande #${commandeId}\n` +
    `Statut actuel : ${statutActuel}\n\n` +
    `Choisissez un nouveau statut :\n` +
    prochains.map((s, i) => `${i + 1}. ${s}`).join('\n')
  );

  if (!choix) return;
  const index    = parseInt(choix) - 1;
  const nouveau  = prochains[index];
  if (!nouveau)  return;

  try {
    const res  = await apiFetch(`/commandes/${commandeId}/statut`, {
      method: 'PUT',
      body: JSON.stringify({ statut: nouveau })
    });
    const data = await res.json();
    if (data.success) await chargerCommandes();
  } catch (err) {
    console.error('Erreur changerStatut:', err);
  }
}

// ── DÉCONNEXION ──
// Gérée par navbar.js sur le nouveau bouton btn-logout.

// ── INIT ──
chargerMonCommerce();
