/* ============================================================
   AdduGo — shared-profil.js
   Gestion unifiée du profil utilisateur (Client / Commerce / Livreur)
   ============================================================ */

let user = JSON.parse(localStorage.getItem('addugo_user') || 'null');

document.addEventListener('DOMContentLoaded', async () => {
  await chargerProfil();
  initialiserEcouteurs();
});

// ── CHARGEMENT ET INITIALISATION DU PROFIL ──
async function chargerProfil() {
  try {
    const res = await apiFetch('/utilisateurs/profil');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.utilisateur) {
        user = data.utilisateur;
        localStorage.setItem('addugo_user', JSON.stringify(user));
      }
    }
  } catch (e) {
    console.warn("Impossible de rafraîchir le profil depuis l'API, utilisation du cache local.", e);
  }

  if (!user) return;

  // 1. Remplissage des champs de formulaire
  const elPrenom = document.getElementById('profil-prenom');
  const elNom = document.getElementById('profil-nom');
  const elGenre = document.getElementById('profil-genre');
  const elEmail = document.getElementById('profil-email');
  const elTel = document.getElementById('profil-telephone');
  const elAdresse = document.getElementById('profil-adresse');

  if (elPrenom) elPrenom.value = user.prenom || '';
  if (elNom) elNom.value = user.nom || '';
  if (elGenre) elGenre.value = user.genre || 'M';
  if (elEmail) elEmail.value = user.email || '';
  if (elTel) elTel.value = user.telephone || '';
  if (elAdresse) elAdresse.value = user.adresse || '';

  // 2. Mise à jour de l'en-tête (Nom + rôles simples séparés par |)
  const elBanniereNom = document.getElementById('banniere-nom');
  if (elBanniereNom) elBanniereNom.textContent = `${user.prenom || ''} ${user.nom || ''}`;

  const isFemme = user.genre === 'F';
  const roles = user.roles || ['client'];

  // Construire la liste des rôles accordés en genre
  const rolesAffiches = [];
  if (roles.includes('admin')) rolesAffiches.push('Admin');
  if (roles.includes('client') || (!roles.includes('admin'))) rolesAffiches.push(isFemme ? 'Cliente' : 'Client');
  if (roles.includes('livreur')) rolesAffiches.push(isFemme ? 'Livreuse' : 'Livreur');
  if (roles.includes('commerce')) rolesAffiches.push(isFemme ? 'Commerçante' : 'Commerçant');

  const elBanniereRole = document.getElementById('banniere-role');
  if (elBanniereRole) {
    elBanniereRole.textContent = rolesAffiches.join(' | ');
  }

  // 3. Mise à jour des cartes de genre
  actualiserCartesGenre(user.genre || 'M');

  // 4. Gestion de la Photo d'Avatar
  actualiserAvatarPhoto();
}

