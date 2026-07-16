// ============================================================
// AdduGo — Statistiques Livreur (statistiques-livreur.js)
// ============================================================

const token = localStorage.getItem('addugo_token');
const user  = JSON.parse(localStorage.getItem('addugo_user') || 'null');

if (!token || !user) window.location.href = '../accueil/login.html';

// ── UTILITAIRES ──
function formatPrix(montant) {
  return new Intl.NumberFormat('fr-GN').format(montant || 0) + ' GNF';
}

function formatDateCourt(dateStr) {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(dateStr));
}

// ── VARIABLES GLOBALES ──
let toutesLivraisons = [];
let periodeActive = 'aujourdhui';
let chartGainsInstance = null;

// ── CHARGER DONNÉES LIVRAISONS ──
async function chargerDonneesStatistiques() {
  try {
    const res  = await apiFetch('/livreurs/mes-livraisons');
    const data = await res.json();

    if (data.success) {
      toutesLivraisons = data.livraisons || [];
      calculerEtAfficherStatistiques();
    }
  } catch (err) {
    console.error('Erreur chargerDonneesStatistiques:', err);
    calculerEtAfficherStatistiques();
  }
}

// ── FILTRER PAR PÉRIODE ──
function filtrerParPeriode(livraisons, periode) {
  const maintenant = new Date();
  const debutJournee = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());

  return livraisons.filter(l => {
    // Si la commande est livrée, on utilise la date de livraison, sinon on retombe sur l'assignation/création
    const d = new Date(l.date_livraison || l.date_assignation || l.date_creation);
    if (periode === 'aujourdhui') {
      return d >= debutJournee;
    } else if (periode === '7jours') {
      const ilYa7Jours = new Date(debutJournee);
      ilYa7Jours.setDate(ilYa7Jours.getDate() - 7);
      return d >= ilYa7Jours;
    } else if (periode === '30jours') {
      const ilYa30Jours = new Date(debutJournee);
      ilYa30Jours.setDate(ilYa30Jours.getDate() - 30);
      return d >= ilYa30Jours;
    } else if (periode === 'annee') {
      const debutAnnee = new Date(maintenant.getFullYear(), 0, 1);
      return d >= debutAnnee;
    }
    return true;
  });
}

