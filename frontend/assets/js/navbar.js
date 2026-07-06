document.addEventListener('DOMContentLoaded', async () => {
  verifierAuthentification();
  await initialiserNavbar();

  document.querySelectorAll('#btn-logout, #btn-deconnexion, .btn-deconnexion, .btn-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      seDeconnecter();
    });
  });

  // Mobile menu / profil dropdown toggle
  document.querySelectorAll('#btn-mobile-menu-home, #mobile-top-avatar, .btn-mobile-menu').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const profilDropdown = document.getElementById('profil-dropdown');
      const categoriesDropdown = document.getElementById('categories-dropdown');
      const sidebar = document.querySelector('.sidebar');

      if (profilDropdown) {
        profilDropdown.classList.toggle('actif');
      } else if (categoriesDropdown) {
        categoriesDropdown.classList.toggle('actif');
      } else if (sidebar) {
        sidebar.classList.toggle('mobile-active');
      }
    });
  });

  // Fonction utilitaire pour gérer le hover intelligent + clic sur les dropdowns
  function setupSmartDropdown(btnId, dropdownId) {
    const btn = document.getElementById(btnId);
    const dropdown = document.getElementById(dropdownId);
    const wrapper = btn ? btn.closest('.icon-wrapper') || btn.parentElement : null;
    let timeoutId;

    if (!btn || !dropdown) return;

    btn.addEventListener('click', (e) => {
      if (e.target.closest('a') && e.target.closest('a').href !== '#' && e.target.closest('a').href !== window.location.href) return;
      dropdown.classList.toggle('actif');
    });

    document.addEventListener('click', (e) => {
      const isMobileAvatar = e.target.closest('#btn-mobile-menu-home') || e.target.closest('#mobile-top-avatar') || e.target.closest('.btn-mobile-menu');
      const isClickInside = (wrapper && wrapper.contains(e.target)) || btn.contains(e.target) || dropdown.contains(e.target) || isMobileAvatar;
      if (!isClickInside) {
        dropdown.classList.remove('actif');
      }
    });

    const hoverArea = wrapper || btn;
    
    hoverArea.addEventListener('mouseenter', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dropdown.classList.add('actif');
      }, 150);
    });

    hoverArea.addEventListener('mouseleave', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dropdown.classList.remove('actif');
      }, 250);
    });

    dropdown.addEventListener('mouseenter', () => {
      clearTimeout(timeoutId);
    });

    dropdown.addEventListener('mouseleave', () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        dropdown.classList.remove('actif');
      }, 250);
    });
  }

  setupSmartDropdown('btn-profil-toggle', 'profil-dropdown');
  setupSmartDropdown('btn-boutiques-toggle', 'boutiques-dropdown');
  setupSmartDropdown('btn-categories-toggle', 'categories-dropdown');
  setupSmartDropdown('btn-infos-toggle', 'infos-dropdown');
  setupSmartDropdown('btn-aide-toggle', 'aide-dropdown');
  setupSmartDropdown('btn-messages-toggle', 'messages-dropdown');

  // ==== GESTION DU PANIER (SIDEBAR) ====
  const btnPanierToggle = document.getElementById('btn-panier-toggle');
  const btnFermerPanier = document.getElementById('btn-fermer-panier');
  const panierSidebar = document.getElementById('panier-sidebar');
  const panierOverlay = document.getElementById('panier-overlay');

  if (btnPanierToggle && panierSidebar && panierOverlay) {
    btnPanierToggle.addEventListener('click', (e) => {
      e.preventDefault();
      panierSidebar.classList.add('ouvert');
      panierOverlay.classList.add('ouvert');
      document.body.style.overflow = 'hidden';
    });

    if (btnFermerPanier) {
      btnFermerPanier.addEventListener('click', () => fermerPanier());
    }

    panierOverlay.addEventListener('click', () => fermerPanier());
  }

  function fermerPanier() {
    if (panierSidebar) panierSidebar.classList.remove('ouvert');
    if (panierOverlay) panierOverlay.classList.remove('ouvert');
    document.body.style.overflow = '';
  }

  // ==== GESTION DE LA RECHERCHE ====
  const searchInput = document.getElementById('navbar-search-input');
  const searchBtn = document.getElementById('navbar-search-btn');

  function lancerRecherche() {
    if (!searchInput) return;
    const query = searchInput.value.trim();
    if (query.length > 0) {
      window.location.href = `recherche.html?q=${encodeURIComponent(query)}`;
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', lancerRecherche);
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        lancerRecherche();
      }
    });
  }
});

