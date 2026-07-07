document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    alert("Produit introuvable.");
    window.location.href = '../mes-shoppings/home.html';
    return;
  }

  const loader = document.getElementById('loader-produit');
  const contenu = document.getElementById('contenu-produit');

  try {
    // 1. Charger le produit principal
    const rep = await apiCall(`/api/produits/${productId}`);
    if (!rep.success) throw new Error(rep.message);

    const produit = rep.produit;

    // Masquer le loader
    loader.style.display = 'none';
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
    document.getElementById('detail-nom').textContent = produit.nom || 'Produit sans nom';
    document.getElementById('detail-prix').textContent = formatPrix(produit.prix);
    document.getElementById('detail-categorie').textContent = produit.categorie_nom || 'Catégorie';
    document.getElementById('detail-description').textContent = produit.description || 'Aucune description fournie pour ce produit.';

    // Boutique
    document.getElementById('boutique-nom').textContent = produit.commerce_nom || 'Boutique';
    document.getElementById('boutique-adresse').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${produit.commerce_adresse || 'Adresse inconnue'}`;
    
    let boutiqueLogo = '../../medias/default-avatar.png';
    const logoSource = produit.commerce_logo || produit.commercant_photo;
    if (logoSource && !logoSource.includes('default-avatar.png')) {
      boutiqueLogo = logoSource.startsWith('http') ? logoSource : `https://addugo.up.railway.app${logoSource.startsWith('/') ? '' : '/'}${logoSource}`;
    }
    document.getElementById('boutique-logo').src = boutiqueLogo;

    // Contact
    document.getElementById('btn-contact-boutique').onclick = () => {
      const vendeurId = produit.commerce_utilisateur_id || produit.utilisateur_id;
      if (vendeurId) {
        window.location.href = `../espace-client/messages.html?user=${vendeurId}`;
      }
    };

    // Ajout au panier
    document.getElementById('btn-add-cart').onclick = () => {
      const qte = 1;
      const urlParamsUser = localStorage.getItem('addugo_user');
      if (!urlParamsUser) {
        alert("Veuillez vous connecter pour ajouter au panier.");
        window.location.href = '../accueil/login.html';
        return;
      }
      const client = JSON.parse(urlParamsUser);

      // On ajoute l'image pour le panier
      const produitPanier = { ...produit, image: imageUrl };
      
      ajouterAuPanier(produitPanier, qte, client.id);
      
      const btn = document.getElementById('btn-add-cart');
      const textOriginal = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
      btn.classList.replace('btn-orange', 'btn-vert');
      setTimeout(() => {
        btn.innerHTML = textOriginal;
        btn.classList.replace('btn-vert', 'btn-orange');
      }, 2000);
    };

    // 2. Charger les autres produits de la boutique
    if (produit.commerce_id) {
      chargerProduitsRecommandes(
        `/api/produits?commerce_id=${produit.commerce_id}`,
        'grille-boutique',
        'section-boutique',
        productId
      );
    }

    // 3. Charger les produits similaires (même catégorie)
    if (produit.categorie_id) {
      chargerProduitsRecommandes(
        `/api/produits?categorie_id=${produit.categorie_id}`,
        'grille-similaires',
        'section-similaires',
        productId
      );
    }

  } catch (err) {
    console.error(err);
    alert("Erreur lors du chargement du produit.");
  }

});

// Helper pour formater le prix
function formatPrix(prix) {
  return new Intl.NumberFormat('fr-FR').format(prix) + ' GNF';
}

// Fonction pour charger et afficher les recommandations
async function chargerProduitsRecommandes(endpoint, gridId, sectionId, currentProductId) {
  try {
    const rep = await apiCall(endpoint);
    if (rep.success && rep.produits && rep.produits.length > 0) {
      
      // Filtrer le produit actuel
      const produits = rep.produits.filter(p => String(p.id) !== String(currentProductId));
      
      if (produits.length > 0) {
        document.getElementById(sectionId).style.display = 'block';
        const grid = document.getElementById(gridId);
        
        let html = '';
        produits.slice(0, 4).forEach(p => { // On limite à 4 produits
          
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

          // HTML de la carte (Cliquable en entier)
          html += `
            <div class="produit-carte" style="cursor:pointer;" onclick="window.location.href='produit-details.html?id=${p.id}'">
              <div class="produit-img-wrapper" style="height:150px;">
                <img src="${image}" alt="${p.nom}" class="produit-img" style="height:100%; object-fit:cover;" onerror="this.src='../../medias/AdduGo_Logo.png'" />
              </div>
              <div class="produit-corps" style="padding:10px;">
                <div class="produit-desc" style="font-size:0.9rem; font-weight:700; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.nom || p.description}</div>
                <div class="produit-prix" style="font-size:1.1rem; color:var(--vert); font-weight:800;">${formatPrix(p.prix)}</div>
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
