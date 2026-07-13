const fs = require('fs');
const path = require('path');
const dirs = [
  'c:\\Users\\Kevin Panafrikaka\\OneDrive\\Desktop\\AdduGo\\frontend\\assets\\js\\espace-admin',
  'c:\\Users\\Kevin Panafrikaka\\OneDrive\\Desktop\\AdduGo\\frontend\\assets\\js\\espace-client',
  'c:\\Users\\Kevin Panafrikaka\\OneDrive\\Desktop\\AdduGo\\frontend\\assets\\js\\espace-livreur',
  'c:\\Users\\Kevin Panafrikaka\\OneDrive\\Desktop\\AdduGo\\frontend\\assets\\js\\ma-boutique'
];

const newAvatarLogic = \
// Avatar dynamique (Image ou Initiales)
if (user && user.photo_profil) {
  const avatarUrl = user.photo_profil.startsWith('http') ? user.photo_profil : 'http://localhost:5000' + user.photo_profil;
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl) {
    avatarEl.innerHTML = '<img src="' + avatarUrl + '" alt="Profil" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />';
  }
} else if (user) {
  const initiales = (user.nom?.[0] || '') + (user.prenom?.[0] || '');
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl) {
    avatarEl.textContent = initiales.toUpperCase();
  }
}

// Notifications badge (Simulation ou Appel API)
async function chargerNotifications() {
  try {
    const notifBadge = document.querySelector('.notif-badge');
    if (notifBadge) {
      // Simulation pour l'instant : on peut fetcher /api/notifications
      const count = Math.floor(Math.random() * 5) + 1; 
      notifBadge.textContent = count; 
      notifBadge.style.display = 'flex';
      notifBadge.style.opacity = '1';
    }
  } catch (e) {
    console.error('Erreur notifs', e);
  }
}
// Charger les notifs apr\u00e8s 1s pour effet d'apparition
setTimeout(chargerNotifications, 1000);
\;

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  for (const f of files) {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');

    // Replace old avatar logic
    const oldAvatarRegex = /const initiales = \\\\$\\{user\.nom\?\\\.\[0\] \|\| ''\\}\\\$\\{user\.prenom\?\\\.\[0\] \|\| ''\\}\\.toUpperCase\(\);\s*document\.getElementById\('user-avatar'\)\.textContent\s*=\s*initiales;/g;
    
    // Some files might have slightly different spacing, let's use a simpler replace
    if (content.includes("document.getElementById('user-avatar').textContent    = initiales;") || content.includes("document.getElementById('user-avatar').textContent = initiales;")) {
      content = content.replace(/const initiales = \\\\$\\{user\.nom\?\\\.\[0\] \|\| ''\\}\\\$\\{user\.prenom\?\\\.\[0\] \|\| ''\\}\\.toUpperCase\(\);\s*document\.getElementById\('user-avatar'\)\.textContent\s*=\s*initiales;/g, newAvatarLogic);
      
      // Fallback manual replace if regex fails due to spacing
      let oldStr1 = "const initiales = \${user.nom?.[0] || ''}\.toUpperCase();\r\ndocument.getElementById('user-avatar').textContent    = initiales;";
      let oldStr2 = "const initiales = \${user.nom?.[0] || ''}\.toUpperCase();\ndocument.getElementById('user-avatar').textContent    = initiales;";
      content = content.replace(oldStr1, newAvatarLogic).replace(oldStr2, newAvatarLogic);

      fs.writeFileSync(p, content, 'utf8');
      console.log('Mis a jour:', p);
    }
  }
}
