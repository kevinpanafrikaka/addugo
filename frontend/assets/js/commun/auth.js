// ============================================================
// AdduGo — Authentification (Login & Register)
// ============================================================


// ── UTILITAIRES ──
function afficherAlerte(id, message, type = 'erreur') {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `
    <div class="alerte alerte-${type}">
      <i class="fas fa-${type === 'erreur' ? 'exclamation-circle' : 'check-circle'}"></i>
      ${message}
    </div>`;
}

function setChargement(btnId, chargement) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = chargement;
  btn.innerHTML = chargement
    ? '<i class="fas fa-spinner fa-spin"></i> Chargement...'
    : btn.dataset.texte;
}

// ── TOGGLE MOT DE PASSE ──
const toggleMdp = document.getElementById('toggle-mdp');
if (toggleMdp) {
  const mdpInput = document.getElementById('mot_de_passe');
  toggleMdp.addEventListener('click', () => {
    const type = mdpInput.type === 'password' ? 'text' : 'password';
    mdpInput.type = type;
    toggleMdp.querySelector('i').className =
      type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  });
}

// ── CONFIG RÔLES ──
const ROLES_CONFIG = {
  admin:    { icone: 'fas fa-shield-alt',   label: 'Administration', couleur: '#6C63FF', desc: 'Gérer la plateforme' },
  commerce: { icone: 'fas fa-store',        label: 'Espace Commerce', couleur: 'var(--orange)', desc: 'Gérer vos produits et commandes' },
  livreur:  { icone: 'fas fa-motorcycle',   label: 'Espace Livreur',  couleur: '#17A2B8', desc: 'Gérer vos livraisons' },
  client:   { icone: 'fas fa-shopping-bag', label: 'Espace Client',   couleur: '#28A745', desc: 'Commander et suivre vos achats' }
};

const ROLES_REDIRECT = {
  admin:    '../espace-admin/dashboard.html',
  commerce: '../ma-boutique/produits.html',
  livreur:  '../espace-livreur/dashboard.html',
  client:   '../espace-client/dashboard.html'
};

function redirigerVersRole(role) {
  window.location.href = ROLES_REDIRECT[role] || '../espace-client/dashboard.html';
}

function afficherSelecteurRole(utilisateur) {
  const roles = utilisateur.roles || [];
  const modal = document.getElementById('modal-role');
  const grille = document.getElementById('modal-role-grille');
  if (!modal || !grille) return;

  // Avatar & Salutation
  const initiales = `${utilisateur.nom?.[0] || ''}${utilisateur.prenom?.[0] || ''}`.toUpperCase();
  const avatarEl = document.getElementById('modal-role-avatar');
  const salutEl = document.getElementById('modal-role-salutation');
  if (avatarEl) avatarEl.textContent = initiales;
  if (salutEl) salutEl.textContent = `Bonjour ${utilisateur.prenom} !`;

  // Générer les cartes de rôle
  grille.innerHTML = roles.map(role => {
    const config = ROLES_CONFIG[role] || ROLES_CONFIG.client;
    return `
      <div class="modal-role-item" onclick="redirigerVersRole('${role}')">
        <div class="modal-role-icone" style="background:${config.couleur}">
          <i class="${config.icone}"></i>
        </div>
        <div class="modal-role-info">
          <div class="modal-role-label">${config.label}</div>
          <div class="modal-role-desc">${config.desc}</div>
        </div>
        <i class="fas fa-chevron-right modal-role-fleche"></i>
      </div>`;
  }).join('');

  modal.style.display = 'flex';
}

// ── CONNEXION ──
const formConnexion = document.getElementById('form-connexion');
if (formConnexion) {
  const btn = document.getElementById('btn-connexion');
  if (btn) btn.dataset.texte = btn.innerHTML;

  formConnexion.addEventListener('submit', async (e) => {
    e.preventDefault();
    setChargement('btn-connexion', true);

    const email        = document.getElementById('email').value.trim();
    const mot_de_passe = document.getElementById('mot_de_passe').value;

    try {
      const res  = await apiFetch('/auth/connexion', {
        method: 'POST',
        body: JSON.stringify({ email, mot_de_passe })
      });
      const data = await res.json();

      if (data.success) {
        // ── NETTOYAGE DE L'ANCIEN UTILISATEUR ──
        // Si quelqu'un était connecté avant (sans se déconnecter),
        // on supprime son panier AVANT d'écraser addugo_user.
        try {
          const ancienUser = JSON.parse(localStorage.getItem('addugo_user') || 'null');
          const ancienId   = ancienUser?.id || ancienUser?.utilisateur_id;
          const nouveauId  = data.utilisateur?.id || data.utilisateur?.utilisateur_id;
          // Nettoyer seulement si c'est un utilisateur différent
          if (ancienId && ancienId !== nouveauId) {
            localStorage.removeItem(`addugo_panier_${ancienId}`);
          }
        } catch(e) { /* silencieux */ }

        localStorage.setItem('addugo_token', data.token);
        localStorage.setItem('addugo_user',  JSON.stringify(data.utilisateur));

        const roles = data.utilisateur.roles || [];

        // Tous les utilisateurs sont redirigés vers l'accueil unifié (home.html)
        afficherAlerte('alerte-connexion', 'Connexion réussie ! Redirection...', 'succes');
        setTimeout(() => {
          window.location.href = '../mes-shoppings/home.html';
        }, 1000);

      } else {
        afficherAlerte('alerte-connexion', data.message);
        setChargement('btn-connexion', false);
      }

    } catch (err) {
      afficherAlerte('alerte-connexion', '<i class="fas fa-times-circle"></i> Erreur de connexion au serveur.');
      setChargement('btn-connexion', false);
    }
  });
}

// ============================================================
// INSCRIPTION
// ============================================================
const formInscription = document.getElementById('form-inscription');
if (formInscription) {
  const btn = document.getElementById('btn-inscription');
  if (btn) btn.dataset.texte = btn.innerHTML;

  formInscription.addEventListener('submit', async (e) => {
    e.preventDefault();
    setChargement('btn-inscription', true);

    const nom          = document.getElementById('nom').value.trim();
    const prenom       = document.getElementById('prenom').value.trim();
    const email        = document.getElementById('email').value.trim();
    const telephone    = document.getElementById('telephone').value.trim();
    const mot_de_passe = document.getElementById('mot_de_passe').value;

    // Validation
    if (mot_de_passe.length < 8) {
      afficherAlerte('alerte-inscription', '<i class="fas fa-times-circle"></i> Le mot de passe doit contenir au moins 8 caractères.');
      setChargement('btn-inscription', false);
      return;
    }

    try {
      const res  = await apiFetch('/auth/inscription', {
        method: 'POST',
        body: JSON.stringify({ nom, prenom, email, telephone, mot_de_passe, role: 'client' })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('addugo_token', data.token);
        localStorage.setItem('addugo_user',  JSON.stringify(data.utilisateur));

        afficherAlerte('alerte-inscription', '<i class="fas fa-check-circle"></i> Compte créé avec succès ! Redirection...', 'succes');

        setTimeout(() => {
          window.location.href = '../mes-shoppings/onboarding.html';
        }, 1000);

      } else {
        afficherAlerte('alerte-inscription', data.message);
        setChargement('btn-inscription', false);
      }

    } catch (err) {
      afficherAlerte('alerte-inscription', '<i class="fas fa-times-circle"></i> Erreur de connexion au serveur.');
      setChargement('btn-inscription', false);
    }
  });
}
