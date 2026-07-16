// ============================================================
// AdduGo — Statistiques Admin
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── INIT UTILISATEUR ──
const initiales = `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase();

const avatarHtml = user.photo_profil 
  ? `<img src="${user.photo_profil.startsWith('http') ? user.photo_profil : 'http://localhost:5000' + user.photo_profil}" alt="Profil" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` 
  : initiales;

document.getElementById('user-avatar').innerHTML    = avatarHtml;
document.getElementById('user-nom').textContent       = `${user.prenom} ${user.nom}`;
document.getElementById('sidebar-avatar').innerHTML = avatarHtml;
document.getElementById('sidebar-nom').textContent    = `${user.prenom} ${user.nom}`;

// Simulation chargement notifications
setTimeout(() => {
  const notifBadge = document.querySelector('.notif-badge');
  if (notifBadge) {
    const notifs = Math.floor(Math.random() * 5) + 1;
    notifBadge.textContent = notifs;
    notifBadge.style.display = 'flex';
  }
}, 1000);

// ── UTILITAIRES ──
function formatPrix(montant) {
  return new Intl.NumberFormat('fr-GN').format(montant) + '\u00A0GNF';
}

// ── COULEURS ET ICÔNES PAR STATUT ──
const STATUTS_CONFIG = {
  'en_attente':     { classe: 'badge-avertissement', icone: 'fa-hourglass-half', label: 'En attente'     },
  'confirmee':      { classe: 'badge-info',          icone: 'fa-check-circle',   label: 'Confirmée'      },
  'en_preparation': { classe: 'badge-bleu',          icone: 'fa-wrench',         label: 'En préparation' },
  'prete':          { classe: 'badge-succes',        icone: 'fa-box',            label: 'Prête'          },
  'en_livraison':   { classe: 'badge-orange',        icone: 'fa-motorcycle',     label: 'En livraison'   },
  'livree':         { classe: 'badge-succes',        icone: 'fa-check-circle',   label: 'Livrée'         },
  'annulee':        { classe: 'badge-erreur',        icone: 'fa-times-circle',   label: 'Annulée'        }
};

// ── BARRE DE PROGRESSION ──
function barreProgression(valeur, total, classe) {
  const pct = total > 0 ? Math.round((valeur / total) * 100) : 0;
  return `
    <div class="stat-barre-conteneur">
      <div class="stat-barre-piste">
        <div class="stat-barre-remplissage ${classe}" style="width:${pct}%"></div>
      </div>
      <span class="stat-barre-pct">${pct}%</span>
    </div>`;
}

// ── CHARGER COMMERCES ──
async function chargerCommerces() {
  try {
    const res  = await apiFetch('/admin/commerces');
    const data = await res.json();

    const commerces = data.commerces || [];
    document.getElementById('kpi-commerces').textContent =
      commerces.filter(c => c.est_actif).length;

    const conteneur = document.getElementById('top-commerces');

    if (commerces.length === 0) {
      conteneur.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-store"></i></div>
          <p>Aucun commerce enregistré</p>
        </div>`;
      return;
    }

    conteneur.innerHTML = `
      <div class="tableau-conteneur">
        <table class="tableau">
          <thead>
            <tr>
              <th>#</th>
              <th>Commerce</th>
              <th>Propriétaire</th>
              <th>Téléphone</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${commerces.slice(0, 8).map((c, i) => `
              <tr>
                <td>
                  <span style="font-family:var(--police-mono);font-size:0.8rem;color:var(--texte-gris)">
                    ${String(i + 1).padStart(2, '0')}
                  </span>
                </td>
                <td>
                  <div style="font-weight:700;color:var(--texte)">${c.nom}</div>
                  <div style="font-size:0.78rem;color:var(--texte-gris)">${c.description || '—'}</div>
                </td>
                <td>${c.proprio_prenom || '—'} ${c.proprio_nom || ''}</td>
                <td>${c.telephone || '—'}</td>
                <td>
                  <span class="badge ${c.est_actif ? 'badge-succes' : 'badge-erreur'}">
                    <i class="fas ${c.est_actif ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${c.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  } catch (err) {
    document.getElementById('top-commerces').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── CHARGER PRODUITS + CATÉGORIES ──
