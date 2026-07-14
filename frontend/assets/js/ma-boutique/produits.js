// ============================================================
// AdduGo — Produits Commerce
// ============================================================


const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── INIT UTILISATEUR & BOUTIQUE ──
// Les éléments du menu sont désormais gérés par navbar.js

async function initialiserBoutique() {
  try {
    const response = await apiFetch('/commerces/mes/commerces');
    const data = await response.json();
    if (data.success && data.commerces && data.commerces.length > 0) {
      const commerce = data.commerces[0];
      localStorage.setItem('addugo_commerce_id', commerce.id);
      if(document.getElementById('titre-bienvenue')) document.getElementById('titre-bienvenue').innerHTML = `Bonjour ${user.prenom} 👋, bienvenue sur <span class="orange">${commerce.nom}</span> `;
    } else {
      if(document.getElementById('titre-bienvenue')) {
        document.getElementById('titre-bienvenue').innerHTML = `Bonjour ${user.prenom} 👋, bienvenue dans votre Espace Vendeur !`;
        const sousTitre = document.getElementById('sous-titre-bienvenue');
        if(sousTitre) sousTitre.innerHTML = `Vous n'avez pas encore de boutique en ligne. <a href="#" class="lien-orange" id="creer-commerce" style="font-weight:700;">Cliquez ici pour créer votre commerce</a>.`;
      }
    }
  } catch (err) {
    console.error('Erreur chargement boutique:', err);
    if(document.getElementById('titre-bienvenue')) document.getElementById('titre-bienvenue').innerHTML = `Bonjour ${user.prenom} 👋, bienvenue dans vos <span class="orange">Produits</span>`;
  }
}
initialiserBoutique();

// ── UTILITAIRES ──
function formatPrix(montant) {
  return new Intl.NumberFormat('fr-GN').format(montant) + ' GNF';
}

function afficherAlerte(message, type = 'erreur') {
  document.getElementById('alerte-produit').innerHTML = `
    <div class="alerte alerte-${type}">
      <i class="fas fa-${type === 'erreur' ? 'exclamation-circle' : 'check-circle'}"></i>
      ${message}
    </div>`;
}

// ── VARIABLES ──
let commerceId   = localStorage.getItem('addugo_commerce_id');
let tousLesProduits = [];
let filtreActif  = 'tous';
let modeEdition  = false;

