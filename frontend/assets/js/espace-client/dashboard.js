// ============================================================
// AdduGo — Dashboard Client (Espace Client)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) {
  window.location.href = '../accueil/login.html';
}

// ── AFFICHAGE INFOS UTILISATEUR ──
function initUtilisateur() {
  const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();

  const elUserAvatar = document.getElementById('user-avatar');
  if (elUserAvatar) elUserAvatar.textContent = initiales;
  
  const elUserNom = document.getElementById('user-nom');
  if (elUserNom) elUserNom.textContent = `${user.prenom} ${user.nom}`;

  const elSidebarAvatar = document.getElementById('sidebar-avatar');
  if (elSidebarAvatar) elSidebarAvatar.textContent = initiales;

  const elSidebarNom = document.getElementById('sidebar-nom');
  if (elSidebarNom) elSidebarNom.textContent = `${user.prenom} ${user.nom}`;

  const elPrenom = document.getElementById('prenom-utilisateur');
  if (elPrenom) elPrenom.textContent = user.prenom || 'Client';
}

// ── FORMATAGE PRIX ──
function formatPrix(montant, devise = 'GNF') {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: 0
  }).format(montant);
}

// ── FORMATAGE DATE ──
function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));
}

// ── BADGE STATUT ──
function badgeStatut(statut) {
  const config = {
    'en_attente':     { classe: 'badge-avertissement', texte: '<i class="fas fa-hourglass-half"></i> En attente'    },
    'confirmee':      { classe: 'badge-info',          texte: '<i class="fas fa-check-circle"></i> Confirmée'      },
    'en_preparation': { classe: 'badge-bleu',          texte: '<i class="fas fa-wrench"></i> En préparation' },
    'prete':          { classe: 'badge-succes',        texte: '<i class="fas fa-box"></i> Prête'          },
    'en_livraison':   { classe: 'badge-orange',        texte: '<i class="fas fa-motorcycle"></i> En livraison'   },
    'livree':         { classe: 'badge-succes',        texte: '<i class="fas fa-check-circle"></i> Livrée'         },
    'annulee':        { classe: 'badge-erreur',        texte: '<i class="fas fa-times-circle"></i> Annulée'        }
  };
  const c = config[statut] || { classe: 'badge-info', texte: statut };
  return `<span class="badge ${c.classe}">${c.texte}</span>`;
}

// ── GESTION DE LA NAVBAR CONTEXTUELLE ──
function initialiserTroisiemeIconeNavbar(aUneBoutique, estLivreur) {
  const secondeIcone = document.getElementById('nav-seconde-icone');
  if (secondeIcone) {
    if (aUneBoutique) {
      secondeIcone.innerHTML = `
        <a href="../commerce/produits.html" class="nav-icone icone-produits" title="Ma Boutique">
          <i class="fas fa-store" style="color: #10B981;"></i>
        </a>
      `;
    } else if (estLivreur) {
      secondeIcone.innerHTML = `
        <a href="../livreur/dashboard.html" class="nav-icone" title="Mon Espace Livreur">
          <i class="fas fa-motorcycle" style="color: #1A1A2E;"></i>
        </a>
      `;
    } else {
      secondeIcone.innerHTML = '';
    }
  }
}

