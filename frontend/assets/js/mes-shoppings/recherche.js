// ============================================================
// AdduGo — Recherche Dynamique avec Filtres & Tri
// ============================================================

const CACHE_KEY = 'addugo_produits_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let tousLesProduits = []; // Tous les produits chargés
let produitsAffiches = []; // Résultats après filtrage (pour le tri)

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';

  // Affichage de la requête et mise à jour de la barre de recherche
  const queryTextSpan = document.getElementById('recherche-query-text');
  const searchInput = document.getElementById('navbar-search-input');
  if (queryTextSpan) queryTextSpan.textContent = query ? `"${query}"` : `Tous les produits`;
  if (searchInput) searchInput.value = query;

  // Charger les produits depuis le cache ou l'API
  tousLesProduits = await chargerProduits();

  // Construire les filtres de catégories dynamiquement
  construireFiltresCategories(tousLesProduits);

  // Premier affichage
  appliquerFiltres(query);

  // ── ÉCOUTE DES ÉVÉNEMENTS DE FILTRAGE ──

  // Cases à cocher catégories (délégation d'événement)
  document.getElementById('filtres-categories')?.addEventListener('change', () => appliquerFiltres(query));

  // Cases à cocher prix
  document.querySelectorAll('.filtre-prix').forEach(cb => {
    cb.addEventListener('change', () => appliquerFiltres(query));
  });

  // Tri
  document.getElementById('tri-select')?.addEventListener('change', () => trierEtAfficher());

  // Réinitialiser tous les filtres
  document.getElementById('btn-reset-filtres')?.addEventListener('click', () => {
    document.querySelectorAll('#filtres-categories input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filtre-prix').forEach(cb => cb.checked = false);
    document.getElementById('tri-select').value = 'pertinence';
    appliquerFiltres(query);
  });

  // Nouvelle recherche depuis la barre de nav
  const btnSearch = document.getElementById('navbar-search-btn');
  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      const q = searchInput?.value.trim() || '';
      window.location.href = `recherche.html?q=${encodeURIComponent(q)}`;
    });
  }
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim() || '';
        window.location.href = `recherche.html?q=${encodeURIComponent(q)}`;
      }
    });
  }
});

// ── CHARGEMENT DES PRODUITS (CACHE) ──
async function chargerProduits() {
  try {
    const cachedDataStr = sessionStorage.getItem(CACHE_KEY);
    if (cachedDataStr) {
      const cached = JSON.parse(cachedDataStr);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }
    const res = await apiFetch('/produits');
    const data = await res.json();
    if (data.success && data.produits) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: data.produits }));
      return data.produits;
    }
  } catch (err) {
    console.error('Erreur chargement produits:', err);
  }
  return [];
}

// ── CONSTRUCTION DYNAMIQUE DES CATÉGORIES ──
function construireFiltresCategories(produits) {
  const conteneur = document.getElementById('filtres-categories');
  if (!conteneur) return;

  // Extraire les catégories uniques
  const categories = [...new Set(
    produits.map(p => p.categorie_nom || p.categorie || 'Général').filter(Boolean)
  )].sort();

  if (categories.length === 0) {
    conteneur.innerHTML = '<div style="font-size:0.8rem; color:var(--texte-gris);">Aucune catégorie trouvée</div>';
    return;
  }

  conteneur.innerHTML = categories.map(cat => `
    <label class="filtre-option">
      <input type="checkbox" class="filtre-categorie" value="${cat}"> ${cat}
    </label>
  `).join('');

  // Ajouter les listeners sur les nouvelles cases
  conteneur.querySelectorAll('.filtre-categorie').forEach(cb => {
    cb.addEventListener('change', () => {
      const params = new URLSearchParams(window.location.search);
      appliquerFiltres(params.get('q') || '');
    });
  });
}

