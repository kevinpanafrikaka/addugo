document.addEventListener('DOMContentLoaded', () => {
  // 1. Récupérer la requête de recherche dans l'URL (ex: ?q=montre)
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';
  
  // Mettre à jour l'affichage de la requête et la barre de recherche
  const queryTextSpan = document.getElementById('recherche-query-text');
  const searchInput = document.getElementById('navbar-search-input');
  
  if (query) {
    if (queryTextSpan) queryTextSpan.textContent = `"${query}"`;
    if (searchInput) searchInput.value = query;
  } else {
    if (queryTextSpan) queryTextSpan.textContent = `"Toutes les recherches"`;
  }

  // ==== CHARGEMENT DES RÉSULTATS ====
  chargerResultatsRecherche(query);
});

async function chargerResultatsRecherche(query) {
  const feed = document.getElementById('recherche-resultats-feed');
  if (!feed) return;

  const CACHE_KEY = 'addugo_produits_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  try {
    let produitsListe = [];
    
    // 1. Vérification du cache
    const cachedDataStr = sessionStorage.getItem(CACHE_KEY);
    if (cachedDataStr) {
      try {
        const cached = JSON.parse(cachedDataStr);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          produitsListe = cached.data;
        }
      } catch (e) {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

    // 2. Si pas de cache ou cache expiré, appel API
    if (produitsListe.length === 0) {
      const res = await apiFetch('/produits');
      const data = await res.json();
      if (data.success && data.produits) {
        produitsListe = data.produits;
        // Enregistrement dans le cache
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: produitsListe
        }));
      }
    }

    let resultats = produitsListe;

    // 3. Filtrage en fonction de la requête
    const requeteClean = query.toLowerCase().trim();
    if (requeteClean) {
      resultats = produitsListe.filter(p => {
        const nom = (p.nom || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const categorie = (p.categorie_nom || p.categorie || '').toLowerCase();
        const boutique = (p.commerce_nom || p.nom_boutique || '').toLowerCase();
        
        return nom.includes(requeteClean) || 
               desc.includes(requeteClean) ||
               categorie.includes(requeteClean) ||
               boutique.includes(requeteClean);
      });
    }

    if (resultats.length === 0) {
      // Aucun résultat trouvé
      feed.innerHTML = `
        <div class="aucun-resultat" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; color: var(--orange); margin-bottom: 15px;"><i class="fas fa-search-minus"></i></div>
          <h3 style="font-family: var(--police-titre); font-weight: 800; color: var(--texte); font-size: 1.5rem;">Aucun produit ne correspond à "${query}"</h3>
          <p style="color: var(--texte-gris);">Essayez de vérifier l'orthographe ou d'utiliser des termes plus généraux.</p>
        </div>
      `;
      return;
    }

    // Afficher les résultats avec le même design que home.js
    let html = '';
    resultats.forEach(p => {
      const prixFormate = new Intl.NumberFormat('fr-FR').format(p.prix || 0) + ' GNF';
      
      // Image du produit
      let image = '../../images/AdduGo_Logo.png'; // Placeholder fallback
      if (p.images) {
        try {
          let parsedImages = p.images;
          if (typeof p.images === 'string') {
            if (p.images.startsWith('[')) {
              parsedImages = JSON.parse(p.images);
            } else {
              parsedImages = [p.images];
            }
          }
          
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            image = parsedImages[0];
          } else if (typeof p.images === 'string' && p.images.startsWith('/')) {
            image = p.images;
          }
        } catch (e) {
          image = typeof p.images === 'string' ? p.images : '../../images/AdduGo_Logo.png';
        }
        
        if (image && typeof image === 'string' && !image.startsWith('http') && !image.includes('AdduGo_Logo.png')) {
          image = `https://addugo.up.railway.app${image.startsWith('/') ? '' : '/'}${image}`;
        }
      }

      // Photo de la boutique / du commerçant
      let photoBoutique = '../../assets/img/default-avatar.png';
      const photoSource = p.commerce_logo || p.commercant_photo;
      if (photoSource && typeof photoSource === 'string' && !photoSource.includes('default-avatar.png')) {
        photoBoutique = photoSource.startsWith('http') ? photoSource : `https://addugo.up.railway.app${photoSource.startsWith('/') ? '' : '/'}${photoSource}`;
      }

      const nomBoutique = p.commerce_nom || p.nom_boutique || `${p.commercant_prenom || ''} ${p.commercant_nom || ''}`.trim() || 'Boutique Partenaire';
      const categorie = p.categorie_nom || p.categorie || 'Général';
      const vendeurId = p.commerce_utilisateur_id || p.utilisateur_id || 1;

      html += `
        <div class="produit-carte">
          <div class="produit-img-wrapper">
            <span class="produit-badge-categorie">
              <i class="fas fa-tag" style="color:var(--orange);"></i> ${categorie}
            </span>
            <img src="${image}" alt="${p.nom}" class="produit-img" onerror="this.src='../../images/AdduGo_Logo.png'" />
          </div>

          <div class="produit-corps" style="padding: 12px 10px;">
            <!-- Le nom du produit est masqué ici selon la demande sur home.js -->
            
            <div class="produit-desc" title="${p.description || ''}">${p.description || 'Aucune description fournie.'}</div>

            <div class="produit-prix-ligne" style="margin-top: 10px;">
              <div class="produit-prix" style="font-size: 1.1rem;">${prixFormate}</div>
            </div>

            <div class="produit-actions" style="margin-top: 12px; display: flex; gap: 8px; align-items: center;">
              <button title="Contacter" style="background: #1A1A2E; border: none; border-radius: 6px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #FFFFFF; flex-shrink: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="window.location.href='../espace-client/messages.html?user=${vendeurId}&p_nom=' + encodeURIComponent('${p.nom.replace(/'/g, "\\'")}') + '&p_prix=${p.prix}&p_img=' + encodeURIComponent('${image}')">
                <i class="fas fa-comment-dots" style="font-size: 1.1rem;"></i>
              </button>
              <button class="btn btn-orange" style="flex: 1; padding: 0; height: 34px; font-size: 0.8rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;" onclick="ajouterAuPanier(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.prix}, '${image}', ${vendeurId}, '${nomBoutique.replace(/'/g, "\\'")}', '${photoBoutique}')">
                <i class="fas fa-cart-plus"></i> Ajouter
              </button>
            </div>
          </div>

          <div class="produit-boutique-footer">
            <img src="${photoBoutique}" alt="${nomBoutique}" class="produit-boutique-img" onerror="this.src='../../assets/img/default-avatar.png'" />
            <span class="produit-boutique-nom">${nomBoutique}</span>
          </div>
        </div>
      `;
    });

    feed.innerHTML = html;
    
  } catch (err) {
    console.error("Erreur lors de la recherche :", err);
    feed.innerHTML = `
      <div class="aucun-resultat" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545; margin-bottom: 15px;"></i>
        <h3 style="color: var(--texte);">Erreur de chargement</h3>
        <p style="color: var(--texte-gris);">Impossible de charger les résultats de recherche. Veuillez réessayer plus tard.</p>
      </div>
    `;
  }
}