// ── CHARGER COMMANDES RÉCENTES ──
async function chargerCommandes() {
  const liste = document.getElementById('liste-commandes');
  if (!liste) return;

  try {
    const res  = await apiFetch('/commandes/mes-commandes');
    const data = await res.json();

    if (data.success) {
      const commandes = data.commandes || [];
      
      const elTotal = document.getElementById('stat-total-commandes');
      if (elTotal) elTotal.textContent = commandes.length;

      const elEnCours = document.getElementById('stat-en-cours');
      if (elEnCours) elEnCours.textContent =
        commandes.filter(c => ['en_attente','confirmee','en_preparation','prete','en_livraison'].includes(c.statut)).length;

      const elLivrees = document.getElementById('stat-livrees');
      if (elLivrees) elLivrees.textContent =
        commandes.filter(c => c.statut === 'livree').length;

      const elAnnulees = document.getElementById('stat-annulees');
      if (elAnnulees) elAnnulees.textContent =
        commandes.filter(c => c.statut === 'annulee').length;

      const recentes = commandes.slice(0, 5);

      if (recentes.length === 0) {
        liste.innerHTML = `
          <div class="vide" style="text-align:center; padding:30px 20px; background:var(--blanc); border-radius:14px; border:1px solid var(--bordure);">
            <div class="vide-icone" style="font-size:2.2rem; margin-bottom:10px;"><i class="fas fa-shopping-bag" style="margin-right:4px;"></i></div>
            <p style="color:var(--texte-gris); margin-bottom:12px;">Aucune commande pour l'instant</p>
            <a href="../home.html" class="btn btn-orange btn-sm" style="border-radius:10px; text-decoration:none; display:inline-block; font-weight:700; padding:8px 16px;">
              Passer une commande
            </a>
          </div>`;
        return;
      }

      liste.innerHTML = recentes.map(c => `
        <div class="commande-item" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:var(--blanc); border-radius:14px; border:1px solid var(--bordure); margin-bottom:10px;">
          <div class="commande-info" style="display:flex; align-items:center; gap:12px;">
            <div class="commande-icone" style="width:40px; height:40px; border-radius:10px; background:rgba(255,107,0,0.1); color:var(--orange); display:flex; align-items:center; justify-content:center; font-size:1.1rem;"><i class="fas fa-shopping-cart" style="margin-right:4px;"></i></div>
            <div>
              <div class="commande-nom" style="font-weight:700; font-family:var(--police-titre); font-size:0.95rem;">${c.commerce_nom || 'Boutique AdduGo'}</div>
              <div class="commande-date" style="font-size:0.78rem; color:var(--texte-clair);">${formatDate(c.date_creation)}</div>
            </div>
          </div>
          <div style="display:flex; gap:14px; align-items:center;">
            ${badgeStatut(c.statut)}
            <span class="commande-montant" style="font-weight:800; font-family:var(--police-titre); color:var(--orange); font-size:1.05rem;">${formatPrix(c.montant_total)}</span>
          </div>
        </div>`).join('');
    }

  } catch (err) {
    console.error("Erreur chargerCommandes:", err);
    if (liste) {
      liste.innerHTML = '<div class="alerte alerte-erreur" style="padding:15px; border-radius:10px;">Erreur lors du chargement des commandes.</div>';
    }
  }
}

