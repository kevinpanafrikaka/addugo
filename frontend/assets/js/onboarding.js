// ============================================================
// AdduGo — Onboarding (Photos)
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
  setTimeout(() => alerteBox.innerHTML = '', 4000);
}

// ── APERCUS D'IMAGES ──
const inputProfil = document.getElementById('input-profil');
const apercuProfil = document.getElementById('apercu-profil');
const inputCouverture = document.getElementById('input-couverture');
const apercuCouverture = document.getElementById('apercu-couverture');

inputProfil.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      apercuProfil.src = e.target.result;
      apercuProfil.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

inputCouverture.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      apercuCouverture.src = e.target.result;
      apercuCouverture.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// ── ENVOI DU FORMULAIRE ──
document.getElementById('form-onboarding').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fileProfil = inputProfil.files[0];
  const fileCouverture = inputCouverture.files[0];
  
  if (!fileProfil) {
    afficherAlerte('La photo de profil est requise.', 'erreur');
    return;
  }

  const btn = document.getElementById('btn-terminer');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléchargement...';
  btn.disabled = true;

  try {
    // 1. Upload Profil
    const formProfil = new FormData();
    formProfil.append('photo', fileProfil);
    const resProfil = await apiFetch('/utilisateurs/photo', {
      method: 'POST',
      body: formProfil
    });
    const dataProfil = await resProfil.json();
    if (dataProfil.success) {
      user.photo_profil = dataProfil.photoUrl;
    } else {
      throw new Error(dataProfil.message || "Erreur upload profil");
    }



    // Mise à jour de l'utilisateur local
    localStorage.setItem('addugo_user', JSON.stringify(user));
    
    // Redirection
    afficherAlerte('Inscription finalisée ! Redirection...', 'succes');
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1000);

  } catch (err) {
    console.error(err);
    afficherAlerte(err.message || 'Erreur lors du téléchargement des images.');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// ── PASSER L'ÉTAPE ──
window.passerEtape = () => {
  window.location.href = 'home.html';
};
