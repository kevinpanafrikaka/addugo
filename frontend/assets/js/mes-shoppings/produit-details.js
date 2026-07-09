document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const loader   = document.getElementById('loader-produit');
  const contenu  = document.getElementById('contenu-produit');
  const erreurEl = document.getElementById('erreur-produit');

  if (!productId) {
    loader.style.display  = 'none';
    erreurEl.style.display = 'block';
    return;
  }

  try {
    // 1. Charger le produit principal
    const rep = await apiFetch(`/produits/${productId}`);
    const data = await rep.json();

    if (!data.success || !data.produit) throw new Error(data.message || 'Produit introuvable.');

    const produit = data.produit;

    // Masquer le loader, afficher le contenu
    loader.style.display  = 'none';
    contenu.style.display = 'flex';

    // Image
    let imageUrl = '../../medias/AdduGo_Logo.png';
    if (produit.images) {
      try {
        const imagesArr = JSON.parse(produit.images);
        if (imagesArr.length > 0) imageUrl = imagesArr[0];
      } catch (e) {
        imageUrl = produit.images;
      }
    }
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.includes('AdduGo_Logo.png')) {
      imageUrl = `https://addugo.up.railway.app${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }
    document.getElementById('detail-image').src = imageUrl;

    // Textes
    document.getElementById('detail-nom').textContent         = produit.nom || 'Produit sans nom';
    document.getElementById('detail-prix').textContent        = formatPrix(produit.prix);
    document.getElementById('detail-categorie').textContent   = produit.categorie_nom || 'Catégorie';
    document.getElementById('detail-description').textContent = produit.description || 'Aucune description fournie pour ce produit.';

    // Boutique
    document.getElementById('boutique-nom').textContent     = produit.commerce_nom || 'Boutique';
    document.getElementById('boutique-adresse').innerHTML   = `<i class="fas fa-map-marker-alt"></i> ${produit.commerce_adresse || 'Adresse inconnue'}`;

    let boutiqueLogo = '../../medias/default-avatar.png';
    const logoSource = produit.commerce_logo || produit.commercant_photo;
    if (logoSource && !logoSource.includes('default-avatar.png')) {
      boutiqueLogo = logoSource.startsWith('http') ? logoSource : `https://addugo.up.railway.app${logoSource.startsWith('/') ? '' : '/'}${logoSource}`;
    }
    document.getElementById('boutique-logo').src = boutiqueLogo;

    // Contact Vendeur
    document.getElementById('btn-contact-boutique').onclick = () => {
      const vendeurId = produit.commerce_utilisateur_id || produit.utilisateur_id;
      if (vendeurId) {
        window.location.href = `../espace-client/messages.html?user=${vendeurId}`;
      } else {
        alert("Impossible de contacter ce vendeur pour l'instant.");
      }
    };

    // Ajout au panier
    document.getElementById('btn-add-cart').onclick = () => {
      const userData = localStorage.getItem('addugo_user');
      if (!userData) {
        alert("Veuillez vous connecter pour ajouter au panier.");
        window.location.href = '../accueil/login.html';
        return;
      }
      const client = JSON.parse(userData);
      const produitPanier = { ...produit, image: imageUrl };
      ajouterAuPanier(produitPanier, 1, client.id);

      const btn = document.getElementById('btn-add-cart');
      const textOriginal = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
      btn.style.background = 'var(--succes)';
      setTimeout(() => {
        btn.innerHTML = textOriginal;
        btn.style.background = '';
      }, 2000);
    };

    // 2. Charger les autres produits de la boutique
    if (produit.commerce_id) {
      chargerProduitsRecommandes(
        `/produits?commerce_id=${produit.commerce_id}`,
        'grille-boutique',
        'section-boutique',
        productId
      );
    }

    // 3. Charger les produits similaires (même catégorie)
    if (produit.categorie_id) {
      chargerProduitsRecommandes(
        `/produits?categorie_id=${produit.categorie_id}`,
        'grille-similaires',
        'section-similaires',
        productId
      );
    }

  } catch (err) {
    console.error('Erreur produit-details:', err);
    loader.style.display   = 'none';
    erreurEl.style.display = 'block';
  }
});

// Helper pour formater le prix
function formatPrix(prix) {
  return new Intl.NumberFormat('fr-FR').format(prix) + ' GNF';
}

// Fonction pour charger et afficher les recommandations
async function chargerProduitsRecommandes(endpoint, gridId, sectionId, currentProductId) {
  try {
    const rep  = await apiFetch(endpoint);
    const data = await rep.json();

    if (data.success && data.produits && data.produits.length > 0) {
      const produits = data.produits.filter(p => String(p.id) !== String(currentProductId));

      if (produits.length > 0) {
        document.getElementById(sectionId).style.display = 'block';
        const grid = document.getElementById(gridId);

        let html = '';
        produits.slice(0, 4).forEach(p => {
          let image = '../../medias/AdduGo_Logo.png';
          if (p.images) {
            try {
              const arr = JSON.parse(p.images);
              if (arr.length > 0) image = arr[0];
            } catch(e) {
              image = p.images;
            }
          }
          if (image && !image.startsWith('http') && !image.includes('AdduGo_Logo.png')) {
            image = `https://addugo.up.railway.app${image.startsWith('/') ? '' : '/'}${image}`;
          }

          html += `
            <div class="produit-carte" style="cursor:pointer;" onclick="window.location.href='produit-details.html?id=${p.id}'">
              <div class="produit-img-wrapper" style="height:150px;">
                <img src="${image}" alt="${p.nom}" class="produit-img" style="height:100%; object-fit:cover;" onerror="this.src='../../medias/AdduGo_Logo.png'" />
              </div>
              <div class="produit-corps" style="padding:10px;">
                <div class="produit-titre" style="font-size:0.9rem; font-weight:700; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.nom || ''}</div>
                <div class="produit-prix" style="font-size:1rem; font-weight:800;">${formatPrix(p.prix)}</div>
              </div>
            </div>
          `;
        });

        grid.innerHTML = html;
      }
    }
  } catch (err) {
    console.error("Erreur recommandations:", err);
  }
}