// ── CHARGER BOUTIQUES RECOMMANDÉES (CONSERVÉ POUR RÉUTILISATION SEULEMENT) ──
async function chargerBoutiques() {
  const liste = document.getElementById('liste-boutiques');
  if (!liste) return;

  try {
    const res  = await apiFetch('/commerces');
    const data = await res.json();

    if (!data.success || !data.commerces || data.commerces.length === 0) {
      liste.innerHTML = `
        <div class="vide" style="text-align:center; padding:30px 20px; background:var(--blanc); border-radius:14px; border:1px solid var(--bordure);">
          <div class="vide-icone" style="font-size:2.2rem; margin-bottom:10px;"><i class="fas fa-store" style="margin-right:4px;"></i></div>
          <p style="color:var(--texte-gris);">Aucune boutique disponible pour l'instant</p>
        </div>`;
      return;
    }

    liste.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">
        ${data.commerces.map(c => {
          const logoUrl = c.logo 
            ? (c.logo.startsWith('http') ? c.logo : `https://addugo.up.railway.app${c.logo}`)
            : null;
          return `
          <div class="carte carte-orange" style="cursor:pointer; background:var(--blanc); border:1px solid var(--bordure); border-radius:16px; padding:18px; transition:transform 0.2s ease, box-shadow 0.2s ease;" onclick="window.location.href = '../mes-shoppings/home.html'">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
              ${logoUrl 
                ? `<img src="${logoUrl}" alt="${c.nom}" style="width:48px; height:48px; border-radius:10px; object-fit:cover; border:1px solid var(--bordure);">`
                : `<div style="width:48px; height:48px; border-radius:10px; background:rgba(255,107,0,0.1); color:var(--orange); display:flex; align-items:center; justify-content:center; font-size:1.4rem;"><i class="fas fa-store" style="margin-right:4px;"></i></div>`}
              <div>
                <h4 style="margin:0; font-family:var(--police-titre); font-weight:800; font-size:1rem;">${c.nom}</h4>
                <p style="font-size:0.78rem; color:var(--texte-gris); margin:2px 0 0 0;"><i class="fas fa-map-marker-alt" style="color:var(--orange);"></i> ${c.adresse || 'Conakry, Guinée'}</p>
              </div>
            </div>
            <p style="font-size:0.83rem; color:var(--texte-doux); margin:0; line-height:1.4;">${c.description || 'Boutique partenaire AdduGo'}</p>
          </div>`;
        }).join('')}
      </div>`;

  } catch (err) {
    console.error("Erreur chargerBoutiques:", err);
    if (liste) {
      liste.innerHTML = '<div class="alerte alerte-erreur" style="padding:15px; border-radius:10px;">Erreur lors du chargement des boutiques.</div>';
    }
  }
}

// ── GESTION ÉVOLUTION DU COMPTE (BOUTIQUE / LIVREUR) ──
async function initEvolution() {
  const sectionEvolution = document.getElementById('section-evolution');

  const roles = user.roles || ['client'];
  let commercesUtilisateur = [];

  try {
    const res = await apiFetch('/commerces/mes/commerces');
    if (res.ok) {
      const data = await res.json();
      if (data.success) commercesUtilisateur = data.commerces || [];
    }
  } catch (e) {
    console.warn("Impossible de récupérer les commerces de l'utilisateur", e);
  }

  const aUneBoutique = commercesUtilisateur.length > 0 || roles.includes('commerce');
  const estLivreur = roles.includes('livreur');

  // Mettre à jour la 3ème icône de la navbar selon le rôle/boutique de l'utilisateur
  initialiserTroisiemeIconeNavbar(aUneBoutique, estLivreur);

  if (!sectionEvolution) return;

  // CAS 1: L'utilisateur A une boutique -> afficher carte Boutique avec Logo + Nom + Modifier & Supprimer, MASQUER la carte Livreur
  if (aUneBoutique) {
    const b = commercesUtilisateur[0] || { id: null, nom: 'Ma Boutique', description: 'Votre boutique sur AdduGo' };
    const logoUrl = b.logo 
      ? (b.logo.startsWith('http') ? b.logo : `https://addugo.up.railway.app${b.logo}`)
      : null;

    sectionEvolution.innerHTML = `
      <div class="action-card" style="grid-column: 1 / -1; background:var(--blanc); border-radius:18px; border:1px solid var(--bordure); padding:20px 24px;">
        <div class="action-card-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:16px;">
            ${logoUrl 
              ? `<img src="${logoUrl}" alt="${b.nom}" style="width:60px; height:60px; border-radius:14px; object-fit:cover; border:2px solid var(--orange); box-shadow:0 4px 12px rgba(255,107,0,0.15); flex-shrink:0;">`
              : `<div style="width:60px; height:60px; border-radius:14px; background:rgba(255,107,0,0.1); color:var(--orange); display:flex; align-items:center; justify-content:center; font-size:1.6rem; border:1.5px solid rgba(255,107,0,0.2); flex-shrink:0;"><i class="fas fa-store"></i></div>`}
            <div>
              <h4 class="action-card-title" style="font-size:1.15rem; font-weight:800; font-family:var(--police-titre); margin:0;">${b.nom}</h4>
              <p class="action-card-desc" style="margin:4px 0 0 0; color:var(--texte-gris); font-size:0.88rem;">${b.description || 'Boutique active sur AdduGo'}</p>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <a href="../commerce/produits.html" class="btn btn-noir btn-sm" style="border-radius:10px; text-decoration:none; padding:10px 16px; font-weight:700; background:var(--noir, #1A1A2E); color:#FFFFFF; box-shadow:0 4px 14px rgba(26,26,46,0.22); transition:transform 0.2s ease;">
              <i class="fas fa-external-link-alt" style="color:var(--orange);"></i> Accéder à ma boutique
            </a>
            <button class="btn btn-contour-orange btn-sm" onclick="modifierBoutique(${b.id}, '${(b.nom || '').replace(/'/g, "\\'")}', '${(b.description || '').replace(/'/g, "\\'")}', '${b.logo || ''}')" style="border-radius:10px; padding:10px 16px;">
              <i class="fas fa-edit"></i> Modifier
            </button>
            <button class="btn btn-sm" onclick="supprimerBoutique(${b.id})" style="border-radius:10px; padding:10px 16px; background:rgba(239,68,68,0.1); color:#EF4444; border:1px solid rgba(239,68,68,0.2);">
              <i class="fas fa-trash"></i> Supprimer
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // CAS 2: L'utilisateur est Livreur (et n'a pas de boutique) -> carte Livreur transformée avec sa photo/initiales + nom + Modifier & Supprimer
  if (estLivreur) {
    let photoProfil = user.photo_profil;
    try {
      const resProfil = await apiFetch('/utilisateurs/profil');
      if (resProfil.ok) {
        const dataProfil = await resProfil.json();
        if (dataProfil.success && dataProfil.utilisateur) {
          Object.assign(user, dataProfil.utilisateur);
          localStorage.setItem('addugo_user', JSON.stringify(user));
          photoProfil = dataProfil.utilisateur.photo_profil;
        }
      }
    } catch (e) {
      console.warn("Impossible de rafraîchir le profil livreur", e);
    }

    let avatarUrl = null;
    if (photoProfil && !photoProfil.includes('default-avatar.png')) {
      avatarUrl = photoProfil.startsWith('http')
        ? photoProfil
        : `https://addugo.up.railway.app${photoProfil.startsWith('/') ? '' : '/'}${photoProfil}`;
    }
    const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();

    const titreLivreur = user.genre === 'F' ? 'Livreuse' : 'Livreur';

    sectionEvolution.innerHTML = `
      <div class="action-card" style="grid-column: 1 / -1; background:var(--blanc); border-radius:18px; border:1px solid var(--bordure); padding:20px 24px;">
        <div class="action-card-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:16px;">
            ${avatarUrl 
              ? `<img src="${avatarUrl}" alt="${user.prenom}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--orange); box-shadow:0 4px 12px rgba(255,96,0,0.18); flex-shrink:0;">`
              : `<div style="width:60px; height:60px; border-radius:50%; background:#FFF3EE; color:var(--orange); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.4rem; border:2px solid var(--orange); flex-shrink:0;">${initiales}</div>`}
            <div>
              <h4 class="action-card-title" style="font-size:1.15rem; font-weight:800; font-family:var(--police-titre); margin:0;">${user.prenom} ${user.nom}</h4>
              <p class="action-card-desc" style="margin:4px 0 0 0; color:var(--orange); font-weight:600; font-size:0.88rem;"><i class="fas fa-motorcycle"></i> ${titreLivreur} AdduGo • ${user.type_vehicule || 'Moto'}</p>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <a href="../livreur/dashboard.html" class="btn btn-noir btn-sm" style="background:var(--noir, #1A1A2E); color:white; border-radius:10px; text-decoration:none; padding:10px 16px; font-weight:700; box-shadow:0 4px 14px rgba(26,26,46,0.22); transition:transform 0.2s ease;">
              <i class="fas fa-external-link-alt" style="color:var(--orange);"></i> Accéder à Mon Espace Livreur
            </a>
            <button class="btn btn-sm" onclick="modifierLivreur()" style="border-radius:10px; padding:10px 16px; color:#1A1A2E; border:1px solid #1A1A2E; background:transparent; font-weight:700;">
              <i class="fas fa-edit"></i> Modifier
            </button>
            <button class="btn btn-sm" onclick="supprimerLivreur()" style="border-radius:10px; padding:10px 16px; background:rgba(239,68,68,0.1); color:#EF4444; border:1px solid rgba(239,68,68,0.2);">
              <i class="fas fa-trash"></i> Supprimer
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // CAS 3: Utilisateur Client basique -> propose "Créer ma boutique" et "Devenir Livreur (Moto requise)"
  sectionEvolution.innerHTML = `
    <div class="action-card">
      <div>
        <div class="action-card-header">
          <div class="action-card-icon icon-orange">
            <i class="fas fa-store"></i>
          </div>
          <h4 class="action-card-title">Vous avez une boutique ?</h4>
        </div>
        <p class="action-card-desc">Créez votre vitrine numérique et commencez à vendre vos produits sur AdduGo.</p>
      </div>
      <button class="btn btn-contour-orange btn-sm" onclick="devenir('commerce')" style="align-self: flex-start; border-radius: 10px;">
        Créer ma boutique
      </button>
    </div>

    <div class="action-card">
      <div>
        <div class="action-card-header">
          <div class="action-card-icon icon-blue">
            <i class="fas fa-motorcycle"></i>
          </div>
          <h4 class="action-card-title">Vous avez un moyen de transport (Moto) ?</h4>
        </div>
        <p class="action-card-desc">Devenez coursier partenaire et gagnez des revenus en effectuant des livraisons rapides.</p>
      </div>
      <button class="btn btn-contour btn-sm" onclick="devenir('livreur')" style="color:var(--bleu); border-color:var(--bleu); align-self: flex-start; border-radius: 10px;">
        Devenir Livreur
      </button>
    </div>
  `;
}

// ── ACTIONS SUR BOUTIQUE ET LIVREUR ──
window.modifierBoutique = (id, nom, description, logo) => {
  const elId = document.getElementById('boutique-id-edit');
  const elNom = document.getElementById('boutique-nom-edit');
  const elCat = document.getElementById('boutique-categorie-edit');
  const elDesc = document.getElementById('boutique-description-edit');
  const modal = document.getElementById('modal-edit-boutique');
  const preview = document.getElementById('preview-logo-edit');

  if (elId) elId.value = id || '';
  if (elNom) elNom.value = nom || '';

  let catVal = 'Électroniques';
  let descVal = description || '';
  if (description && description.includes(' — ')) {
    const parts = description.split(' — ');
    catVal = parts[0] || catVal;
    descVal = parts.slice(1).join(' — ');
  } else if (description && description.startsWith('Catégorie(s) : ')) {
    descVal = description.replace('Catégorie(s) : ', '');
  }

  if (elCat) elCat.value = catVal;
  if (elDesc) elDesc.value = descVal;

  if (preview && logo) {
    preview.src = logo.startsWith('http') ? logo : `https://addugo.up.railway.app${logo}`;
    preview.style.display = 'block';
  } else if (preview) {
    preview.style.display = 'none';
  }

  if (modal) modal.style.display = 'block';
};

