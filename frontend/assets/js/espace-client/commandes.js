// ============================================================
// AdduGo — Mes Commandes Client (commandes-client.js)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

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
    'en_attente':     { classe: 'statut-attente',    texte: '<i class="fas fa-hourglass-half"></i> En attente' },
    'confirmee':      { classe: 'statut-attente',    texte: '<i class="fas fa-check-circle"></i> Confirmée'   },
    'en_preparation': { classe: 'statut-livraison',  texte: '<i class="fas fa-wrench"></i> En préparation' },
    'prete':          { classe: 'statut-livraison',  texte: '<i class="fas fa-box"></i> Prête'          },
    'en_livraison':   { classe: 'statut-livraison',  texte: '<i class="fas fa-motorcycle"></i> En livraison' },
    'livree':         { classe: 'statut-livree',     texte: '<i class="fas fa-check-circle"></i> Livrée'     },
    'annulee':        { classe: 'statut-annulee',    texte: '<i class="fas fa-times-circle"></i> Annulée'    }
  };
  const c = config[statut] || { classe: 'statut-attente', texte: statut };
  return `<span class="badge-statut ${c.classe}">${c.texte}</span>`;
}

// ── CHARGER COMMANDES ──
let toutesCommandes = [];
let filtreActif = 'tous';

async function chargerCommandes() {
  try {
    const res  = await apiFetch('/commandes/mes-commandes');
    const data = await res.json();

    if (data.success) {
      toutesCommandes = data.commandes || [];
      afficherCommandes();
    }
  } catch (err) {
    const el = document.getElementById('liste-commandes');
    if (el) {
      el.innerHTML = '<div class="alerte alerte-erreur" style="grid-column:1/-1;"><i class="fas fa-times-circle"></i> Erreur lors du chargement des commandes.</div>';
    }
  }
}