// ── GENERATION LABELS ET DONNEES PAR PERIODE ──
function obtenirStructureGraphique(livraisons, periode) {
  const maintenant = new Date();
  let labels = [];
  let fullDates = [];
  let dataPoints = [];
  const mapGains = {};

  livraisons.forEach(l => {
    if (l.statut === 'livree') {
      const d = new Date(l.date_livraison || l.date_assignation || l.date_creation);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      mapGains[key] = (mapGains[key] || 0) + 30000;
    }
  });

  if (periode === 'aujourdhui') {
    const dateStr = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(maintenant);
    const dateMaj = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    labels = [`Aujourd'hui`];
    fullDates = [dateMaj];
    const totalAujourdhui = livraisons.filter(l => l.statut === 'livree').length * 30000;
    dataPoints = [totalAujourdhui];
  } 
  else if (periode === '7jours') {
    labels = [];
    fullDates = [];
    dataPoints = [];
    const jourCourts = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(maintenant);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Libellé court 3 lettres pour l'Axe X (ex: Lun, Mar, Mer)
      labels.push(jourCourts[d.getDay()]);

      // Date complète en français pour la carte noire au clic (ex: Vendredi 26 Juin 2026)
      const dateCompleteStr = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(d);
      const dateCompleteMaj = dateCompleteStr.charAt(0).toUpperCase() + dateCompleteStr.slice(1);
      fullDates.push(dateCompleteMaj);

      dataPoints.push(mapGains[key] || 0);
    }
  } 
  else if (periode === '30jours') {
    labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    fullDates = ['Il y a 4 semaines', 'Il y a 3 semaines', 'Il y a 2 semaines', 'Cette semaine'];
    dataPoints = [0, 0, 0, 0];

    const unJourMs = 24 * 60 * 60 * 1000;
    const debutAujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()).getTime();

    livraisons.forEach(l => {
      if (l.statut === 'livree') {
        const d = new Date(l.date_livraison || l.date_assignation || l.date_creation);
        const diffJours = Math.floor((debutAujourdhui - d.getTime()) / unJourMs);
        if (diffJours >= 0 && diffJours < 28) {
          const idxSemaine = 3 - Math.floor(diffJours / 7);
          if (idxSemaine >= 0 && idxSemaine < 4) {
            dataPoints[idxSemaine] += 30000;
          }
        }
      }
    });
  } 
  else if (periode === 'annee') {
    const isMobile = window.innerWidth <= 600;
    labels = isMobile 
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      : ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const anneeEncours = maintenant.getFullYear();
    fullDates = [
      `Janvier ${anneeEncours}`, `Février ${anneeEncours}`, `Mars ${anneeEncours}`,
      `Avril ${anneeEncours}`, `Mai ${anneeEncours}`, `Juin ${anneeEncours}`,
      `Juillet ${anneeEncours}`, `Août ${anneeEncours}`, `Septembre ${anneeEncours}`,
      `Octobre ${anneeEncours}`, `Novembre ${anneeEncours}`, `Décembre ${anneeEncours}`
    ];
    dataPoints = Array(12).fill(0);

    livraisons.forEach(l => {
      if (l.statut === 'livree') {
        const d = new Date(l.date_livraison || l.date_assignation || l.date_creation);
        if (d.getFullYear() === anneeEncours) {
          const m = d.getMonth();
          dataPoints[m] += 30000;
        }
      }
    });
  }

  return { labels, fullDates, dataPoints };
}

// ── CALCULS & AFFICHAGE KPI ──
function calculerEtAfficherStatistiques() {
  const livraisonsFiltrees = filtrerParPeriode(toutesLivraisons, periodeActive);
  const livrees = livraisonsFiltrees.filter(l => l.statut === 'livree');
  
  const totalGains = livrees.length * 30000;
  const nombreLivrees = livrees.length;
  const totalCourses = livraisonsFiltrees.length;
  
  const tauxReussite = totalCourses > 0 ? Math.round((nombreLivrees / totalCourses) * 100) : 100;
  const moyenneParCourse = nombreLivrees > 0 ? Math.round(totalGains / nombreLivrees) : 0;

  const elGains = document.getElementById('stat-gains-total');
  if (elGains) elGains.textContent = formatPrix(totalGains);

  const elLivrees = document.getElementById('stat-courses-livrees');
  if (elLivrees) elLivrees.textContent = nombreLivrees;

  const elTaux = document.getElementById('stat-taux-reussite');
  if (elTaux) elTaux.textContent = `${tauxReussite}%`;

  const elMoyenne = document.getElementById('stat-moyen-course');
  if (elMoyenne) elMoyenne.textContent = formatPrix(moyenneParCourse);

  afficherGraphiqueGains(livraisonsFiltrees, periodeActive);
}