window.supprimerBoutique = async (id) => {
  if (!confirm("Voulez-vous vraiment supprimer votre boutique ? Cette action est irréversible.")) return;
  try {
    const res = await apiFetch(`/commerces/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert("Votre boutique a été supprimée.");
      if (user.roles) {
        user.roles = user.roles.filter(r => r !== 'commerce');
        localStorage.setItem('addugo_user', JSON.stringify(user));
      }
      window.location.reload();
    } else {
      alert(data.message || "Erreur lors de la suppression.");
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau.");
  }
};

window.modifierLivreur = () => {
  const modal = document.getElementById('modal-edit-livreur');
  if (!modal) return;

  const elPrenom = document.getElementById('livreur-prenom-edit');
  const elNom = document.getElementById('livreur-nom-edit');
  const elTel = document.getElementById('livreur-telephone-edit');
  const elAdr = document.getElementById('livreur-adresse-edit');
  const elVehicule = document.getElementById('livreur-vehicule-edit');

  if (elPrenom) elPrenom.value = user.prenom || '';
  if (elNom) elNom.value = user.nom || '';
  if (elTel) elTel.value = user.telephone || '';
  if (elAdr) elAdr.value = user.adresse || '';

  // Sélection du genre
  const elGenre = document.getElementById('livreur-genre-edit');
  const genreVal = user.genre || 'M';
  if (elGenre) elGenre.value = genreVal;

  document.querySelectorAll('.genre-btn-card').forEach(card => {
    if (card.getAttribute('data-genre') === genreVal) {
      card.classList.add('actif');
      card.style.border = '2px solid var(--orange)';
      card.style.background = '#FFF3EE';
      card.style.color = 'var(--orange)';
      card.style.fontWeight = '700';
    } else {
      card.classList.remove('actif');
      card.style.border = '1.5px solid #E5E7EB';
      card.style.background = '#FAFAFA';
      card.style.color = '#4B5563';
      card.style.fontWeight = '600';
    }
  });

  // Sélection du véhicule
  const vehiculeVal = user.type_vehicule || 'Moto';
  if (elVehicule) elVehicule.value = vehiculeVal;

  // Mise à jour visuelle des cartes de véhicules
  document.querySelectorAll('.vehicule-btn-card').forEach(card => {
    if (card.getAttribute('data-val') === vehiculeVal) {
      card.classList.add('actif');
      card.style.border = '2px solid var(--orange)';
      card.style.background = '#FFF3EE';
      card.style.color = 'var(--orange)';
      card.style.fontWeight = '700';
    } else {
      card.classList.remove('actif');
      card.style.border = '1.5px solid #E5E7EB';
      card.style.background = '#FAFAFA';
      card.style.color = '#4B5563';
      card.style.fontWeight = '600';
    }
  });

  // Gestion d'aperçu d'avatar
  const initialesEl = document.getElementById('initiales-avatar-livreur');
  const imgEl = document.getElementById('img-preview-livreur');

  if (initialesEl) {
    initialesEl.textContent = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();
  }

  if (user.photo_profil && !user.photo_profil.includes('default-avatar.png')) {
    if (imgEl) {
      imgEl.src = user.photo_profil.startsWith('http') ? user.photo_profil : `https://addugo.up.railway.app${user.photo_profil}`;
      imgEl.style.display = 'block';
    }
    if (initialesEl) initialesEl.style.display = 'none';
  } else {
    if (imgEl) imgEl.style.display = 'none';
    if (initialesEl) initialesEl.style.display = 'inline';
  }

  modal.style.display = 'block';
};

