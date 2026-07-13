const fs = require('fs');
const path = require('path');
const dir = 'c:\\Users\\Kevin Panafrikaka\\OneDrive\\Desktop\\AdduGo\\frontend\\assets\\js\\espace-admin';

const newAvatarLogic = \const initiales = \\\\\\$\\{user.nom?.[0] || ''\\}\\\$\\{user.prenom?.[0] || ''\\}\\\.toUpperCase();

const avatarHtml = user.photo_profil 
  ? \\\<img src=\"\\\$\\{user.photo_profil.startsWith('http') ? user.photo_profil : 'http://localhost:5000' + user.photo_profil\\}\" alt=\"Profil\" style=\"width:100%;height:100%;border-radius:50%;object-fit:cover;\" />\\\ 
  : initiales;

document.getElementById('user-avatar').innerHTML    = avatarHtml;
document.getElementById('user-nom').textContent       = \\\\\\$\\{user.prenom\\} \\\$\\{user.nom\\}\\\;
document.getElementById('sidebar-avatar').innerHTML = avatarHtml;
document.getElementById('sidebar-nom').textContent    = \\\\\\$\\{user.prenom\\} \\\$\\{user.nom\\}\\\;

// Simulation chargement notifications
setTimeout(() => {
  const notifBadge = document.querySelector('.notif-badge');
  if (notifBadge) {
    const notifs = Math.floor(Math.random() * 5) + 1;
    notifBadge.textContent = notifs;
    notifBadge.style.display = 'flex';
  }
}, 1000);\;

if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'dashboard.js');
  for (const f of files) {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');

    let oldStr1 = "const initiales = \${user.nom?.[0] || ''}\.toUpperCase();\r\ndocument.getElementById('user-avatar').textContent    = initiales;\r\ndocument.getElementById('user-nom').textContent       = \${user.prenom} \;\r\ndocument.getElementById('sidebar-avatar').textContent = initiales;\r\ndocument.getElementById('sidebar-nom').textContent    = \${user.prenom} \;";
    let oldStr2 = "const initiales = \${user.nom?.[0] || ''}\.toUpperCase();\ndocument.getElementById('user-avatar').textContent    = initiales;\ndocument.getElementById('user-nom').textContent       = \${user.prenom} \;\ndocument.getElementById('sidebar-avatar').textContent = initiales;\ndocument.getElementById('sidebar-nom').textContent    = \${user.prenom} \;";
    let oldStr3 = "const initiales = \${user.nom?.[0] || ''}\.toUpperCase();\r\ndocument.getElementById('user-avatar').textContent = initiales;\r\ndocument.getElementById('user-nom').textContent = \${user.prenom} \;\r\ndocument.getElementById('sidebar-avatar').textContent = initiales;\r\ndocument.getElementById('sidebar-nom').textContent = \${user.prenom} \;";

    if (content.includes("const initiales = \${user.nom?.[0] || ''}\.toUpperCase();")) {
      let originalLength = content.length;
      content = content.replace(oldStr1, newAvatarLogic).replace(oldStr2, newAvatarLogic).replace(oldStr3, newAvatarLogic);
      
      if (content.length !== originalLength) {
        fs.writeFileSync(p, content, 'utf8');
        console.log('Mis a jour:', f);
      }
    }
  }
}