// ── MISE À JOUR VISUELLE DU GENRE ──
function actualiserCartesGenre(valeurGenre) {
  document.querySelectorAll('.profil-genre-card').forEach(card => {
    if (card.getAttribute('data-genre') === valeurGenre) {
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
}

// ── GESTION PHOTO DE PROFIL ──
function actualiserAvatarPhoto() {
  if (!user) return;
  const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();

  let photoUrl = null;
  if (user.photo_profil && !user.photo_profil.includes('default-avatar.png')) {
    photoUrl = user.photo_profil.startsWith('http')
      ? user.photo_profil
      : `http://localhost:3000${user.photo_profil.startsWith('/') ? '' : '/'}${user.photo_profil}`;
  }

  const conteneurAvatar = document.getElementById('avatar-gros-conteneur');
  if (conteneurAvatar) {
    if (photoUrl) {
      conteneurAvatar.innerHTML = `
        <img src="${photoUrl}" alt="${user.prenom}" class="profil-avatar-img" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />
        <div class="profil-avatar-overlay">
          <i class="fas fa-camera"></i>
          <span>Modifier</span>
        </div>
      `;
    } else {
      conteneurAvatar.innerHTML = `
        <div style="width:100%; height:100%; border-radius:50%; background:#FFF3EE; color:var(--orange); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:2.2rem;">${initiales}</div>
        <div class="profil-avatar-overlay">
          <i class="fas fa-camera"></i>
          <span>Modifier</span>
        </div>
      `;
    }
  }
}

// ── ÉCOUTEURS D'ÉVÉNEMENTS ──
function initialiserEcouteurs() {
  // Clic sur les cartes de genre
  document.addEventListener('click', (e) => {
    const genreCard = e.target.closest('.profil-genre-card');
    if (genreCard) {
      const val = genreCard.getAttribute('data-genre');
      const inputHidden = document.getElementById('profil-genre');
      if (inputHidden) inputHidden.value = val;
      actualiserCartesGenre(val);
    }

    // Basculement d'affichage des mots de passe (Œil)
    const btnToggleMdp = e.target.closest('.btn-toggle-mdp');
    if (btnToggleMdp) {
      const targetId = btnToggleMdp.getAttribute('data-target');
      const inputMdp = document.getElementById(targetId);
      if (inputMdp) {
        const typeActuel = inputMdp.getAttribute('type');
        if (typeActuel === 'password') {
          inputMdp.setAttribute('type', 'text');
          btnToggleMdp.innerHTML = `<i class="fas fa-eye-slash" style="color:var(--orange);"></i>`;
        } else {
          inputMdp.setAttribute('type', 'password');
          btnToggleMdp.innerHTML = `<i class="fas fa-eye" style="color:var(--texte-gris);"></i>`;
        }
      }
    }
  });

  // Upload Photo de profil
  const inputUploadPhoto = document.getElementById('upload-photo');
  if (inputUploadPhoto) {
    inputUploadPhoto.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('photo', file);

      try {
        afficherAlerte('Envoi de la photo en cours...', 'info');
        const res = await apiFetch('/utilisateurs/photo', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success && data.photoUrl) {
          afficherAlerte('Photo de profil mise à jour avec succès !', 'succes');
          user.photo_profil = data.photoUrl;
          localStorage.setItem('addugo_user', JSON.stringify(user));
          actualiserAvatarPhoto();
          if (typeof initialiserNavbar === 'function') initialiserNavbar();
        } else {
          afficherAlerte(data.message || 'Erreur lors du téléchargement de la photo.', 'erreur');
        }
      } catch (err) {
        console.error('Erreur upload photo:', err);
        afficherAlerte('Erreur réseau lors de l\'envoi de l\'image.', 'erreur');
      }
    });
  }

  // Soumission Formulaire Informations Personnel
  const formProfil = document.getElementById('form-profil');
  if (formProfil) {
    formProfil.addEventListener('submit', async (e) => {
      e.preventDefault();

      const prenom = document.getElementById('profil-prenom')?.value.trim();
      const nom = document.getElementById('profil-nom')?.value.trim();
      const genre = document.getElementById('profil-genre')?.value || 'M';
      const email = document.getElementById('profil-email')?.value.trim();
      const telephone = document.getElementById('profil-telephone')?.value.trim();
      const adresse = document.getElementById('profil-adresse')?.value.trim();

      const btnSave = document.getElementById('btn-save-profil');
      if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Enregistrement...`;
      }

      try {
        const res = await apiFetch('/utilisateurs/profil', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prenom, nom, genre, email, telephone, adresse })
        });
        const data = await res.json();

        if (data.success) {
          afficherAlerte('Informations personnelles mises à jour avec succès !', 'succes');
          if (data.utilisateur) {
            Object.assign(user, data.utilisateur);
          } else {
            Object.assign(user, { prenom, nom, genre, email, telephone, adresse });
          }
          localStorage.setItem('addugo_user', JSON.stringify(user));
          await chargerProfil();
          if (typeof initialiserNavbar === 'function') initialiserNavbar();
        } else {
          afficherAlerte(data.message || 'Erreur lors de la mise à jour.', 'erreur');
        }
      } catch (err) {
        console.error('Erreur profil update:', err);
        afficherAlerte('Erreur réseau lors de l\'enregistrement.', 'erreur');
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.innerHTML = `<i class="fas fa-save"></i> Enregistrer les modifications`;
        }
      }
    });
  }

  // Soumission Formulaire Sécurité (Changement de mot de passe)
  const formSecurite = document.getElementById('form-securite');
  if (formSecurite) {
    formSecurite.addEventListener('submit', async (e) => {
      e.preventDefault();

      const mot_de_passe_actuel = document.getElementById('mdp-actuel')?.value;
      const nouveau_mot_de_passe = document.getElementById('mdp-nouveau')?.value;
      const confirmation = document.getElementById('mdp-confirm')?.value;

      if (nouveau_mot_de_passe !== confirmation) {
        afficherAlerte('Le nouveau mot de passe et sa confirmation ne correspondent pas.', 'erreur');
        return;
      }

      const btnSave = document.getElementById('btn-save-securite');
      if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Traitement...`;
      }

      try {
        const res = await apiFetch('/utilisateurs/changer-mot-de-passe', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mot_de_passe_actuel, nouveau_mot_de_passe })
        });
        const data = await res.json();

        if (data.success) {
          afficherAlerte('Votre mot de passe a été modifié avec succès !', 'succes');
          formSecurite.reset();
        } else {
          afficherAlerte(data.message || 'Erreur lors du changement de mot de passe.', 'erreur');
        }
      } catch (err) {
        console.error('Erreur mot de passe:', err);
        afficherAlerte('Erreur serveur lors de la modification du mot de passe.', 'erreur');
      } finally {
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.innerHTML = `<i class="fas fa-key"></i> Changer le mot de passe`;
        }
      }
    });
  }
}

// ── FONCTION D'AFFICHAGE D'ALERTE DYNAMIQUE ──
function afficherAlerte(message, type = 'succes') {
  const conteneur = document.getElementById('alerte-profil');
  if (!conteneur) return;

  const bg = type === 'succes' ? 'rgba(16,185,129,0.1)' : type === 'info' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)';
  const color = type === 'succes' ? '#10B981' : type === 'info' ? '#3B82F6' : '#EF4444';
  const border = type === 'succes' ? 'rgba(16,185,129,0.2)' : type === 'info' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)';
  const icone = type === 'succes' ? 'fa-check-circle' : type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle';

  conteneur.innerHTML = `
    <div style="background:${bg}; color:${color}; border:1.5px solid ${border}; border-radius:14px; padding:12px 18px; display:flex; align-items:center; gap:12px; font-weight:700; font-size:0.9rem; margin-bottom:18px;">
      <i class="fas ${icone}" style="font-size:1.1rem;"></i>
      <span>${message}</span>
    </div>
  `;

  setTimeout(() => {
    conteneur.innerHTML = '';
  }, 4000);
}