window.supprimerLivreur = async () => {
  if (!confirm("Voulez-vous vraiment désactiver votre Espace Livreur ?")) return;
  try {
    const res = await apiFetch('/utilisateurs/role', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'livreur' })
    });
    const data = await res.json();
    if (data.success) {
      alert("Votre espace Livreur a été désactivé.");
      if (user.roles) {
        user.roles = user.roles.filter(r => r !== 'livreur');
        localStorage.setItem('addugo_user', JSON.stringify(user));
      }
      window.location.reload();
    } else {
      alert(data.message || "Erreur lors de la désactivation.");
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau.");
  }
};

window.devenir = async (nouveauRole) => {
  if (nouveauRole === 'commerce') {
    const modal = document.getElementById('modal-boutique');
    if (modal) modal.style.display = 'block';
    return;
  }

  if (!confirm(`Souhaitez-vous vraiment activer votre Espace Livreur (Moto) ?`)) {
    return;
  }
  
  try {
    const res = await apiFetch('/utilisateurs/role', {
      method: 'POST',
      body: JSON.stringify({ role: nouveauRole })
    });
    const data = await res.json();
    
    if (data.success) {
      alert(`Félicitations ! Votre espace Livreur est maintenant actif. Veuillez vous reconnecter pour rafraîchir l'application.`);
      seDeconnecter();
    } else {
      alert(data.message || 'Erreur lors de la mise à jour de votre compte.');
    }
  } catch (err) {
    alert('Erreur réseau.');
  }
};