// ── APPLICATION DES FILTRES ──
function appliquerFiltres(query) {
  const feed = document.getElementById('recherche-resultats-feed');
  if (!feed) return;

  const requeteClean = query.toLowerCase().trim();

  // 1. Filtrage par texte de recherche
  let resultats = tousLesProduits.filter(p => {
    if (!requeteClean) return true;
    const nom = (p.nom || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const cat = (p.categorie_nom || p.categorie || '').toLowerCase();
    const boutique = (p.commerce_nom || p.nom_boutique || '').toLowerCase();
    return nom.includes(requeteClean) || desc.includes(requeteClean) || cat.includes(requeteClean) || boutique.includes(requeteClean);
  });

  // 2. Filtrage par catégorie cochée
  const categoriesChoisies = [...document.querySelectorAll('.filtre-categorie:checked')].map(cb => cb.value.toLowerCase());
  if (categoriesChoisies.length > 0) {
    resultats = resultats.filter(p => {
      const cat = (p.categorie_nom || p.categorie || 'Général').toLowerCase();
      return categoriesChoisies.includes(cat);
    });
  }

  // 3. Filtrage par prix coché
  const prixCoches = [...document.querySelectorAll('.filtre-prix:checked')];
  if (prixCoches.length > 0) {
    resultats = resultats.filter(p => {
      const prix = p.prix || 0;
      return prixCoches.some(cb => {
        const min = parseInt(cb.dataset.min);
        const max = parseInt(cb.dataset.max);
        return prix >= min && prix <= max;
      });
    });
  }

  // Stocker pour le tri
  produitsAffiches = resultats;

  // Mettre à jour le compteur
  const countEl = document.getElementById('recherche-count');
  if (countEl) {
    countEl.textContent = resultats.length === 0
      ? 'Aucun résultat'
      : `${resultats.length} produit${resultats.length > 1 ? 's' : ''} trouvé${resultats.length > 1 ? 's' : ''}`;
  }

  if (resultats.length === 0) {
    feed.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background:var(--blanc); border-radius:16px; box-shadow:var(--ombre-sm);">
        <div style="font-size: 3rem; color: var(--orange); margin-bottom: 15px;"><i class="fas fa-search-minus"></i></div>
        <h3 style="font-family: var(--police-titre); font-weight: 800; color: var(--texte); font-size: 1.4rem; margin-bottom:8px;">Aucun produit trouvé</h3>
        <p style="color: var(--texte-gris);">Essayez d'autres mots-clés ou de modifier vos filtres.</p>
        <button onclick="document.getElementById('btn-reset-filtres').click()" style="margin-top:16px; padding:10px 24px; background:var(--orange); color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer;">
          Réinitialiser les filtres
        </button>
      </div>
    `;
    return;
  }

  trierEtAfficher();
}

// ── TRI & RENDU FINAL ──
function trierEtAfficher() {
  const triSelect = document.getElementById('tri-select');
  const tri = triSelect ? triSelect.value : 'pertinence';

  let resultats = [...produitsAffiches];

  if (tri === 'prix-asc') {
    resultats.sort((a, b) => (a.prix || 0) - (b.prix || 0));
  } else if (tri === 'prix-desc') {
    resultats.sort((a, b) => (b.prix || 0) - (a.prix || 0));
  }
  // 'pertinence' = ordre naturel de l'API

  afficherProduits(resultats);
}

// ── RENDU DES CARTES PRODUITS ──
function afficherProduits(resultats) {
  const feed = document.getElementById('recherche-resultats-feed');
  if (!feed) return;

  let html = '';
  resultats.forEach(p => {
    const prixFormate = new Intl.NumberFormat('fr-FR').format(p.prix || 0) + '\u00A0GNF';

    // Image du produit
    let image = '../../images/AdduGo_Logo.png';
    if (p.images) {
      try {
        let parsedImages = p.images;
        if (typeof p.images === 'string') {
          parsedImages = p.images.startsWith('[') ? JSON.parse(p.images) : [p.images];
        }
        if (Array.isArray(parsedImages) && parsedImages.length > 0) image = parsedImages[0];
        else if (typeof p.images === 'string' && p.images.startsWith('/')) image = p.images;
      } catch (e) {
        image = typeof p.images === 'string' ? p.images : '../../images/AdduGo_Logo.png';
      }
      if (image && !image.startsWith('http') && !image.includes('AdduGo_Logo.png')) {
        image = `https://addugo.up.railway.app${image.startsWith('/') ? '' : '/'}${image}`;
      }
    }

    // Photo de la boutique
    let photoBoutique = '../../assets/img/default-avatar.png';
    const photoSource = p.commerce_logo || p.commercant_photo;
    if (photoSource && !photoSource.includes('default-avatar.png')) {
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
}
