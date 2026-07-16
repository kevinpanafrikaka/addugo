// ============================================================
// GESTION DU PANIER (LOCALSTORAGE & UI)
// ============================================================

// ── CLÉ DE STOCKAGE ISOLÉE PAR UTILISATEUR ──
// On inclut l'ID utilisateur dans la clé pour que chaque compte
// ait un panier totalement indépendant sur le même navigateur.
function getPanierKey() {
  const user = JSON.parse(localStorage.getItem('addugo_user') || 'null');
  const userId = user?.id || user?.utilisateur_id || 'guest';
  return `addugo_panier_${userId}`;
}

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
  const data = localStorage.getItem(getPanierKey());
  return data ? JSON.parse(data) : [];
}

function savePanier(panier) {
  localStorage.setItem(getPanierKey(), JSON.stringify(panier));
  renderPanierSidebar();
  updatePanierBadgeGlobal(); 
}


// ── OPERATIONS SUR LE PANIER ──
window.ajouterAuPanier = function(produitId, nom, prix, image, commerceId, nomBoutique, logoBoutique) {
  const panier = getPanier();
  const existingItem = panier.find(item => item.produit_id === produitId);

  if (existingItem) {
    existingItem.quantite += 1;
    // Mettre à jour le logo si on en a un
    if (logoBoutique) existingItem.logo_boutique = logoBoutique;
  } else {
    panier.push({
      produit_id: produitId,
      nom: nom,
      prix: Number(prix),
      image: image,
      quantite: 1,
      commerce_id: commerceId,
      nom_boutique: nomBoutique,
      logo_boutique: logoBoutique || null
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
  
  // Dispatche un événement pour les pages qui affichent le panier complet
  window.dispatchEvent(new Event('panier_updated'));
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
            <div style="font-size: 0.85rem; color: var(--orange); font-weight: bold; margin-top: 4px;">${item.prix.toLocaleString('fr-FR')}&nbsp;GNF</div>
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
          <span style="font-weight: 800; font-size: 1.1rem; color: var(--texte);">${boutique.total.toLocaleString('fr-FR')}&nbsp;GNF</span>
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

  // Inject or show modal
  let modal = document.getElementById('addugo-adresse-modal');
  if (!modal) {
    const modalHtml = `
      <div id="addugo-adresse-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;font-family:'Inter',sans-serif;">
        <div style="background:var(--blanc);border-radius:16px;width:100%;max-width:400px;padding:25px;box-shadow:0 10px 25px rgba(0,0,0,0.1);position:relative;">
          <button id="addugo-modal-close" style="position:absolute;top:15px;right:15px;background:none;border:none;font-size:1.5rem;color:var(--texte-gris);cursor:pointer;">&times;</button>
          
          <h3 style="margin-top:0;font-family:var(--police-titre);color:var(--texte);font-size:1.4rem;">Adresse de livraison</h3>
          <p style="color:var(--texte-gris);font-size:0.9rem;margin-bottom:20px;line-height:1.4;">Où souhaitez-vous être livré pour votre commande chez <b><span id="addugo-modal-boutique-nom"></span></b> ?</p>
          
          <div style="margin-bottom:15px;">
            <button id="addugo-modal-gps-btn" type="button" style="width:100%;border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px solid var(--orange);color:var(--orange);background:rgba(255,107,0,0.05);font-weight:700;font-size:0.95rem;cursor:pointer;transition:all 0.2s;">
              <i class="fas fa-map-marker-alt"></i> Utiliser ma position actuelle
            </button>
          </div>
          
          <div style="display:flex;align-items:center;margin:15px 0;color:var(--texte-clair);font-size:0.85rem;">
            <div style="flex:1;height:1px;background:var(--bordure);"></div>
            <span style="padding:0 10px;">OU</span>
            <div style="flex:1;height:1px;background:var(--bordure);"></div>
          </div>
          
          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:6px;color:var(--texte);">Votre adresse complète</label>
            <input type="text" id="addugo-modal-adresse-input" placeholder="Ex: Kaloum, Conakry" style="width:100%;padding:12px 15px;border:1px solid var(--bordure);border-radius:10px;font-family:inherit;font-size:0.95rem;outline:none;" />
          </div>
          
          <button id="addugo-modal-valider-btn" style="width:100%;border-radius:10px;padding:14px;font-weight:700;font-size:1rem;border:none;color:white;background:var(--orange);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;">
            <i class="fas fa-check"></i> Confirmer la commande
          </button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modal = document.getElementById('addugo-adresse-modal');
  }

  // Setup UI
  document.getElementById('addugo-modal-boutique-nom').textContent = nomBoutique;
  const adresseInput = document.getElementById('addugo-modal-adresse-input');
  adresseInput.value = user.adresse || "";
  
  modal.style.display = 'flex';
  
  return new Promise((resolve) => {
    const btnClose = document.getElementById('addugo-modal-close');
    const btnGps = document.getElementById('addugo-modal-gps-btn');
    const btnValider = document.getElementById('addugo-modal-valider-btn');
    
    // Nettoyage des anciens événements (clonage)
    const cloneClose = btnClose.cloneNode(true);
    btnClose.parentNode.replaceChild(cloneClose, btnClose);
    const cloneGps = btnGps.cloneNode(true);
    btnGps.parentNode.replaceChild(cloneGps, btnGps);
    const cloneValider = btnValider.cloneNode(true);
    btnValider.parentNode.replaceChild(cloneValider, btnValider);
    
    cloneClose.addEventListener('click', () => {
      modal.style.display = 'none';
      resolve(null);
    });
    
    cloneGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
        return;
      }
      
      cloneGps.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Géolocalisation en cours...';
      cloneGps.style.opacity = '0.7';
      cloneGps.disabled = true;
      
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          
          if (data && data.display_name) {
            let nomLieu = "";
            if (data.address.neighbourhood) nomLieu += data.address.neighbourhood + ", ";
            else if (data.address.suburb) nomLieu += data.address.suburb + ", ";
            else if (data.address.road) nomLieu += data.address.road + ", ";
            
            if (data.address.city) nomLieu += data.address.city;
            else if (data.address.town) nomLieu += data.address.town;
            else if (data.address.village) nomLieu += data.address.village;
            
            if (!nomLieu) nomLieu = data.display_name;
            
            adresseInput.value = nomLieu;
          } else {
            alert("Impossible de déterminer l'adresse avec précision.");
          }
        } catch (err) {
          console.error(err);
          alert("Erreur de connexion au service de carte.");
        } finally {
          cloneGps.innerHTML = '<i class="fas fa-map-marker-alt"></i> Utiliser ma position actuelle';
          cloneGps.style.opacity = '1';
          cloneGps.disabled = false;
        }
      }, (error) => {
        alert("Veuillez autoriser l'accès à votre position pour utiliser cette fonctionnalité.");
        cloneGps.innerHTML = '<i class="fas fa-map-marker-alt"></i> Utiliser ma position actuelle';
        cloneGps.style.opacity = '1';
        cloneGps.disabled = false;
      }, { enableHighAccuracy: true });
    });
    
    cloneValider.addEventListener('click', () => {
      const adresseSaisie = adresseInput.value.trim();
      if (!adresseSaisie) {
        alert("Veuillez renseigner votre adresse de livraison.");
        return;
      }
      
      cloneValider.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validation...';
      cloneValider.disabled = true;
      
      resolve(adresseSaisie);
    });
  }).then(async (adresseSaisie) => {
    // Reset valider button style after resolve
    const btnValider = document.getElementById('addugo-modal-valider-btn');
    if (btnValider) {
      btnValider.innerHTML = '<i class="fas fa-check"></i> Confirmer la commande';
      btnValider.disabled = false;
    }
    
    if (!adresseSaisie) return; // Annulé

    try {
      modal.style.display = 'none';

      const articlesToSend = articlesBoutique.map(a => ({
        produit_id: a.produit_id,
        quantite: a.quantite
      }));

      const res = await fetchApi('/commandes', {
        method: 'POST',
        body: JSON.stringify({
          commerce_id: commerceId,
          adresse_livraison: adresseSaisie,
          articles: articlesToSend
        })
      });

      const data = await res.json();

      if (data.success) {
        alert(`Commande validée avec succès chez ${nomBoutique} !`);
        
        const nouveauPanier = panier.filter(i => String(i.commerce_id) !== String(commerceId));
        savePanier(nouveauPanier);
        
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
  });
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
