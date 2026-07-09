document.addEventListener('DOMContentLoaded', () => {
  renderPanierPage();
});

window.addEventListener('panier_updated', () => {
  renderPanierPage();
});

function renderPanierPage() {
  const panierBody = document.getElementById('panier-page-body');
  const titreAccueil = document.getElementById('panier-titre-accueil');
  const sousTitre = document.getElementById('panier-sous-titre');
  if (!panierBody) return;

  const user = JSON.parse(localStorage.getItem('addugo_user') || 'null');
  const prenom = user && user.prenom ? user.prenom : 'Cher Client';
  const panier = getPanier();

  let totalArticles = 0;
  panier.forEach(i => totalArticles += i.quantite);

  // Mise à jour du titre
  if (titreAccueil) {
    titreAccueil.innerHTML = `Salut <span style="color: var(--orange);">${prenom}</span>, votre panier`;
  }
  if (sousTitre) {
    if (totalArticles === 0) {
      sousTitre.textContent = 'Vous n\'avez pas encore d\'article dans votre panier.';
    } else {
      sousTitre.textContent = `Vous avez ${totalArticles} produit${totalArticles > 1 ? 's' : ''} ajouté${totalArticles > 1 ? 's' : ''} dans votre panier.`;
    }
  }

  // === ÉTAT VIDE ===
  if (panier.length === 0) {
    panierBody.innerHTML = `
      <div style="background: var(--blanc); border: 1px solid var(--bordure); border-radius: 18px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); padding: 80px 30px; text-align: center;">
        <div style="width: 90px; height: 90px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px solid var(--bordure); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
          <i class="fas fa-shopping-basket" style="font-size: 2.8rem; color: #cbd5e1;"></i>
        </div>
        <h3 style="font-family: var(--police-titre); font-size: 1.4rem; font-weight: 800; margin: 0 0 10px 0; color: var(--texte);">Votre panier est vide</h3>
        <p style="margin: 0 0 30px 0; font-size: 0.95rem; color: var(--texte-gris); max-width: 360px; margin-left: auto; margin-right: auto; line-height: 1.6;">
          Vous n'avez pas encore sélectionné d'articles. Explorez nos boutiques et ajoutez vos coups de cœur !
        </p>
        <a href="home.html" style="display: inline-flex; align-items: center; gap: 10px; padding: 13px 28px; background: var(--orange); color: white; border-radius: 12px; font-weight: 700; font-size: 1rem; text-decoration: none; box-shadow: 0 4px 14px rgba(255,107,0,0.28); transition: opacity 0.2s ease;">
          <i class="fas fa-arrow-left"></i> Découvrir les produits
        </a>
      </div>
    `;
    return;
  }

  // === GROUPER LES ARTICLES PAR BOUTIQUE ===
  const parCommerce = {};
  let totalGlobal = 0;
  panier.forEach(item => {
    if (!parCommerce[item.commerce_id]) {
      parCommerce[item.commerce_id] = {
        nom_boutique: item.nom_boutique || 'Boutique',
        articles: [],
        total: 0
      };
    }
    parCommerce[item.commerce_id].articles.push(item);
    const sousTotal = item.prix * item.quantite;
    parCommerce[item.commerce_id].total += sousTotal;
    totalGlobal += sousTotal;
  });

  let html = '';
  const nbBoutiques = Object.keys(parCommerce).length;

  for (const commerceId in parCommerce) {
    const boutique = parCommerce[commerceId];
    const nbItems = boutique.articles.reduce((s, a) => s + a.quantite, 0);

    html += `
      <div class="panier-boutique-card">

        <!-- EN-TÊTE DE LA CARTE BOUTIQUE -->
        <div class="panier-boutique-header">
          <div class="panier-boutique-icon">
            <i class="fas fa-store" style="color: white; font-size: 1.1rem;"></i>
          </div>
          <div style="flex: 1;">
            <div style="font-family: var(--police-titre); font-weight: 800; font-size: 1.05rem; color: var(--texte);">${boutique.nom_boutique}</div>
            <div style="font-size: 0.82rem; color: var(--texte-gris); margin-top: 2px;">${nbItems} article${nbItems > 1 ? 's' : ''}</div>
          </div>
          <div style="font-size: 1.2rem; font-weight: 800; color: var(--orange);">
            ${boutique.total.toLocaleString('fr-FR')} GNF
          </div>
        </div>

        <!-- ARTICLES -->
        <div>
    `;

    boutique.articles.forEach(item => {
      const sousTotal = item.prix * item.quantite;
      html += `
        <div class="panier-article-row">

          <!-- IMAGE -->
          <img class="panier-article-img"
               src="${item.image || '../../medias/AdduGo_Logo.png'}"
               alt="${item.nom}"
               onerror="this.src='../../medias/AdduGo_Logo.png'" />

          <!-- INFOS -->
          <div style="flex: 1; min-width: 0;">
            <div class="panier-article-nom">${item.nom}</div>
            <div class="panier-article-prix">${item.prix.toLocaleString('fr-FR')} GNF</div>
            <div style="font-size: 0.82rem; color: var(--texte-gris); margin-top: 4px;">
              Sous-total : <strong style="color: var(--texte);">${sousTotal.toLocaleString('fr-FR')} GNF</strong>
            </div>
          </div>

          <!-- CONTRÔLE QUANTITÉ + SUPPRESSION -->
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0;">
            <div class="panier-quantite-ctrl">
              <button onclick="modifierQuantitePage(${item.produit_id}, -1)" title="Réduire la quantité">
                <i class="fas fa-minus" style="font-size: 0.75rem;"></i>
              </button>
              <span>${item.quantite}</span>
              <button onclick="modifierQuantitePage(${item.produit_id}, 1)" title="Augmenter la quantité">
                <i class="fas fa-plus" style="font-size: 0.75rem;"></i>
              </button>
            </div>
            <button class="btn-supprimer-article" onclick="supprimerDuPanierPage(${item.produit_id})" title="Retirer l'article">
              <i class="fas fa-trash-alt"></i> Retirer
            </button>
          </div>

        </div>
      `;
    });

    html += `
        </div>

        <!-- FOOTER CARTE BOUTIQUE -->
        <div class="panier-boutique-footer">
          <div>
            <div style="font-size: 0.82rem; color: var(--texte-gris); margin-bottom: 3px;">Sous-total de la boutique</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--texte);">${boutique.total.toLocaleString('fr-FR')} GNF</div>
          </div>
          <button class="btn-commander-boutique" onclick="validerCommandeBoutique(${commerceId}, '${boutique.nom_boutique.replace(/'/g, "\\'")}')">
            <i class="fas fa-check-circle"></i>
            Commander chez ${boutique.nom_boutique}
          </button>
        </div>

      </div>
    `;
  }

  // === TOTAL GLOBAL (si plusieurs boutiques) ===
  if (nbBoutiques > 1) {
    html += `
      <div class="panier-total-global-card">
        <div>
          <div style="font-size: 0.85rem; color: var(--texte-gris); margin-bottom: 4px;">
            <i class="fas fa-shopping-cart" style="color: var(--orange); margin-right: 5px;"></i>
            Total de toutes vos boutiques (${nbBoutiques} boutiques · ${totalArticles} article${totalArticles > 1 ? 's' : ''})
          </div>
          <div style="font-size: 1.7rem; font-weight: 900; color: var(--texte); font-family: var(--police-titre);">
            ${totalGlobal.toLocaleString('fr-FR')} <span style="font-size: 1rem; font-weight: 600;">GNF</span>
          </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--texte-gris); max-width: 260px; line-height: 1.5; text-align: right;">
          Chaque boutique est commandée séparément. Cliquez sur le bouton de chaque boutique pour valider.
        </div>
      </div>
    `;
  }

  panierBody.innerHTML = html;
}

// === WRAPPERS ===
window.modifierQuantitePage = function(produitId, delta) {
  if (typeof window.modifierQuantitePanier === 'function') {
    window.modifierQuantitePanier(produitId, delta);
  }
  renderPanierPage();
};

window.supprimerDuPanierPage = function(produitId) {
  if (typeof window.supprimerDuPanier === 'function') {
    window.supprimerDuPanier(produitId);
  }
  renderPanierPage();
};