// ── GESTION DES MODALES ET APERÇUS D'IMAGES ──
const modalBoutique = document.getElementById('modal-boutique');
const modalEditBoutique = document.getElementById('modal-edit-boutique');

const inputLogoCreation = document.getElementById('boutique-logo');
const previewLogoCreation = document.getElementById('preview-logo-creation');
const nomFichierCreation = document.getElementById('nom-fichier-creation');

if (inputLogoCreation) {
  inputLogoCreation.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (nomFichierCreation) nomFichierCreation.textContent = file.name;
      if (previewLogoCreation) {
        previewLogoCreation.src = URL.createObjectURL(file);
        previewLogoCreation.style.display = 'block';
      }
    }
  });
}

const inputLogoEdit = document.getElementById('boutique-logo-edit');
const previewLogoEdit = document.getElementById('preview-logo-edit');
const nomFichierEdit = document.getElementById('nom-fichier-edit');

if (inputLogoEdit) {
  inputLogoEdit.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (nomFichierEdit) nomFichierEdit.textContent = file.name;
      if (previewLogoEdit) {
        previewLogoEdit.src = URL.createObjectURL(file);
        previewLogoEdit.style.display = 'block';
      }
    }
  });
}

const inputPhotoLivreur = document.getElementById('livreur-photo-input');
if (inputPhotoLivreur) {
  inputPhotoLivreur.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imgEl = document.getElementById('img-preview-livreur');
      const initialesEl = document.getElementById('initiales-avatar-livreur');
      if (imgEl) {
        imgEl.src = URL.createObjectURL(file);
        imgEl.style.display = 'block';
      }
      if (initialesEl) initialesEl.style.display = 'none';
    }
  });
}

