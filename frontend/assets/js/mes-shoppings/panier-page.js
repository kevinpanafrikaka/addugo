document.addEventListener('DOMContentLoaded', () => {
  renderPanierPage();
});

window.addEventListener('panier_updated', () => {
  renderPanierPage();
});

function renderPanierPage() {
  const panierBody   = document.getElementById('panier-page-body');
  const titreEl      = document.getElementById('panier-titre-accueil');
  const sousTitreEl  = document.getElementById('panier-sous-titre');
  if (!panierBody) return;

  const user   = JSON.parse(localStorage.getItem('addugo_user') || 'null');
  const prenom = user?.prenom || 'cher(e) Client(e)';
  const panier = getPanier();

  let totalArticles = 0;
  panier.forEach(i => totalArticles += i.quantite);

  // ── TITRE D'ACCUEIL ──
  if (titreEl) {
    titreEl.innerHTML = `Salut <span style="color:var(--orange);">${prenom}</span>, bienvenue dans votre panier <span style="color:var(--orange);">AdduGo</span>.`;
  }
  if (sousTitreEl) {
    sousTitreEl.textContent = totalArticles === 0
      ? "Votre panier est vide pour le moment — explorez nos boutiques !"
      : `${totalArticles} produit${totalArticles > 1 ? 's' : ''} sélectionné${totalArticles > 1 ? 's' : ''} dans ${Object.keys(groupParCommerce(panier)).length} boutique${Object.keys(groupParCommerce(panier)).length > 1 ? 's' : ''}.`;
  }

  // ── ÉTAT VIDE ──
  if (panier.length === 0) {
    panierBody.innerHTML = `
      <div style="background:var(--blanc); border:1px solid var(--bordure); border-radius:18px;
                  box-shadow:0 4px 16px rgba(0,0,0,0.03); padding:90px 30px; text-align:center;">
        <div style="width:96px; height:96px; background:linear-gradient(135deg,#fff7ed,#fff0dc);
                    border:2px solid #fed7aa; border-radius:50%; display:flex; align-items:center;
                    justify-content:center; margin:0 auto 24px auto; box-shadow:0 4px 14px rgba(255,107,0,0.08);">
          <i class="fas fa-shopping-basket" style="font-size:2.8rem; color:#fb923c;"></i>
        </div>
        <h3 style="font-family:var(--police-titre); font-size:1.5rem; font-weight:800; margin:0 0 10px 0; color:var(--texte);">
          Votre panier est vide
        </h3>
        <p style="margin:0 0 32px 0; font-size:0.96rem; color:var(--texte-gris); max-width:380px;
                  margin-left:auto; margin-right:auto; line-height:1.7;">
          Vous n'avez pas encore sélectionné d'articles. Explorez nos boutiques et ajoutez vos coups de cœur !
        </p>
        <a href="home.html" style="display:inline-flex; align-items:center; gap:10px; padding:13px 30px;
                  background:var(--orange); color:white; border-radius:12px; font-weight:700; font-size:1rem;
                  text-decoration:none; box-shadow:0 4px 14px rgba(255,107,0,0.28); transition:opacity .2s;">
          <i class="fas fa-arrow-left"></i> Découvrir les produits
        </a>
      </div>`;
    return;
  }

  // ── GROUPER PAR BOUTIQUE ──
  const parCommerce = groupParCommerce(panier);
  let totalGlobal = 0;
  Object.values(parCommerce).forEach(b => totalGlobal += b.total);
  const nbBoutiques = Object.keys(parCommerce).length;

  let html = '';

  for (const commerceId in parCommerce) {
    const boutique = parCommerce[commerceId];
    const nbItems  = boutique.articles.reduce((s, a) => s + a.quantite, 0);

    // Logo : fallback sur icône dans cercle coloré
    const logoHtml = boutique.logo
      ? `<img src="${boutique.logo}" alt="${boutique.nom_boutique}"
              style="width:46px; height:46px; object-fit:cover; border-radius:12px; flex-shrink:0;
                     box-shadow:0 2px 8px rgba(0,0,0,0.12); border:2px solid var(--bordure);"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div style="display:none; width:46px; height:46px; background:linear-gradient(135deg,var(--orange),#ff8c00);
                     border-radius:12px; align-items:center; justify-content:center; flex-shrink:0;">
           <i class="fas fa-store" style="color:white; font-size:1.1rem;"></i>
         </div>`
      : `<div style="width:46px; height:46px; background:linear-gradient(135deg,var(--orange),#ff8c00);
                     border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
                     box-shadow:0 2px 8px rgba(255,107,0,0.2);">
           <i class="fas fa-store" style="color:white; font-size:1.1rem;"></i>
         </div>`;

    html += `
      <div style="background:var(--blanc); border:1px solid var(--bordure); border-radius:20px;
                  margin-bottom:24px; box-shadow:0 2px 12px rgba(0,0,0,0.04); overflow:hidden;
                  transition:box-shadow .2s ease;" onmouseover="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.08)'"
           onmouseout="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.04)'">

        <!-- EN-TÊTE BOUTIQUE -->
        <div style="display:flex; align-items:center; gap:14px; padding:18px 22px;
                    background:linear-gradient(to right, #fafbff, #f8fafc);
                    border-bottom:1px solid var(--bordure);">
          ${logoHtml}
          <div style="flex:1; min-width:0;">
            <div style="font-family:var(--police-titre); font-weight:800; font-size:1.05rem;
                        color:var(--texte); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${boutique.nom_boutique}
            </div>
            <div style="font-size:0.82rem; color:var(--texte-gris); margin-top:3px;">
              <i class="fas fa-box-open" style="color:var(--orange); margin-right:4px; font-size:0.78rem;"></i>
              ${nbItems} article${nbItems > 1 ? 's' : ''}
            </div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div style="font-size:0.75rem; color:var(--texte-gris); margin-bottom:2px;">Sous-total</div>
            <div style="font-size:1.2rem; font-weight:900; color:var(--orange);">
              ${boutique.total.toLocaleString('fr-FR')}&nbsp;GNF
            </div>
          </div>
        </div>

        <!-- LISTE DES ARTICLES -->
        <div>
    `;

    boutique.articles.forEach((item, idx) => {
      const sousTotal = item.prix * item.quantite;
      const isLast    = idx === boutique.articles.length - 1;
      html += `
        <div style="display:flex; align-items:center; gap:16px; padding:16px 22px;
                    ${isLast ? '' : 'border-bottom:1px solid var(--bordure);'}
                    transition:background .15s ease;"
             onmouseover="this.style.background='#fafbff'" onmouseout="this.style.background='transparent'">

          <!-- IMAGE PRODUIT -->
          <img src="${item.image || '../../medias/AdduGo_Logo.png'}" alt="${item.nom}"
               style="width:88px; height:88px; object-fit:cover; border-radius:14px; flex-shrink:0;
                      box-shadow:0 3px 12px rgba(0,0,0,0.1);"
               onerror="this.src='../../medias/AdduGo_Logo.png'" />

          <!-- INFOS PRODUIT -->
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.97rem; color:var(--texte);
                        font-family:var(--police-titre); margin-bottom:5px;
                        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${item.nom}
            </div>
            <div style="font-size:1.1rem; color:var(--orange); font-weight:800; margin-bottom:5px;">
              ${item.prix.toLocaleString('fr-FR')}&nbsp;GNF
            </div>
            <div style="font-size:0.82rem; color:var(--texte-gris);">
              Sous-total :
              <strong style="color:var(--texte); font-weight:700;">
                ${sousTotal.toLocaleString('fr-FR')}&nbsp;GNF
              </strong>
            </div>
          </div>

          <!-- CONTRÔLES DROITE -->
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0;">

            <!-- Sélecteur de quantité -->
            <div style="display:flex; align-items:center; gap:6px; background:var(--fond-tres-clair);
                        border:1px solid var(--bordure); border-radius:12px; padding:5px 8px;">
              <button onclick="modifierQuantitePage(${item.produit_id}, -1)"
                      style="width:30px; height:30px; border:none; background:var(--blanc); border-radius:8px;
                             cursor:pointer; font-size:0.85rem; color:var(--texte); display:flex; align-items:center;
                             justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,0.08); font-weight:700;
                             transition:all .15s ease;"
                      onmouseover="this.style.background='var(--orange)'; this.style.color='white';"
                      onmouseout="this.style.background='var(--blanc)'; this.style.color='var(--texte)';">
                <i class="fas fa-minus" style="font-size:0.7rem;"></i>
              </button>
              <span style="min-width:32px; text-align:center; font-weight:800; font-size:1rem; color:var(--texte);">
                ${item.quantite}
              </span>
              <button onclick="modifierQuantitePage(${item.produit_id}, 1)"
                      style="width:30px; height:30px; border:none; background:var(--blanc); border-radius:8px;
                             cursor:pointer; font-size:0.85rem; color:var(--texte); display:flex; align-items:center;
                             justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,0.08); font-weight:700;
                             transition:all .15s ease;"
                      onmouseover="this.style.background='var(--orange)'; this.style.color='white';"
                      onmouseout="this.style.background='var(--blanc)'; this.style.color='var(--texte)';">
                <i class="fas fa-plus" style="font-size:0.7rem;"></i>
              </button>
            </div>

            <!-- Bouton Retirer -->
            <button onclick="supprimerDuPanierPage(${item.produit_id})"
                    style="border:none; background:none; color:#ef4444; cursor:pointer; padding:6px 10px;
                           border-radius:8px; font-size:0.85rem; display:flex; align-items:center; gap:5px;
                           transition:background .15s ease; font-weight:600;"
                    onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='none'">
              <i class="fas fa-trash-alt"></i> Retirer
            </button>

          </div>
        </div>
      `;
    });

    html += `
        </div>

        <!-- FOOTER BOUTIQUE -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 22px;
                    background:linear-gradient(to right, #fafbff, #f8fafc); border-top:1px solid var(--bordure);
                    flex-wrap:wrap; gap:14px;">
          <div>
            <div style="font-size:0.8rem; color:var(--texte-gris); margin-bottom:3px;">
              Total à régler chez ${boutique.nom_boutique}
            </div>
            <div style="font-size:1.4rem; font-weight:900; color:var(--texte); font-family:var(--police-titre);">
              ${boutique.total.toLocaleString('fr-FR')} <span style="font-size:0.9rem; font-weight:600;">GNF</span>
            </div>
          </div>
          <button onclick="validerCommandeBoutique(${commerceId}, '${boutique.nom_boutique.replace(/'/g, "\\'")}')"
                  style="padding:13px 26px; background:#1A1A2E; color:white; border:none; border-radius:14px;
                         font-weight:700; font-size:0.95rem; cursor:pointer; display:flex; align-items:center;
                         gap:9px; transition:opacity .2s ease, transform .2s ease; box-shadow:0 4px 14px rgba(26,26,46,0.18);"
                  onmouseover="this.style.opacity='0.88'; this.style.transform='translateY(-1px)';"
                  onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)';">
            <i class="fas fa-check-circle"></i>
            Commander chez ${boutique.nom_boutique}
          </button>
        </div>

      </div>
    `;
  }

  // ── TOTAL GLOBAL (si > 1 boutique) ──
  if (nbBoutiques > 1) {
    html += `
      <div style="position:sticky; bottom:20px; background:var(--blanc); border:1px solid var(--bordure);
                  border-radius:18px; padding:18px 24px; box-shadow:0 -4px 24px rgba(0,0,0,0.1);
                  display:flex; justify-content:space-between; align-items:center; gap:16px;
                  flex-wrap:wrap; margin-top:8px; backdrop-filter:blur(4px);">
        <div>
          <div style="font-size:0.85rem; color:var(--texte-gris); margin-bottom:4px;">
            <i class="fas fa-shopping-cart" style="color:var(--orange); margin-right:5px;"></i>
            Total de vos achats · ${nbBoutiques} boutiques · ${totalArticles} article${totalArticles > 1 ? 's' : ''}
          </div>
          <div style="font-size:1.8rem; font-weight:900; color:var(--texte); font-family:var(--police-titre);">
            ${totalGlobal.toLocaleString('fr-FR')}
            <span style="font-size:1rem; font-weight:600; color:var(--texte-gris);">GNF</span>
          </div>
        </div>
        <div style="font-size:0.8rem; color:var(--texte-gris); max-width:270px;
                    line-height:1.6; text-align:right;">
          <i class="fas fa-info-circle" style="color:var(--orange); margin-right:4px;"></i>
          Chaque boutique est commandée séparément. Validez bouton par bouton ci-dessus.
        </div>
      </div>
    `;
  }

  panierBody.innerHTML = html;
}

// ── UTILITAIRE : grouper par commerce ──
function groupParCommerce(panier) {
  const res = {};
  panier.forEach(item => {
    if (!res[item.commerce_id]) {
      res[item.commerce_id] = {
        nom_boutique: item.nom_boutique || 'Boutique',
        logo: item.logo_boutique || null,
        articles: [],
        total: 0
      };
    }
    res[item.commerce_id].articles.push(item);
    res[item.commerce_id].total += item.prix * item.quantite;
    // Mise à jour du logo si disponible sur un article ultérieur
    if (item.logo_boutique && !res[item.commerce_id].logo) {
      res[item.commerce_id].logo = item.logo_boutique;
    }
  });
  return res;
}

// ── WRAPPERS ──
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