// ── AFFICHAGE DU GRAPHIQUE ──
function afficherGraphiqueGains(livraisons, periode) {
  const canvas = document.getElementById('graphique-gains-livreur');
  if (!canvas) return;

  const { labels, fullDates, dataPoints } = obtenirStructureGraphique(livraisons, periode);

  if (chartGainsInstance) {
    chartGainsInstance.destroy();
  }

  const maxVal = Math.max(...dataPoints, 50000);
  const isMobile = window.innerWidth <= 600;

  const ctx = canvas.getContext('2d');
  chartGainsInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gains (GNF)',
        data: dataPoints,
        borderColor: '#FF6000',
        backgroundColor: 'rgba(255, 96, 0, 0.08)',
        borderWidth: isMobile ? 2.5 : 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#FF6000',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: (periode === 'annee' && isMobile) ? 3.5 : 5.5,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { left: 0, right: 8, top: 10, bottom: 0 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1A1A2E',
          titleColor: '#FFFFFF',
          titleFont: { size: 13, weight: 'bold' },
          bodyColor: '#FF6000',
          bodyFont: { size: 13, weight: 'bold' },
          padding: 12,
          borderRadius: 10,
          displayColors: false,
          callbacks: {
            title: (context) => {
              const idx = context[0].dataIndex;
              return fullDates[idx] || context[0].label;
            },
            label: (context) => `Gains : ${formatPrix(context.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: maxVal,
          grid: { color: '#F3F4F6' },
          ticks: {
            stepSize: Math.round(maxVal / 5),
            font: { size: isMobile ? 9.5 : 11, weight: 'bold' },
            color: '#374151',
            padding: 2,
            callback: (val) => {
              if (val >= 1000) {
                return `${Math.round(val / 1000)}k`;
              }
              return `${val}`;
            }
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: (periode === 'annee' && isMobile) ? 8.5 : 10.5, weight: 'bold' },
            color: '#374151',
            maxRotation: 0,
            autoSkip: false,
            padding: 4
          }
        }
      }
    }
  });
}

// ── ÉCOUTEURS DE FILTRE DE PÉRIODE (DROPDOWN CUSTOM HAUT DE GAMME) ──
function initFiltresDates() {
  const btnDropdown = document.getElementById('btn-dropdown-periode');
  const menuDropdown = document.getElementById('menu-periode-dropdown');
  const flecheDropdown = document.getElementById('fleche-dropdown');
  const labelSelectionne = document.getElementById('label-periode-selectionnee');
  const items = document.querySelectorAll('.dropdown-item-custom');

  if (!btnDropdown || !menuDropdown) return;

  btnDropdown.onclick = (e) => {
    e.stopPropagation();
    const estOuvert = menuDropdown.style.display === 'block';
    menuDropdown.style.display = estOuvert ? 'none' : 'block';
    if (flecheDropdown) flecheDropdown.style.transform = estOuvert ? 'rotate(0deg)' : 'rotate(180deg)';
  };

  document.addEventListener('click', (e) => {
    if (!btnDropdown.contains(e.target) && !menuDropdown.contains(e.target)) {
      menuDropdown.style.display = 'none';
      if (flecheDropdown) flecheDropdown.style.transform = 'rotate(0deg)';
    }
  });

  items.forEach(item => {
    item.onmouseenter = () => {
      if (!item.classList.contains('actif')) {
        item.style.background = '#F9FAFB';
      }
    };
    item.onmouseleave = () => {
      if (!item.classList.contains('actif')) {
        item.style.background = 'transparent';
      }
    };

    item.onclick = (e) => {
      e.stopPropagation();
      const val = item.dataset.val || 'aujourdhui';
      
      items.forEach(i => {
        i.classList.remove('actif');
        i.style.background = 'transparent';
        i.style.color = '#4B5563';
        i.style.fontWeight = '600';
        const ic = i.querySelector('i');
        if (ic) ic.style.color = '#9CA3AF';
      });

      item.classList.add('actif');
      item.style.background = '#FFF3EE';
      item.style.color = 'var(--orange)';
      item.style.fontWeight = '700';
      const iconeActif = item.querySelector('i');
      if (iconeActif) iconeActif.style.color = 'var(--orange)';

      const texteComplet = item.textContent.trim();
      if (labelSelectionne) labelSelectionne.textContent = texteComplet;

      menuDropdown.style.display = 'none';
      if (flecheDropdown) flecheDropdown.style.transform = 'rotate(0deg)';

      periodeActive = val;
      calculerEtAfficherStatistiques();
    };
  });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initFiltresDates();
  chargerDonneesStatistiques();
});

window.addEventListener('resize', () => {
  if (toutesLivraisons && toutesLivraisons.length >= 0) {
    calculerEtAfficherStatistiques();
  }
});
chargerDonneesStatistiques();