document.addEventListener('click', (e) => {
  const genreCard = e.target.closest('.genre-btn-card');
  if (genreCard) {
    const val = genreCard.getAttribute('data-genre');
    const inputHidden = document.getElementById('livreur-genre-edit');
    if (inputHidden) inputHidden.value = val;

    document.querySelectorAll('.genre-btn-card').forEach(c => {
      c.classList.remove('actif');
      c.style.border = '1.5px solid #E5E7EB';
      c.style.background = '#FAFAFA';
      c.style.color = '#4B5563';
      c.style.fontWeight = '600';
    });

    genreCard.classList.add('actif');
    genreCard.style.border = '2px solid var(--orange)';
    genreCard.style.background = '#FFF3EE';
    genreCard.style.color = 'var(--orange)';
    genreCard.style.fontWeight = '700';
  }

  const card = e.target.closest('.vehicule-btn-card');
  if (card) {
    const val = card.getAttribute('data-val');
    const inputHidden = document.getElementById('livreur-vehicule-edit');
    if (inputHidden) inputHidden.value = val;

    document.querySelectorAll('.vehicule-btn-card').forEach(c => {
      c.classList.remove('actif');
      c.style.border = '1.5px solid #E5E7EB';
      c.style.background = '#FAFAFA';
      c.style.color = '#4B5563';
      c.style.fontWeight = '600';
    });

    card.classList.add('actif');
    card.style.border = '2px solid var(--orange)';
    card.style.background = '#FFF3EE';
    card.style.color = 'var(--orange)';
    card.style.fontWeight = '700';
  }
});

document.getElementById('btn-fermer-modal-boutique')?.addEventListener('click', () => {
  if (modalBoutique) modalBoutique.style.display = 'none';
});

document.getElementById('btn-annuler-creation')?.addEventListener('click', () => {
  if (modalBoutique) modalBoutique.style.display = 'none';
});

document.getElementById('btn-fermer-modal-edit-boutique')?.addEventListener('click', () => {
  if (modalEditBoutique) modalEditBoutique.style.display = 'none';
});

const modalEditLivreur = document.getElementById('modal-edit-livreur');

document.getElementById('btn-fermer-modal-edit-livreur')?.addEventListener('click', () => {
  if (modalEditLivreur) modalEditLivreur.style.display = 'none';
});

document.getElementById('btn-annuler-edit-livreur')?.addEventListener('click', () => {
  if (modalEditLivreur) modalEditLivreur.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modalBoutique) modalBoutique.style.display = 'none';
  if (e.target === modalEditBoutique) modalEditBoutique.style.display = 'none';
  if (e.target === modalEditLivreur) modalEditLivreur.style.display = 'none';
});

