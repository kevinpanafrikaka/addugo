// ============================================================
// AdduGo — Onboarding (Photo de profil)
// ============================================================

const token = localStorage.getItem('addugo_token');
let user = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) {
  window.location.href = 'login.html';
}

// ── UTILITAIRES ──
function afficherAlerte(message, type = 'erreur') {
  const alerteBox = document.getElementById('alerte-onboarding');
  alerteBox.innerHTML = `
    <div class="alerte alerte-${type}">
      <i class="fas ${type === 'succes' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> 
      ${message}
    </div>`;
  if (type !== 'succes') {
    setTimeout(() => alerteBox.innerHTML = '', 5000);
  }
}

// ── APERÇU IMAGE DE PROFIL ──
const inputProfil = document.getElementById('input-profil');
const apercuProfil = document.getElementById('apercu-profil');
const zoneProfil = document.getElementById('zone-profil');

inputProfil.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      apercuProfil.src = evt.target.result;
      apercuProfil.style.display = 'block';
      zoneProfil.classList.add('a-une-image');
    };
    reader.readAsDataURL(file);
  }
});

// ── ENVOI DU FORMULAIRE ──
document.getElementById('form-onboarding').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileProfil = inputProfil.files[0];

  if (!fileProfil) {
    afficherAlerte('Veuillez choisir une photo de profil.', 'erreur');
    return;
  }

  const btn = document.getElementById('btn-terminer');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléchargement...';
  btn.disabled = true;

  try {
    // Upload de la photo de profil
    const formData = new FormData();
    formData.append('photo', fileProfil);

    const response = await apiFetch('/utilisateurs/photo', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Erreur lors de l\'upload de la photo.');
    }

    // Mise à jour du localStorage
    user.photo_profil = data.photoUrl;
    localStorage.setItem('addugo_user', JSON.stringify(user));

    // Succès → redirection
    afficherAlerte('Profil configuré ! Redirection vers AdduGo...', 'succes');
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1200);

  } catch (err) {
    console.error('Erreur onboarding:', err);
    afficherAlerte(err.message || 'Une erreur s\'est produite. Veuillez réessayer.', 'erreur');
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
});

// ── PASSER L'ÉTAPE ──
window.passerEtape = () => {
  window.location.href = 'home.html';
};