// ── CHARGER COMMERCE SI PAS EN CACHE ──
async function initCommerce() {
  if (!commerceId) {
    const res  = await apiFetch('/commerces/mes/commerces');
    const data = await res.json();
    if (data.success && data.commerces.length > 0) {
      commerceId = data.commerces[0].id;
      localStorage.setItem('addugo_commerce_id', commerceId);
    } else {
      document.getElementById('liste-produits').innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-store" style="margin-right:4px;"></i></div>
          <p>Créez d'abord votre commerce depuis le tableau de bord</p>
          <a href="dashboard.html" class="btn btn-orange mt-md">
            Aller au tableau de bord
          </a>
        </div>`;
      return;
    }
  }
  await chargerCategories();
  await chargerProduits();
}

// ── CHARGER CATÉGORIES ──
async function chargerCategories() {
  const res  = await apiFetch('/produits/categories');
  const data = await res.json();
  const sel  = document.getElementById('produit-categorie');

  if (data.success) {
    data.categories.forEach(c => {
      sel.innerHTML += `<option value="${c.id}">${c.nom}</option>`;
    });
  }
}

// ── CHARGER PRODUITS ──
async function chargerProduits() {
  try {
    const res  = await apiFetch(`/produits?commerce_id=${commerceId}`);
    const data = await res.json();

    tousLesProduits = data.produits || [];
    afficherProduits();
  } catch (err) {
    document.getElementById('liste-produits').innerHTML =
      '<div class="alerte alerte-erreur">Erreur de chargement.</div>';
  }
}

// ── AFFICHER PRODUITS ──
function afficherProduits() {
  const liste = document.getElementById('liste-produits');
  const recherche = (document.getElementById('recherche-produit')?.value || '').toLowerCase().trim();
  let produits = tousLesProduits;

  // Filtre disponibilité
  if (filtreActif === 'disponible')   produits = produits.filter(p => p.est_disponible == 1);
  if (filtreActif === 'indisponible') produits = produits.filter(p => p.est_disponible == 0);

  // Filtre recherche
  if (recherche) produits = produits.filter(p => p.nom.toLowerCase().includes(recherche));

  // Compteur de résultats
  const compteur = document.getElementById('compteur-produits');
  if (compteur) compteur.textContent = produits.length > 0 ? `${produits.length} produit${produits.length > 1 ? 's' : ''}` : '';

  if (produits.length === 0) {
    liste.innerHTML = `
      <div class="vide">
        <div class="vide-icone"><i class="fas fa-box" style="margin-right:4px;"></i></div>
        <p>${recherche ? `Aucun résultat pour "<strong>${recherche}</strong>"` : 'Aucun produit trouvé'}</p>
        ${!recherche ? `<button class="btn btn-orange mt-md" id="btn-vide-ajouter">Ajouter mon premier produit</button>` : ''}
      </div>`;
    document.getElementById('btn-vide-ajouter')?.addEventListener('click', ouvrirModalAjout);
    return;
  }

  liste.innerHTML = `
    <div class="grille-produits-commerce">
      ${produits.map(p => {
        // Image
        let imageUrl = 'https://placehold.co/400x300/e2e8f0/64748b?text=Produit';
        if (p.images) {
          let imgs = p.images;
          if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch(e) {} }
          if (Array.isArray(imgs) && imgs.length > 0) imageUrl = 'https://addugo.up.railway.app' + imgs[0];
        }

        // Badge stock
        const stock = Number(p.stock);
        let stockCouleur = '#22c55e'; // vert
        let stockLabel  = `En stock (${stock})`;
        if (stock === 0)      { stockCouleur = '#ef4444'; stockLabel = 'Rupture'; }
        else if (stock < 5)   { stockCouleur = '#f97316'; stockLabel = `Stock faible (${stock})`; }

        // Toggle disponibilité
        const estDispo = p.est_disponible == 1;
        const toggleChecked = estDispo ? 'checked' : '';
        const toggleLabel   = estDispo ? 'Disponible' : 'Indisponible';

        return `
        <div class="carte-produit-pro">
          <!-- Image -->
          <div class="carte-produit-image">
            <img src="${imageUrl}" alt="${p.nom}">
          </div>

          <!-- Infos -->
          <div class="carte-produit-infos">
            <h3 class="carte-produit-titre" title="${p.description || p.nom}">${p.description || p.nom}</h3>
            <div class="carte-produit-prix">${formatPrix(p.prix)}</div>

            <!-- Stock -->
            <div style="font-size:0.78rem; font-weight:600; color:${stockCouleur}; margin-bottom:4px;">
              <i class="fas fa-boxes" style="margin-right:4px;"></i>${stockLabel}
            </div>

            <div class="carte-produit-boutique">${p.categorie_nom}</div>

            <!-- Toggle disponibilité -->
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin: 8px 0 4px; font-size:0.8rem; color:var(--texte-gris);">
              <div class="toggle-switch" onclick="toggleDisponibilite(${p.id}, ${p.est_disponible})" style="
                width:38px; height:20px; border-radius:10px; position:relative; cursor:pointer;
                background: ${estDispo ? 'var(--orange)' : '#cbd5e1'};
                transition: background 0.25s;
              ">
                <div style="
                  position:absolute; top:3px; left:${estDispo ? '19px' : '3px'};
                  width:14px; height:14px; border-radius:50%; background:#fff;
                  transition: left 0.25s; box-shadow:0 1px 3px rgba(0,0,0,0.2);
                "></div>
              </div>
              <span>${toggleLabel}</span>
            </label>

            <!-- Actions -->
            <div class="carte-produit-actions">
              <button class="btn-carte btn-carte-principal" onclick="ouvrirModalEdition(${p.id})">
                <i class="fas fa-edit"></i> Modifier
              </button>
              <button class="btn-carte btn-carte-secondaire" onclick="supprimerProduit(${p.id})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ── FILTRES ──
document.querySelectorAll('.filtre-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('actif'));
    btn.classList.add('actif');
    filtreActif = btn.dataset.filtre;
    afficherProduits();
  });
});

// ── RECHERCHE EN TEMPS RÉEL ──
document.getElementById('recherche-produit')?.addEventListener('input', afficherProduits);

// ── TOGGLE DISPONIBILITÉ ──
async function toggleDisponibilite(produitId, statutActuel) {
  const nouveauStatut = statutActuel == 1 ? 0 : 1;
  try {
    const formData = new FormData();
    formData.append('est_disponible', nouveauStatut);
    const res  = await apiFetch(`/produits/${produitId}`, { method: 'PUT', body: formData });
    const data = await res.json();
    if (data.success) {
      // Mettre à jour localement sans recharger toute la liste
      const p = tousLesProduits.find(p => p.id === produitId);
      if (p) p.est_disponible = nouveauStatut;
      afficherProduits();
    }
  } catch (err) {
    console.error('Erreur toggleDisponibilite:', err);
  }
}

// ── MODAL ──
const modal = document.getElementById('modal-produit');

function ouvrirModalAjout() {
  modeEdition = false;
  document.getElementById('modal-titre').textContent = 'Ajouter un produit';
  document.getElementById('produit-id').value        = '';
  document.getElementById('produit-nom').value       = '';
  document.getElementById('produit-description').value = '';
  document.getElementById('produit-prix').value      = '';
  document.getElementById('produit-stock').value     = '';
  document.getElementById('produit-categorie').value = '';
  document.getElementById('produit-disponible').value = '1';
  document.getElementById('alerte-produit').innerHTML = '';
  // Réinitialiser l'aperçu
  const preview = document.getElementById('preview-image-produit');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  const nomFichier = document.getElementById('nom-fichier-image');
  if (nomFichier) nomFichier.textContent = 'Aucun fichier sélectionné';
  document.getElementById('produit-images').value = '';
  modal.classList.add('ouvert');
}

function ouvrirModalEdition(produitId) {
  const p = tousLesProduits.find(p => p.id === produitId);
  if (!p) return;

  modeEdition = true;
  document.getElementById('modal-titre').textContent   = 'Modifier le produit';
  document.getElementById('produit-id').value          = p.id;
  document.getElementById('produit-nom').value         = p.nom;
  document.getElementById('produit-description').value = p.description || '';
  document.getElementById('produit-prix').value        = p.prix;
  document.getElementById('produit-stock').value       = p.stock;
  document.getElementById('produit-categorie').value   = p.categorie_id;
  document.getElementById('produit-disponible').value  = p.est_disponible;
  document.getElementById('alerte-produit').innerHTML  = '';
  document.getElementById('produit-images').value = '';

  // Afficher l'image existante si disponible
  const preview = document.getElementById('preview-image-produit');
  const nomFichier = document.getElementById('nom-fichier-image');
  if (p.images) {
    let imgs = p.images;
    if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch(e) {} }
    if (Array.isArray(imgs) && imgs.length > 0) {
      preview.src = 'https://addugo.up.railway.app' + imgs[0];
      preview.style.display = 'block';
      if (nomFichier) nomFichier.textContent = 'Image actuelle (choisissez-en une autre pour la remplacer)';
    } else {
      preview.src = ''; preview.style.display = 'none';
      if (nomFichier) nomFichier.textContent = 'Aucun fichier sélectionné';
    }
  } else {
    preview.src = ''; preview.style.display = 'none';
    if (nomFichier) nomFichier.textContent = 'Aucun fichier sélectionné';
  }

  modal.classList.add('ouvert');
}

document.getElementById('btn-ajouter-produit').addEventListener('click', ouvrirModalAjout);
document.getElementById('modal-fermer').addEventListener('click',  () => modal.classList.remove('ouvert'));
document.getElementById('btn-annuler-produit').addEventListener('click', () => modal.classList.remove('ouvert'));

// ── APERÇU IMAGE EN TEMPS RÉEL ──
document.getElementById('produit-images').addEventListener('change', function() {
  const preview = document.getElementById('preview-image-produit');
  const nomFichier = document.getElementById('nom-fichier-image');
  if (this.files && this.files.length > 0) {
    const file = this.files[0];
    if (nomFichier) nomFichier.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// ── SAUVEGARDER PRODUIT ──
document.getElementById('btn-sauvegarder-produit').addEventListener('click', async () => {
  const nom          = document.getElementById('produit-nom').value.trim();
  const description  = document.getElementById('produit-description').value.trim();
  const prix         = document.getElementById('produit-prix').value;
  const stock        = document.getElementById('produit-stock').value;
  const categorie_id = document.getElementById('produit-categorie').value;
  const disponible   = document.getElementById('produit-disponible').value;
  const produitId    = document.getElementById('produit-id').value;
  const imagesInput  = document.getElementById('produit-images');

  if (!nom || !prix || !categorie_id) {
    afficherAlerte('Nom, prix et catégorie sont obligatoires.');
    return;
  }

  const formData = new FormData();
  formData.append('nom', nom);
  formData.append('description', description);
  formData.append('prix', Number(prix));
  formData.append('stock', Number(stock));
  formData.append('est_disponible', Number(disponible));
  
  if (!modeEdition) {
    formData.append('categorie_id', Number(categorie_id));
    formData.append('commerce_id', Number(commerceId));
  }

  if (imagesInput.files && imagesInput.files.length > 0) {
    for (let i = 0; i < imagesInput.files.length; i++) {
      formData.append('images', imagesInput.files[i]);
    }
  }

  try {
    let res, data;

    if (modeEdition && produitId) {
      res  = await apiFetch(`/produits/${produitId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      res  = await apiFetch('/produits', {
        method: 'POST',
        body: formData
      });
    }

    data = await res.json();

    if (data.success) {
      afficherAlerte(
        modeEdition ? 'Produit modifié !' : 'Produit ajouté !',
        'succes'
      );
      setTimeout(async () => {
        modal.classList.remove('ouvert');
        await chargerProduits();
      }, 1000);
    } else {
      afficherAlerte(data.message);
    }

  } catch (err) {
    afficherAlerte('Erreur serveur.');
  }
});

// ── SUPPRIMER PRODUIT ──
async function supprimerProduit(produitId) {
  if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

  try {
    const res  = await apiFetch(`/produits/${produitId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) await chargerProduits();
  } catch (err) {
    console.error('Erreur supprimerProduit:', err);
  }
}

// ── DÉCONNEXION ──
// Gérée par navbar.js sur le nouveau bouton btn-logout.

// ── INIT ──
initCommerce();
