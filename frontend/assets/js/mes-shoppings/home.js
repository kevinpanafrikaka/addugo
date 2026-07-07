// ============================================================
// AdduGo — Home / Page d'Accueil (home.js)
// ============================================================

const currentUser = JSON.parse(localStorage.getItem('addugo_user') || 'null');

document.addEventListener('DOMContentLoaded', () => {
  chargerProduits();
  chargerBoutiquesNav();
});

// ── ALGORITHME DE MÉLANGE ALÉATOIRE (FISHER-YATES SHUFFLE) ──
function melangerTableau(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── CHARGEMENT ET FILTRAGE DES PRODUITS ──
async function chargerProduits() {
  const feed = document.getElementById('feed-produits');
  if (!feed) return;

  try {
    const res = await apiFetch('/produits');
    const data = await res.json();

    if (data.success && data.produits && data.produits.length > 0) {
      let produitsAffiches = data.produits;

      // CONDITION A & C : Si l'utilisateur est un commerçant, exlure TOUS SES PROPRES produits
      if (currentUser && currentUser.id) {
        produitsAffiches = produitsAffiches.filter(p => {
          const vendeurId = p.utilisateur_id || p.commerce_utilisateur_id;
          return Number(vendeurId) !== Number(currentUser.id);
        });
      }

      // CONDITION D : Mélanger aléatoirement les cartes produits à chaque chargement
      produitsAffiches = melangerTableau(produitsAffiches);

      if (produitsAffiches.length === 0) {
        feed.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--texte-gris);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;"><i class="fas fa-store" style="margin-right:4px;"></i></div>
            <h3 style="font-family: var(--police-titre); font-weight: 800; color: var(--texte); margin: 0 0 6px 0;">Aucun produit d'autre boutique disponible</h3>
            <p style="margin: 0; font-size: 0.88rem;">Vos propres produits sont masqués sur votre fil d'accueil personnel.</p>
          </div>
        `;
        return;
      }

      // CONDITION B : Rendu de la carte Produit avec Image, Description, Prix, Catégorie, Photo boutique + Nom en gras
      let html = '';
      produitsAffiches.forEach(p => {
        const prixFormate = new Intl.NumberFormat('fr-FR').format(p.prix || 0) + ' GNF';
        
        // Image du produit
        let image = '../../images/AdduGo_Logo.png'; // Placeholder fallback
        if (p.images) {
          try {
            let parsedImages = p.images;
            if (typeof p.images === 'string') {
              // Parfois la base renvoie une chaîne JSON simple si ce n'est pas un tableau valide
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
          <div class="produit-carte" style="cursor: pointer;" onclick="window.location.href='produit-details.html?id=${p.id}'">
            <div class="produit-img-wrapper">
              <span class="produit-badge-categorie">
                <i class="fas fa-tag" style="color:var(--orange);"></i> ${categorie}
              </span>
              <img src="${image}" alt="${p.nom}" class="produit-img" onerror="this.src='../../images/AdduGo_Logo.png'" />
            </div>

            <div class="produit-corps">
              <!-- Le nom du produit est masqué ici selon la demande -->
              <h4 class="produit-titre">${p.nom}</h4>
              <div class="produit-desc" title="${p.description || ''}">${p.description || 'Aucune description fournie.'}</div>

              <div class="produit-prix-ligne">
                <div class="produit-prix">${prixFormate}</div>
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
    } else {
      feed.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--texte-gris);">
          <div style="font-size: 2.5rem; margin-bottom: 10px;"><i class="fas fa-shopping-bag" style="margin-right:4px;"></i></div>
          <h3 style="font-family: var(--police-titre); font-weight: 800; color: var(--texte); margin: 0 0 6px 0;">Aucun produit disponible</h3>
          <p style="margin: 0; font-size: 0.88rem;">Revenez plus tard pour découvrir les nouveautés !</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Erreur de chargement des produits:', error);
    feed.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: red;">Erreur lors du chargement des produits. Vérifiez que le serveur est lancé.</div>';
  }
}

// ── CHARGEMENT DYNAMIQUE DU MENU DROPDOWN NOS BOUTIQUES ──
async function chargerBoutiquesNav() {
  const conteneur = document.getElementById('liste-boutiques-nav');
  if (!conteneur) return;

  try {
    const res = await apiFetch('/commerces');
    const data = await res.json();

    if (data.success && data.commerces && data.commerces.length > 0) {
      conteneur.innerHTML = data.commerces.map(c => {
        const logoUrl = c.logo 
          ? (c.logo.startsWith('http') ? c.logo : `https://addugo.up.railway.app${c.logo.startsWith('/') ? '' : '/'}${c.logo}`)
          : null;

        return `
          <div class="boutique-nav-item" onclick="window.location.href='recherche.html?q=${encodeURIComponent(c.nom)}'" style="display:flex; align-items:center; gap:12px; padding:10px; border-radius:12px; cursor:pointer; transition:background 0.2s; border-bottom:1px solid var(--bordure-claire, #F3F4F6);">
            ${logoUrl 
              ? `<img src="${logoUrl}" alt="${c.nom}" style="width:44px; height:44px; border-radius:10px; object-fit:cover; border:1px solid var(--bordure);">`
              : `<div style="width:44px; height:44px; border-radius:10px; background:rgba(255,107,0,0.1); color:var(--orange); display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:bold;"><i class="fas fa-store" style="margin-right:4px;"></i></div>`}
            <div style="flex:1;">
              <div style="font-weight:800; font-size:0.92rem; color:var(--texte); font-family:var(--police-titre);">${c.nom}</div>
              <div style="font-size:0.76rem; color:var(--texte-gris); margin-top:2px;">
                <i class="fas fa-map-marker-alt" style="color:var(--orange);"></i> ${c.adresse || 'Conakry, Guinée'}
              </div>
            </div>
            <i class="fas fa-chevron-right" style="color:var(--texte-clair); font-size:0.8rem;"></i>
          </div>
        `;
      }).join('');
    } else {
      conteneur.innerHTML = `
        <div style="text-align:center; padding:20px; color:var(--texte-gris); font-size:0.88rem;">
          <div style="font-size:1.8rem; margin-bottom:6px;"><i class="fas fa-store" style="margin-right:4px;"></i></div>
          Aucune boutique disponible pour le moment.
        </div>
      `;
    }
  } catch (err) {
    console.error('Erreur chargerBoutiquesNav:', err);
    conteneur.innerHTML = '<div style="color:red; font-size:0.82rem; padding:10px;">Erreur de chargement des boutiques.</div>';
  }
}