// Submit Modification Espace Livreur
document.getElementById('form-edit-livreur')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const prenom = document.getElementById('livreur-prenom-edit')?.value.trim();
  const nom = document.getElementById('livreur-nom-edit')?.value.trim();
  const genre = document.getElementById('livreur-genre-edit')?.value || 'M';
  const telephone = document.getElementById('livreur-telephone-edit')?.value.trim();
  const adresse = document.getElementById('livreur-adresse-edit')?.value.trim();

  const btnSubmit = document.getElementById('btn-submit-edit-livreur');
  const originalHtml = btnSubmit ? btnSubmit.innerHTML : 'Enregistrer';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Enregistrement...`;
  }

  try {
    const res = await apiFetch('/utilisateurs/profil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prenom, nom, genre, telephone, adresse })
    });
    const data = await res.json();

    if (data.success) {
      alert("Vos informations d'Espace Livreur ont été mises à jour avec succès !");
      if (data.utilisateur) {
        localStorage.setItem('addugo_user', JSON.stringify(data.utilisateur));
      }
      window.location.reload();
    } else {
      alert(data.message || "Erreur lors de la mise à jour.");
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalHtml;
      }
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau lors de la mise à jour.");
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalHtml;
    }
  }
});

// Submit Création Boutique (Logo, Nom, Catégorie, Description)
document.getElementById('form-creation-boutique')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nom = document.getElementById('boutique-nom')?.value;
  const categorie = document.getElementById('boutique-categorie')?.value;
  const description = document.getElementById('boutique-description')?.value;
  const logoFile = document.getElementById('boutique-logo')?.files?.[0];
  
  if (!nom || !categorie || !logoFile) {
    alert("Veuillez remplir tous les champs obligatoires (Logo, Nom, Catégorie).");
    return;
  }

  const btn = document.getElementById('btn-submit-boutique');
  const originalHtml = btn ? btn.innerHTML : 'Créer';
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    btn.disabled = true;
  }

  const formData = new FormData();
  formData.append('nom', nom);
  const fullDesc = description ? `${categorie} — ${description}` : categorie;
  formData.append('description', fullDesc);
  formData.append('logo', logoFile);

  try {
    const res = await apiFetch('/commerces', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      alert('Félicitations ! Votre boutique a été créée. L\'application va se rafraîchir.');
      window.location.reload();
    } else {
      alert(data.message || 'Erreur lors de la création de la boutique.');
      if (btn) {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    }
  } catch (err) {
    alert('Erreur réseau.');
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }
});

// Submit Modification Boutique (Logo optionnel, Nom, Catégorie, Description)
document.getElementById('form-edit-boutique')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('boutique-id-edit')?.value;
  const nom = document.getElementById('boutique-nom-edit')?.value;
  const categorie = document.getElementById('boutique-categorie-edit')?.value;
  const description = document.getElementById('boutique-description-edit')?.value;
  const logoFile = document.getElementById('boutique-logo-edit')?.files?.[0];

  if (!id || !nom || !categorie) {
    alert("Veuillez remplir les champs obligatoires (Nom et Catégorie).");
    return;
  }

  const btn = document.getElementById('btn-submit-edit-boutique');
  const originalHtml = btn ? btn.innerHTML : 'Enregistrer';
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
    btn.disabled = true;
  }

  const formData = new FormData();
  formData.append('nom', nom);
  const fullDesc = description ? `${categorie} — ${description}` : categorie;
  formData.append('description', fullDesc);
  if (logoFile) {
    formData.append('logo', logoFile);
  }

  try {
    const res = await apiFetch(`/commerces/${id}`, {
      method: 'PUT',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      alert("Boutique mise à jour avec succès !");
      if (modalEditBoutique) modalEditBoutique.style.display = 'none';
      window.location.reload();
    } else {
      alert(data.message || "Erreur de mise à jour.");
      if (btn) {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    }
  } catch (err) {
    alert("Erreur réseau.");
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }
});


// ── DÉCONNEXION SÉCURISÉE ──
document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── INITIALISATION COMPLÈTE ──
initUtilisateur();
initEvolution();
chargerCommandes();