function verifierAuthentification() {
  const token = localStorage.getItem('addugo_token');
  if (!token) {
    window.location.href = 'login.html';
  }
}

async function initialiserNavbar() {
  try {
    const res = await apiFetch('/utilisateurs/profil');
    if (!res.ok) throw new Error('Erreur récupération profil');
    const data = await res.json();
    const user = data.utilisateur;

    const messageBienvenue = document.getElementById('message-bienvenue');
    if(messageBienvenue) messageBienvenue.innerHTML = `Bienvenue sur AdduGo, <span style="color: var(--orange);">${user.prenom}</span>`;
    
    const dropdownNom = document.getElementById('dropdown-nom');
    if(dropdownNom) dropdownNom.textContent = `${user.prenom} ${user.nom}`;
    
    const dropdownAvatar = document.getElementById('dropdown-avatar');
    const topAvatar = document.getElementById('navbar-top-avatar');
    const mobileTopAvatar = document.getElementById('mobile-top-avatar');

    if (user.photo_profil && !user.photo_profil.includes('default-avatar.png')) {
      const fullUrl = user.photo_profil.startsWith('http')
        ? user.photo_profil
        : `https://addugo.up.railway.app${user.photo_profil.startsWith('/') ? '' : '/'}${user.photo_profil}`;

      if(dropdownAvatar) dropdownAvatar.src = fullUrl;
      if(topAvatar) topAvatar.src = fullUrl;
      if(mobileTopAvatar) mobileTopAvatar.src = fullUrl;
    } else {
      const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();
      if(dropdownAvatar) {
        dropdownAvatar.outerHTML = `<div class="dropdown-avatar" id="dropdown-avatar" style="background:var(--orange); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.5rem;">${initiales}</div>`;
      }
      if(topAvatar) {
        topAvatar.outerHTML = `<div id="navbar-top-avatar" style="width:100%; height:100%; background:var(--orange); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1rem;">${initiales}</div>`;
      }
      if(mobileTopAvatar) {
        mobileTopAvatar.outerHTML = `<div id="mobile-top-avatar" style="width:100%; height:100%; background:var(--orange); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.1rem;">${initiales}</div>`;
      }
    }

    const isFemme = user.genre === 'F';
    const roles = user.roles || ['client'];
    const rolesAffiches = [];
    if (roles.includes('admin')) rolesAffiches.push('Admin');
    if (roles.includes('client') || (!roles.includes('admin'))) rolesAffiches.push(isFemme ? 'Cliente' : 'Client');
    if (roles.includes('livreur')) rolesAffiches.push(isFemme ? 'Livreuse' : 'Livreur');
    if (roles.includes('commerce')) rolesAffiches.push(isFemme ? 'Commerçante' : 'Commerçant');
    
    const dropdownRoles = document.getElementById('dropdown-roles-badges');
    if(dropdownRoles) dropdownRoles.textContent = rolesAffiches.join(' | ');

    // ── HARMONISATION UNIFIÉE DU MENU DÉROULANT PROFIL ──
    const dropdownMenu = document.querySelector('.dropdown-menu-container');
    if (dropdownMenu) {
      const isCommercePage = window.location.pathname.includes('/commerce/');
      const isLivreurPage = window.location.pathname.includes('/livreur/');
      const isClientPage = window.location.pathname.includes('/client/');

      let basePath = '';
      if (isCommercePage || isLivreurPage || isClientPage) {
        basePath = '../';
      }

      const isProfilPage = window.location.pathname.endsWith('profil.html');
      const isHomePage = window.location.pathname.endsWith('home.html');
      const isClientDash = window.location.pathname.endsWith('client/dashboard.html');
      const isLivreurDash = window.location.pathname.endsWith('livreur/dashboard.html');
      const isCommerceDash = window.location.pathname.endsWith('commerce/produits.html');

      let menuHTML = `
        <a href="${basePath}client/profil.html" class="sidebar-lien ${isProfilPage ? 'actif' : ''}" style="margin-top:6px;">
          <i class="fas fa-user" ${isProfilPage ? 'style="color:var(--orange);"' : ''}></i> Mon Profil
        </a>
        <a href="${basePath}home.html" class="sidebar-lien ${isHomePage ? 'actif' : ''}">
          <i class="fas fa-home"></i> Home
        </a>
        <a href="${basePath}client/dashboard.html" class="sidebar-lien ${isClientDash ? 'actif' : ''}">
          <i class="fas fa-user-circle"></i> Mon Espace Client
        </a>
      `;

      if (roles.includes('livreur') || isLivreurPage) {
        menuHTML += `
          <a href="${basePath}livreur/dashboard.html" class="sidebar-lien ${isLivreurDash ? 'actif' : ''}">
            <i class="fas fa-motorcycle"></i> Mon Espace Livreur
          </a>
        `;
      }

      if (roles.includes('commerce') || isCommercePage) {
        menuHTML += `
          <a href="${basePath}commerce/produits.html" class="sidebar-lien ${isCommerceDash ? 'actif' : ''}">
            <i class="fas fa-store"></i> Ma Boutique
          </a>
        `;
      }

      if (roles.includes('admin')) {
        menuHTML += `
          <a href="${basePath}admin/dashboard.html" class="sidebar-lien">
            <i class="fas fa-shield-alt"></i> Espace Admin
          </a>
        `;
      }

      menuHTML += `
        <div style="border-top:1px solid var(--bordure);margin-top:6px;padding-top:6px;">
          <a href="#" class="sidebar-lien btn-deconnexion" id="btn-logout" style="color:#dc3545;">
            <i class="fas fa-sign-out-alt"></i> Se déconnecter
          </a>
        </div>
      `;

      dropdownMenu.innerHTML = menuHTML;

      // Re-bind logout listener
      const btnLogout = dropdownMenu.querySelector('.btn-deconnexion');
      if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
          e.preventDefault();
          seDeconnecter();
        });
      }
    }

    // ── GESTION DE LA 1ÈRE ICÔNE NAVBAR (TOUJOURS ACCUEIL) ──
    const premiereIcone = document.getElementById('nav-premiere-icone');
    if (premiereIcone) {
      const isClientPage = window.location.pathname.includes('/client/');
      const basePath = isClientPage ? '../' : '';
      premiereIcone.outerHTML = `
        <a href="${basePath}home.html" class="nav-icone icone-accueil" title="Accueil" id="nav-premiere-icone">
          <i class="fas fa-house-user" style="color: #0D9488;"></i>
        </a>
      `;
    }

    // ── GESTION DU BADGE ET DU DROPDOWN DES MESSAGES ──
    async function updateUnreadMessagesBadge() {
      try {
        const msgRes = await apiFetch('/messages/conversations');
        const msgData = await msgRes.json();
        if (!msgData.success || !msgData.data) return;

        const conversations = msgData.data;

        // Comptage des non lus
        const nbNonLus = conversations.reduce((sum, conv) => {
          const nb = Number(conv.non_lu);
          return sum + (isNaN(nb) || nb === 0 ? (conv.non_lu ? 1 : 0) : nb);
        }, 0);

        // Mise à jour du badge
        const badgeMessages = document.getElementById('badge-messages-home');
        if (badgeMessages) {
          if (nbNonLus > 0) {
            badgeMessages.textContent = nbNonLus;
            badgeMessages.style.display = 'flex';
            badgeMessages.style.alignItems = 'center';
            badgeMessages.style.justifyContent = 'center';
          } else {
            badgeMessages.style.display = 'none';
          }
        }

        // Mise à jour du contenu du dropdown
        const dropdownListe = document.getElementById('messages-dropdown-liste');
        if (dropdownListe) {
          const isClientPage = window.location.pathname.includes('/client/') || window.location.pathname.includes('/commerce/') || window.location.pathname.includes('/livreur/') || window.location.pathname.includes('/admin/');
          const basePath = isClientPage ? '' : 'client/';

          if (conversations.length === 0) {
            dropdownListe.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--texte-clair); font-size: 0.9rem;">Aucun message.</div>`;
          } else {
            // Afficher les 5 conversations les plus récentes, les non-lues en premier
            const sorted = [...conversations].sort((a, b) => b.non_lu - a.non_lu);
            const toShow = sorted.slice(0, 5);

            dropdownListe.innerHTML = toShow.map(conv => {
              const nom = `${conv.prenom || ''} ${conv.nom || ''}`.trim();
              let apercu = conv.dernier_message || '';
              if (apercu.startsWith('[PRODUIT]||')) apercu = 'Demande d\'info produit...';
              if (apercu.length > 40) apercu = apercu.substring(0, 40) + '...';

              const avatarUrl = conv.photo_profil
                ? (conv.photo_profil.startsWith('http') ? conv.photo_profil : `https://addugo.up.railway.app${conv.photo_profil}`)
                : '../../assets/img/default-avatar.png';

              const nonLuStyle = conv.non_lu
                ? `background: #FFF7ED; border-left: 3px solid var(--orange);`
                : `border-left: 3px solid transparent;`;
              const dotNonLu = conv.non_lu
                ? `<span style="width:8px;height:8px;background:var(--orange);border-radius:50%;flex-shrink:0;"></span>`
                : '';

              return `
                <a href="${basePath}messages.html?user=${conv.autre_id}"
                   style="display:flex; align-items:center; gap:10px; padding:10px 14px; text-decoration:none; color:var(--texte); ${nonLuStyle} border-bottom: 1px solid var(--bordure);">
                  <img src="${avatarUrl}" alt="${nom}"
                       style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;"
                       onerror="this.src='../../assets/img/default-avatar.png'"/>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:0.85rem;font-weight:${conv.non_lu ? '700' : '500'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${nom}</div>
                    <div style="font-size:0.78rem;color:${conv.non_lu ? '#1A1A2E' : 'var(--texte-clair)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:${conv.non_lu ? '600' : '400'}">${apercu}</div>
                  </div>
                  ${dotNonLu}
                </a>`;
            }).join('');
          }
        }

        // Bouton "Tout marquer lu"
        const btnToutLu = document.getElementById('btn-tout-marquer-lu');
        if (btnToutLu && !btnToutLu.dataset.bound) {
          btnToutLu.dataset.bound = '1';
          btnToutLu.addEventListener('click', async () => {
            // Ouvrir et fermer chaque conversation pour les marquer lues (hack simple)
            for (const conv of conversations) {
              if (conv.non_lu) {
                await apiFetch(`/messages/${conv.autre_id}`);
              }
            }
            await updateUnreadMessagesBadge();
          });
        }

      } catch (e) {
        console.error('Erreur badges messages:', e);
      }
    }
    
    updateUnreadMessagesBadge();
    setInterval(updateUnreadMessagesBadge, 10000);

  } catch (err) {
    console.error('Erreur initialisation navbar:', err);
  }
}
