/* ============================================================
   AdduGo — api.js
   Gestionnaire global des requêtes API
   ============================================================ */

const API_URL = 'https://addugo.up.railway.app/api';

/**
 * Fonction globale pour effectuer des requêtes API
 * Elle gère automatiquement l'URL de base, les en-têtes JSON et l'injection du token
 * 
 * @param {string} endpoint - Le chemin de l'API (ex: '/commandes')
 * @param {object} options - Options fetch standards (method, body, headers...)
 * @returns {Promise<Response>} - La réponse brute fetch
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('addugo_token');
  
  // En-têtes par défaut
  const headers = {
    ...(options.headers || {})
  };

  // Si le body n'est pas un FormData, on force le JSON par défaut
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Injection du token si disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Effectue la requête avec les options fusionnées
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  return response;
}

/**
 * Déconnexion globale de l'utilisateur et redirection vers l'interface initiale index.html
 */
function seDeconnecter() {
  localStorage.removeItem('addugo_token');
  localStorage.removeItem('addugo_user');
  localStorage.removeItem('addugo_commerce_id');

  const path = window.location.pathname;
  let redirectUrl = 'index.html';

  if (path.includes('/pages/')) {
    redirectUrl = '../../index.html';
  }

  window.location.href = redirectUrl;
}

// Écouteur automatique au chargement pour tous les boutons de déconnexion de l'application
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#btn-logout, #btn-deconnexion, .btn-deconnexion, .btn-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      seDeconnecter();
    });
  });
});