function afficherCommandes() {
  const liste = document.getElementById('liste-commandes');
  if (!liste) return;

  let commandes = toutesCommandes;

  if (filtreActif !== 'tous') {
    commandes = commandes.filter(c => c.statut === filtreActif);
  }

  if (commandes.length === 0) {
    liste.innerHTML = `
      <div class="commande-vide" style="grid-column: 1/-1;">
        <i class="fas fa-shopping-bag"></i>
        <p style="font-weight:700; color:var(--texte); font-size:1.05rem;">Aucune commande trouvée</p>
        <p style="font-size:0.85rem; color:var(--texte-gris); margin-top:4px;">Vous n'avez pas encore passé de commande dans cette catégorie.</p>
      </div>`;
    return;
  }

  liste.innerHTML = commandes.map(c => {
    const logoUrl = c.commerce_logo 
      ? (c.commerce_logo.startsWith('http') ? c.commerce_logo : `https://addugo.up.railway.app${c.commerce_logo}`)
      : null;
    return `
    <div class="commande-carte">
      <div class="commande-carte-entete">
        <div>
          <div class="commande-carte-commerce" style="display:flex; align-items:center; gap:8px;">
            ${logoUrl 
              ? `<img src="${logoUrl}" alt="${c.commerce_nom}" style="width:24px; height:24px; border-radius:6px; object-fit:cover; border:1px solid var(--bordure);">`
              : `<i class="fas fa-store" style="color:var(--orange);"></i>`
            }
            ${c.commerce_nom || 'Boutique AdduGo'}
          </div>
          <div class="commande-carte-id">Commande #${String(c.id).padStart(5, '0')}</div>
        </div>
        ${badgeStatut(c.statut)}
      </div>
      <div class="commande-carte-corps">
        <div class="commande-carte-infos">
          <div class="commande-carte-info">
            <i class="fas fa-calendar-alt"></i>
            ${formatDate(c.date_creation)}
          </div>
          <div class="commande-carte-info">
            <i class="fas fa-map-marker-alt"></i>
            ${c.adresse_livraison || 'Adresse non spécifiée'}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--texte-gris); font-weight: 700; text-transform: uppercase;">Total TTC</div>
          <div class="commande-carte-montant">${formatPrix(c.montant_total)}</div>
        </div>
      </div>
      <div class="commande-carte-actions">
        ${c.statut === 'en_livraison' ? `
          <a href="suivi.html?id=${c.id}" class="btn btn-orange btn-sm" style="border-radius:10px; text-decoration:none; font-weight:700;">
            <i class="fas fa-motorcycle"></i> Suivre ma livraison
          </a>` : ''}
        ${c.statut === 'en_attente' ? `
          <button class="btn btn-sm" style="border-radius:10px; background:rgba(239,68,68,0.1); color:#EF4444; border:1px solid rgba(239,68,68,0.2); font-weight:700;" onclick="annulerCommande(${c.id})">
            <i class="fas fa-times"></i> Annuler la commande
          </button>` : ''}
        <button class="btn btn-contour-orange btn-sm" style="border-radius:10px; font-weight:700;" onclick="voirDetails(${c.id})">
          <i class="fas fa-eye"></i> Détails
        </button>
      </div>
    </div>`).join('');
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

// ── MODAL NOUVELLE COMMANDE ──
const modal          = document.getElementById('modal-commande');
const btnNouvelle    = document.getElementById('btn-nouvelle-commande');
const btnFermer      = document.getElementById('modal-fermer');
const btnAnnuler     = document.getElementById('btn-annuler-modal');
const selectCommerce = document.getElementById('select-commerce');

let articlesSelectionnes = {};
let produitsDisponibles  = [];

btnNouvelle?.addEventListener('click', async () => {
  if (modal) modal.style.display = 'block';
  await chargerCommerces();
});

btnFermer?.addEventListener('click',  () => { if (modal) modal.style.display = 'none'; });
btnAnnuler?.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

async function chargerCommerces() {
  if (!selectCommerce) return;
  const res  = await apiFetch('/commerces');
  const data = await res.json();

  if (data.success) {
    selectCommerce.innerHTML = '<option value="">-- Sélectionner une boutique --</option>';
    data.commerces.forEach(c => {
      selectCommerce.innerHTML += `<option value="${c.id}">${c.nom}</option>`;
    });
  }
}

selectCommerce?.addEventListener('change', async () => {
  const commerceId = selectCommerce.value;
  if (!commerceId) return;

  articlesSelectionnes = {};
  mettreAJourResume();

  const res  = await apiFetch(`/produits?commerce_id=${commerceId}`);
  const data = await res.json();

  produitsDisponibles = data.produits || [];
  const liste = document.getElementById('liste-produits-modal');
  if (!liste) return;

  if (produitsDisponibles.length === 0) {
    liste.innerHTML = '<p class="texte-gris texte-sm" style="margin:0;">Aucun produit disponible dans cette boutique.</p>';
    return;
  }

  liste.innerHTML = produitsDisponibles.map(p => `
    <div class="produit-modal-item" id="produit-${p.id}" style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--bordure);">
      <div>
        <div style="font-weight:700; font-size:0.9rem;">${p.nom}</div>
        <div style="color:var(--orange); font-weight:800; font-size:0.85rem;">${formatPrix(p.prix)}</div>
      </div>
      <div class="quantite-ctrl" style="display:flex; align-items:center; gap:8px;">
        <button class="btn btn-sm" style="padding:4px 10px; border-radius:6px; background:var(--blanc); border:1px solid var(--bordure);" onclick="changerQuantite(${p.id}, -1, ${p.prix})">−</button>
        <span class="quantite-val" id="qte-${p.id}" style="font-weight:800; min-width:20px; text-align:center;">0</span>
        <button class="btn btn-sm" style="padding:4px 10px; border-radius:6px; background:var(--orange); color:#fff; border:none;" onclick="changerQuantite(${p.id}, 1, ${p.prix})">+</button>
      </div>
    </div>`).join('');
});

window.changerQuantite = (produitId, delta, prix) => {
  const qteEl = document.getElementById(`qte-${produitId}`);
  if (!qteEl) return;
  let qte = parseInt(qteEl.textContent) + delta;
  if (qte < 0) qte = 0;
  qteEl.textContent = qte;

  if (qte === 0) {
    delete articlesSelectionnes[produitId];
  } else {
    articlesSelectionnes[produitId] = { produit_id: produitId, quantite: qte, prix };
  }
  mettreAJourResume();
};

function mettreAJourResume() {
  const articles = Object.values(articlesSelectionnes);
  const total    = articles.reduce((sum, a) => sum + (a.prix * a.quantite), 0);

  const totalEl = document.getElementById('total-commande');
  if (totalEl) totalEl.textContent = formatPrix(total);
  
  const conteneur = document.getElementById('articles-selectionnes');
  if (conteneur) {
    conteneur.innerHTML = articles.map(a => {
      const p = produitsDisponibles.find(p => p.id === a.produit_id);
      return `<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span>${p?.nom || 'Produit'} × ${a.quantite}</span>
        <span style="font-weight:700;">${formatPrix(a.prix * a.quantite)}</span>
      </div>`;
    }).join('');
  }
}

// ── CONFIRMER COMMANDE ──
document.getElementById('btn-confirmer-commande')?.addEventListener('click', async () => {
  const commerceId      = selectCommerce?.value;
  const adresse         = document.getElementById('adresse-livraison')?.value.trim();
  const articles        = Object.values(articlesSelectionnes);

  if (!commerceId) {
    alert("Veuillez sélectionner une boutique.");
    return;
  }
  if (articles.length === 0) {
    alert("Veuillez ajouter au moins un produit à votre panier.");
    return;
  }
  if (!adresse) {
    alert("Veuillez saisir votre adresse de livraison.");
    return;
  }

  try {
    const res  = await apiFetch('/commandes', {
      method: 'POST',
      body: JSON.stringify({
        commerce_id: Number(commerceId),
        adresse_livraison: adresse,
        articles: articles.map(a => ({
          produit_id: a.produit_id,
          quantite: a.quantite
        }))
      })
    });
    const data = await res.json();

    if (data.success) {
      alert("Votre commande a été passée avec succès !");
      if (modal) modal.style.display = 'none';
      await chargerCommerces();
      await chargerCommandes();
    } else {
      alert(data.message || "Erreur lors de la commande.");
    }
  } catch (err) {
    alert("Erreur réseau.");
  }
});

// ── ANNULER COMMANDE ──
window.annulerCommande = async (id) => {
  if (!confirm('Voulez-vous vraiment annuler cette commande ?')) return;

  const res  = await apiFetch(`/commandes/${id}/statut`, {
    method: 'PUT',
    body: JSON.stringify({ statut: 'annulee', commentaire: 'Annulée par le client' })
  });
  const data = await res.json();
  if (data.success) await chargerCommandes();
};

// ── VOIR DÉTAILS ──
window.voirDetails = (id) => {
  window.location.href = `suivi.html?id=${id}`;
};

// ── INIT ──
chargerCommandes();
