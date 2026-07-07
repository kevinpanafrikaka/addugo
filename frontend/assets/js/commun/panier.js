// ============================================================
// GESTION DU PANIER (LOCALSTORAGE & UI)
// ============================================================

const PANIER_STORAGE_KEY = 'addugo_panier';

// Fonction globale utilitaire pour apiFetch si elle n'est pas dispo
const fetchApi = typeof apiFetch !== 'undefined' ? apiFetch : async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const API_URL = typeof API !== 'undefined' ? API.URL : 'https://addugo.up.railway.app/api';
  return fetch(`${API_URL}${url}`, { ...options, headers });
};

// ── LECTURE / ÉCRITURE ──
function getPanier() {
  const data = localStorage.getItem(PANIER_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function savePanier(panier) {
  localStorage.setItem(PANIER_STORAGE_KEY, JSON.stringify(panier));
  renderPanierSidebar();
  updatePanierBadgeGlobal(); 
}

// ── OPERATIONS SUR LE PANIER ──
window.ajouterAuPanier = function(produitId, nom, prix, image, commerceId, nomBoutique) {
  const panier = getPanier();
  const existingItem = panier.find(item => item.produit_id === produitId);

  if (existingItem) {
    existingItem.quantite += 1;
  } else {
    panier.push({
      produit_id: produitId,
      nom: nom,
      prix: Number(prix),
      image: image,
      quantite: 1,
      commerce_id: commerceId,
      nom_boutique: nomBoutique
    });
  }

  savePanier(panier);

  // Alerte toast
  const toast = document.createElement('div');
  toast.textContent = `🛒 "${nom}" a été ajouté à votre panier !`;
  toast.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    background: #10B981; color: white; padding: 12px 24px; border-radius: 30px;
    font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999;
    transition: opacity 0.3s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
  
  // Ouvrir le tiroir panier
  if (typeof window.ouvrirPanier === 'function') {
    window.ouvrirPanier();
  } else {
    const sidebar = document.getElementById('panier-sidebar');
    const overlay = document.getElementById('panier-overlay');
    if(sidebar && overlay) {
      sidebar.classList.add('ouvert');
      overlay.classList.add('ouvert');
    }
  }
};

window.modifierQuantitePanier = function(produitId, delta) {
  let panier = getPanier();
  const item = panier.find(i => i.produit_id === produitId);
  
  if (item) {
    item.quantite += delta;
    if (item.quantite <= 0) {
      panier = panier.filter(i => i.produit_id !== produitId);
    }
    savePanier(panier);
  }
};

window.supprimerDuPanier = function(produitId) {
  let panier = getPanier();
  panier = panier.filter(i => i.produit_id !== produitId);
  savePanier(panier);
};

// ── INTERFACE UTILISATEUR (SIDEBAR) ──
function renderPanierSidebar() {
  const panierBody = document.querySelector('#panier-sidebar .panier-body');
  const panierTitreBadge = document.querySelector('#panier-sidebar .panier-badge-titre');
  if (!panierBody) return;

  const panier = getPanier();
  let totalArticles = 0;
  panier.forEach(i => totalArticles += i.quantite);

  if (panierTitreBadge) {
    panierTitreBadge.textContent = `${totalArticles} article${totalArticles > 1 ? 's' : ''}`;
  }

  if (panier.length === 0) {
    panierBody.innerHTML = `
      <div style="text-align: center; padding: 50px 20px; color: var(--texte-gris);">
        <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 15px; color: #ddd;"></i>
        <p style="font-weight: bold;">Votre panier est vide</p>
      </div>
    `;
    return;
  }

  // Grouper les articles par commerce
  const parCommerce = {};
  panier.forEach(item => {
    if (!parCommerce[item.commerce_id]) {
      parCommerce[item.commerce_id] = {
        nom_boutique: item.nom_boutique,
        articles: [],
        total: 0
      };
    }
    parCommerce[item.commerce_id].articles.push(item);
    parCommerce[item.commerce_id].total += (item.prix * item.quantite);
  });

  let html = '';

  for (const commerceId in parCommerce) {
    const boutique = parCommerce[commerceId];
    
    html += `
      <div style="background: var(--fond-tres-clair); border: 1px solid var(--bordure); border-radius: 12px; margin-bottom: 20px; padding: 15px;">
        <h4 style="margin: 0 0 12px 0; font-family: var(--police-titre); color: var(--texte); display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-store" style="color: var(--orange);"></i> ${boutique.nom_boutique}
        </h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;

    boutique.articles.forEach(item => {
      html += `
        <div style="display: flex; gap: 12px; background: white; padding: 10px; border-radius: 8px; border: 1px solid #eee;">
          <img src="${item.image}" alt="${item.nom}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" onerror="this.src='../../images/AdduGo_Logo.png'">
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nom}</div>
            <div style="font-size: 0.85rem; color: var(--orange); font-weight: bold; margin-top: 4px;">${item.prix.toLocaleString('fr-FR')} GNF</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              
              <div style="display: flex; align-items: center; background: #f5f5f5; border-radius: 6px; padding: 2px;">
                <button onclick="modifierQuantitePanier(${item.produit_id}, -1)" style="width: 26px; height: 26px; border: none; background: white; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fas fa-minus" style="font-size: 0.7rem;"></i></button>
                <span style="font-weight: bold; font-size: 0.9rem; width: 30px; text-align: center;">${item.quantite}</span>
                <button onclick="modifierQuantitePanier(${item.produit_id}, 1)" style="width: 26px; height: 26px; border: none; background: white; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fas fa-plus" style="font-size: 0.7rem;"></i></button>
              </div>

              <button onclick="supprimerDuPanier(${item.produit_id})" style="border: none; background: none; color: #ef4444; cursor: pointer; padding: 5px;">
                <i class="fas fa-trash-alt"></i>
              </button>

            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
        <div style="margin-top: 15px; border-top: 1px dashed var(--bordure); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: var(--texte-gris);">Sous-total:</span>
          <span style="font-weight: 800; font-size: 1.1rem; color: var(--texte);">${boutique.total.toLocaleString('fr-FR')} GNF</span>
        </div>
        <button onclick="validerCommandeBoutique(${commerceId}, '${boutique.nom_boutique.replace(/'/g, "\\'")}')" style="width: 100%; margin-top: 12px; padding: 12px; background: #1A1A2E; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
          Valider ma commande
        </button>
      </div>
    `;
  }

  panierBody.innerHTML = html;
}

// ── VALIDATION DE COMMANDE ──
window.validerCommandeBoutique = async function(commerceId, nomBoutique) {
  const panier = getPanier();
  const articlesBoutique = panier.filter(i => String(i.commerce_id) === String(commerceId));
  
  if (articlesBoutique.length === 0) return;

  const userStr = localStorage.getItem('addugo_user');
  if (!userStr) {
    alert("Vous devez être connecté pour passer une commande.");
    window.location.href = '../accueil/login.html';
    return;
  }
  const user = JSON.parse(userStr);

  // Demander l'adresse
  const adresseSaisie = prompt(`Entrez votre adresse de livraison pour votre commande chez ${nomBoutique} :\n(Ex: Kaloum, Conakry)`, user.adresse || "");
  
  if (!adresseSaisie || adresseSaisie.trim() === "") {
    return; // Annulé par l'utilisateur
  }

  try {
    const articlesToSend = articlesBoutique.map(a => ({
      produit_id: a.produit_id,
      quantite: a.quantite
    }));

    const res = await fetchApi('/commandes', {
      method: 'POST',
      body: JSON.stringify({
        commerce_id: commerceId,
        adresse_livraison: adresseSaisie.trim(),
        articles: articlesToSend
      })
    });

    const data = await res.json();

    if (data.success) {
      alert(`Commande validée avec succès chez ${nomBoutique} !`);
      
      // Enlever ces articles du panier
      const nouveauPanier = panier.filter(i => String(i.commerce_id) !== String(commerceId));
      savePanier(nouveauPanier);
      
      // Fermer le tiroir
      const sidebar = document.getElementById('panier-sidebar');
      const overlay = document.getElementById('panier-overlay');
      if (sidebar) sidebar.classList.remove('ouvert');
      if (overlay) overlay.classList.remove('ouvert');

    } else {
      alert("Erreur lors de la validation : " + (data.message || "inconnue"));
    }

  } catch (error) {
    console.error('Erreur valider commande:', error);
    alert("Erreur de connexion. Veuillez réessayer.");
  }
};

// ── BADGE GLOBAL DU PANIER ──
window.updatePanierBadgeGlobal = function() {
  const panier = getPanier();
  let totalArticles = 0;
  panier.forEach(i => totalArticles += i.quantite);

  const badgeIcon = document.getElementById('badge-panier-home');
  if (badgeIcon) {
    if (totalArticles > 0) {
      badgeIcon.textContent = totalArticles;
      badgeIcon.style.display = 'flex';
      badgeIcon.style.alignItems = 'center';
      badgeIcon.style.justifyContent = 'center';
    } else {
      badgeIcon.style.display = 'none';
    }
  }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  renderPanierSidebar();
  updatePanierBadgeGlobal();
});