async function chargerProduits() {
  try {
    const [resProduits, resCats] = await Promise.all([
      apiFetch('/produits'),
      apiFetch('/produits/categories')
    ]);
    const dataProduits = await resProduits.json();
    const dataCats     = await resCats.json();

    const produits   = dataProduits.produits   || [];
    const categories = dataCats.categories     || [];

    document.getElementById('kpi-produits').textContent = produits.length;

    // ── TOP PRODUITS (par prix) ──
    const top = [...produits].sort((a, b) => b.prix - a.prix).slice(0, 6);
    const conteneurTop = document.getElementById('top-produits');

    if (top.length === 0) {
      conteneurTop.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-box"></i></div>
          <p>Aucun produit enregistré</p>
        </div>`;
    } else {
      const maxPrix = top[0].prix;
      conteneurTop.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:var(--espace-md)">
          ${top.map((p, i) => `
            <div style="display:flex;align-items:center;gap:var(--espace-md)">
              <div style="
                width:36px;height:36px;border-radius:var(--rayon-sm);
                background:${i === 0 ? 'var(--orange)' : i === 1 ? 'var(--bleu)' : 'var(--fond)'};
                color:${i < 2 ? 'var(--blanc)' : 'var(--texte-gris)'};
                display:flex;align-items:center;justify-content:center;
                font-family:var(--police-titre);font-weight:700;font-size:0.9rem;
                flex-shrink:0;">
                ${i + 1}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;color:var(--texte);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${p.nom}
                </div>
                <div style="font-size:0.78rem;color:var(--texte-gris)">${p.commerce_nom || '—'}</div>
                ${barreProgression(p.prix, maxPrix, i === 0 ? 'barre-orange' : 'barre-bleu')}
              </div>
              <div style="font-weight:700;color:var(--orange);font-family:var(--police-mono);font-size:0.9rem;white-space:nowrap">
                ${formatPrix(p.prix)}
              </div>
            </div>`).join('')}
        </div>`;
    }

    // ── RÉPARTITION PAR CATÉGORIE ──
    const conteneurCats = document.getElementById('stats-categories');
    if (categories.length === 0) {
      conteneurCats.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-tags"></i></div>
          <p>Aucune catégorie trouvée</p>
        </div>`;
    } else {
      // Compter les produits par catégorie
      const comptage = {};
      produits.forEach(p => {
        const nom = p.categorie_nom || 'Autre';
        comptage[nom] = (comptage[nom] || 0) + 1;
      });
      const maxProduits = Math.max(...Object.values(comptage), 1);

      conteneurCats.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--espace-md)">
          ${categories.map(cat => {
            const nb = comptage[cat.nom] || 0;
            return `
              <div class="stat-carte" style="flex-direction:column;align-items:flex-start;gap:var(--espace-sm)">
                <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
                  <div style="font-weight:600;color:var(--texte);font-size:0.9rem">${cat.nom}</div>
                  <span class="badge badge-bleu">${nb} produit${nb > 1 ? 's' : ''}</span>
                </div>
                ${barreProgression(nb, maxProduits, 'barre-bleu')}
              </div>`;
          }).join('')}
        </div>`;
    }

  } catch (err) {
    document.getElementById('top-produits').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
    document.getElementById('stats-categories').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── CHARGER COMMANDES ──
async function chargerCommandes() {
  try {
    const res  = await apiFetch('/admin/commandes');
    const data = await res.json();

    const commandes = data.commandes || [];
    document.getElementById('kpi-commandes').textContent = commandes.length;

    const conteneur = document.getElementById('stats-statuts');

    if (commandes.length === 0) {
      conteneur.innerHTML = `
        <div class="vide">
          <div class="vide-icone"><i class="fas fa-shopping-bag"></i></div>
          <p>Aucune commande enregistrée</p>
        </div>`;
      return;
    }

    // Compter par statut
    const comptage = {};
    commandes.forEach(c => {
      comptage[c.statut] = (comptage[c.statut] || 0) + 1;
    });

    const total = commandes.length;
    const lignes = Object.entries(comptage)
      .sort((a, b) => b[1] - a[1])
      .map(([statut, nb]) => {
        const cfg = STATUTS_CONFIG[statut] || { classe: 'badge-info', icone: 'fa-circle', label: statut };
        return `
          <div style="display:flex;align-items:center;gap:var(--espace-md);padding:var(--espace-md) 0;border-bottom:1px solid var(--bordure)">
            <span class="badge ${cfg.classe}" style="min-width:160px;justify-content:center">
              <i class="fas ${cfg.icone}"></i> ${cfg.label}
            </span>
            <div style="flex:1">
              ${barreProgression(nb, total, cfg.classe === 'badge-succes' ? 'barre-succes' : cfg.classe === 'badge-erreur' ? 'barre-erreur' : cfg.classe === 'badge-orange' ? 'barre-orange' : 'barre-bleu')}
            </div>
            <span style="font-weight:700;font-family:var(--police-mono);color:var(--texte);min-width:24px;text-align:right">
              ${nb}
            </span>
          </div>`;
      }).join('');

    conteneur.innerHTML = `<div style="padding:0 var(--espace-sm)">${lignes}</div>`;

  } catch (err) {
    document.getElementById('stats-statuts').innerHTML =
      '<div class="alerte alerte-erreur"><i class="fas fa-times-circle"></i> Erreur de chargement.</div>';
  }
}

// ── CHARGER KPI UTILISATEURS ──
async function chargerUtilisateurs() {
  try {
    const res = await apiFetch('/admin/utilisateurs');
    const data = await res.json();
    document.getElementById('kpi-utilisateurs').textContent = data.total || 0;
  } catch (err) {
    document.getElementById('kpi-utilisateurs').textContent = '—';
  }
}

// ── DÉCONNEXION ──
document.getElementById('btn-deconnexion')?.addEventListener('click', (e) => {
  e?.preventDefault();
  seDeconnecter();
});

// ── STYLES BARRES DE PROGRESSION (injectés en JS pour portabilité) ──
const style = document.createElement('style');
style.textContent = `
  .stat-barre-conteneur { display:flex; align-items:center; gap:8px; margin-top:6px; }
  .stat-barre-piste { flex:1; height:6px; background:var(--bordure); border-radius:999px; overflow:hidden; }
  .stat-barre-remplissage { height:100%; border-radius:999px; transition:width 0.6s ease; }
  .barre-orange  { background: var(--orange); }
  .barre-bleu    { background: var(--bleu); }
  .barre-succes  { background: var(--succes); }
  .barre-erreur  { background: var(--erreur); }
  .stat-barre-pct { font-size:0.75rem; color:var(--texte-gris); font-family:var(--police-mono); min-width:32px; text-align:right; }
`;
document.head.appendChild(style);

// ── INIT ──
chargerUtilisateurs();
chargerCommerces();
chargerProduits();
chargerCommandes();

// ── GRAPHIQUE ÉVOLUTION (CHART.JS) ──
let evolutionChart = null;

function chargerGraphiqueEvolution(periode) {
  const ctx = document.getElementById('chart-evolution');
  if (!ctx) return;

  // Simulation de données selon la période
  let labels = [];
  let dataRevenus = [];
  let dataCommandes = [];

  if (periode === '7j') {
    labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dataRevenus = [1500, 2300, 1800, 3200, 2900, 4100, 3800];
    dataCommandes = [12, 19, 15, 25, 22, 35, 30];
  } else if (periode === '30j') {
    for (let i = 1; i <= 30; i+=3) labels.push(`Jour ${i}`);
    dataRevenus = Array.from({length: 10}, () => Math.floor(Math.random() * 5000) + 1000);
    dataCommandes = dataRevenus.map(r => Math.floor(r / 150));
  } else if (periode === '12m') {
    labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    dataRevenus = [15000, 18000, 17500, 22000, 25000, 21000, 30000, 32000, 28000, 35000, 40000, 45000];
    dataCommandes = dataRevenus.map(r => Math.floor(r / 120));
  }

  if (evolutionChart) {
    evolutionChart.destroy();
  }

  evolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Revenus (kGNF)',
          data: dataRevenus,
          borderColor: '#FF7F00',
          backgroundColor: 'rgba(255, 127, 0, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Commandes',
          data: dataCommandes,
          borderColor: '#005BBB',
          backgroundColor: 'rgba(0, 91, 187, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: "'Inter', sans-serif", size: 13 } }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: "'Inter', sans-serif", size: 14 },
          bodyFont: { family: "'Inter', sans-serif", size: 13 },
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "'Inter', sans-serif" } }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(0,0,0,0.05)' },
          title: { display: true, text: 'Revenus (kGNF)' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Commandes' }
        }
      }
    }
  });
}

// Initialiser le graphique
chargerGraphiqueEvolution('30j');

// Écouter les changements de période
document.getElementById('select-periode')?.addEventListener('change', (e) => {
  chargerGraphiqueEvolution(e.target.value);
});
