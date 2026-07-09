document.addEventListener('DOMContentLoaded', () => {
  renderPanierPage();
});

function renderPanierPage() {
  const panierBody = document.getElementById('panier-page-body');
  const panierBadge = document.getElementById('panier-page-badge');
  if (!panierBody) return;

  const panier = getPanier(); // Provided by panier.js
  let totalArticles = 0;
  panier.forEach(i => totalArticles += i.quantite);

  if (panierBadge) {
    panierBadge.textContent = `${totalArticles} article${totalArticles > 1 ? 's' : ''}`;
  }

  if (panier.length === 0) {
    panierBody.innerHTML = `
      <div style="text-align: center; padding: 100px 20px; color: var(--texte-gris); background: var(--blanc); border-radius: var(--rayon-lg); box-shadow: var(--ombre-sm); border: 1px solid var(--bordure);">
        <div style="width: 100px; height: 100px; background: var(--fond-tres-clair); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px auto;">
          <i class="fas fa-shopping-basket" style="font-size: 3.5rem; color: #cbd5e1;"></i>
        </div>
        <h3 style="font-family: var(--police-titre); font-size: 1.5rem; font-weight: 700; margin: 0 0 10px 0; color: var(--texte);">Votre panier est tristement vide</h3>
        <p style="margin: 0 0 30px 0; font-size: 1.05rem;">Découvrez nos produits et trouvez votre bonheur !</p>
        <button class="btn btn-orange" style="padding: 14px 32px; border-radius: var(--rayon-md); font-weight: 700; font-size: 1.1rem; cursor: pointer; border: none; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.2);" onclick="window.location.href='home.html'">
          <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Retour au shopping
        </button>
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
      <div style="background: white; border-radius: 12px; margin-bottom: 25px; padding: 20px; box-shadow: var(--ombre-sm);">
        <h3 style="margin: 0 0 20px 0; font-family: var(--police-titre); color: var(--texte); display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--bordure); padding-bottom: 12px;">
          <i class="fas fa-store" style="color: var(--orange); font-size: 1.2rem;"></i> ${boutique.nom_boutique}
        </h3>
        <div style="display: flex; flex-direction: column; gap: 16px;">
    `;

    boutique.articles.forEach(item => {
      html += `
        <div style="display: flex; gap: 15px; align-items: center; padding: 10px 0; border-bottom: 1px dashed #eee;">
          <img src="${item.image}" alt="${item.nom}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);" onerror="this.src='../../images/AdduGo_Logo.png'">
          
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 1.05rem; font-weight: 600; margin-bottom: 5px;">${item.nom}</div>
            <div style="font-size: 1.1rem; color: var(--orange); font-weight: bold;">${item.prix.toLocaleString('fr-FR')} GNF</div>
          </div>
          
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
            <div style="display: flex; align-items: center; background: #f5f5f5; border-radius: 8px; padding: 4px;">
              <button onclick="modifierQuantitePage(${item.produit_id}, -1)" style="width: 30px; height: 30px; border: none; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><i class="fas fa-minus" style="font-size: 0.8rem;"></i></button>
              <span style="font-weight: bold; font-size: 1rem; width: 40px; text-align: center;">${item.quantite}</span>
              <button onclick="modifierQuantitePage(${item.produit_id}, 1)" style="width: 30px; height: 30px; border: none; background: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><i class="fas fa-plus" style="font-size: 0.8rem;"></i></button>
            </div>
            
            <button onclick="supprimerDuPanierPage(${item.produit_id})" style="border: none; background: none; color: #ef4444; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px;">
              <i class="fas fa-trash-alt"></i> Supprimer
            </button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
        
        <div style="margin-top: 20px; background: var(--fond-tres-clair); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: var(--texte-gris); font-size: 1.1rem;">Sous-total de la boutique</span>
          <span style="font-weight: 800; font-size: 1.4rem; color: var(--texte);">${boutique.total.toLocaleString('fr-FR')} GNF</span>
        </div>
        
        <div style="text-align: right; margin-top: 15px;">
          <button class="btn" onclick="validerCommandeBoutique(${commerceId}, '${boutique.nom_boutique.replace(/'/g, "\\'")}')" style="padding: 14px 28px; background: #1A1A2E; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1.05rem;">
            Commander ces articles
          </button>
        </div>
      </div>
    `;
  }

  panierBody.innerHTML = html;
}

// Wrappers pour re-rendre la page au lieu de re-rendre la sidebar
window.modifierQuantitePage = function(produitId, delta) {
  if (typeof window.modifierQuantitePanier === 'function') {
    window.modifierQuantitePanier(produitId, delta);
    renderPanierPage(); // Re-render the page body after update
  }
};

window.supprimerDuPanierPage = function(produitId) {
  if (typeof window.supprimerDuPanier === 'function') {
    window.supprimerDuPanier(produitId);
    renderPanierPage();
  }
};

// Redéfinition globale au cas où on recharge complètement après commande
window.addEventListener('panier_updated', () => {
  renderPanierPage();
});
