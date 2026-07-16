document.addEventListener('DOMContentLoaded', async () => {
  // 1. Récupérer l'ID du commerce
  const urlParams = new URLSearchParams(window.location.search);
  let commerceId = urlParams.get('commerce_id');

  // Si pas dans l'URL, tenter de récupérer le premier commerce
  if (!commerceId) {
    try {
      const res = await apiFetch('/commerces/mes/commerces');
      const data = await res.json();
      if (data.success && data.commerces.length > 0) {
        commerceId = data.commerces[0].id;
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!commerceId) {
    alert("Aucun commerce sélectionné.");
    return;
  }

  // Configuration des boutons de filtrage
  const btnFiltres = document.querySelectorAll('.btn-filtre-date');
  btnFiltres.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Retirer l'état actif de tous
      btnFiltres.forEach(b => b.classList.remove('actif'));
      // Ajouter l'état actif sur le bouton cliqué
      e.target.classList.add('actif');
      
      const jours = parseInt(e.target.getAttribute('data-jours'), 10);
      chargerStatistiques(jours);
    });
  });

  // Charger par défaut "Aujourd'hui" (0 jours)
  chargerStatistiques(0);

  // --- FONCTION DE CHARGEMENT ---
  async function chargerStatistiques(jours = 0) {
    // Afficher le spinner dans le top produits
    const listeTop = document.getElementById('liste-top-produits');
    listeTop.innerHTML = `
      <div style="text-align: center; color: var(--texte-gris); padding: 20px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px; color: var(--orange);"></i>
        <p>Chargement des statistiques...</p>
      </div>
    `;

    try {
      const response = await apiFetch(`/commerces/${commerceId}/statistiques?jours=${jours}`);
      
      if (!response.ok) {
        listeTop.innerHTML = 
          '<p style="text-align: center; color: var(--erreur); font-weight: 600;">Erreur : La route API est introuvable.<br>Avez-vous bien redémarré votre serveur Backend (node) ?</p>';
        return;
      }

      const res = await response.json();
      if (res.success) {
        const data = res.data;
        
        // -- Mettre à jour les KPIs
        document.getElementById('kpi-ca').textContent = new Intl.NumberFormat('fr-GN').format(data.kpis.chiffre_affaires) + '\u00A0GNF';
        document.getElementById('kpi-commandes').textContent = data.kpis.commandes_total;
        document.getElementById('kpi-attente').textContent = data.kpis.commandes_attente;
        document.getElementById('kpi-produits').textContent = data.kpis.produits_actifs;

        // -- Mettre à jour le Top Produits
        if (data.top_produits.length === 0) {
          listeTop.innerHTML = `
            <div class="top-produits-vide">
              <div class="top-produits-vide-icon">
                <i class="fas fa-box-open"></i>
              </div>
              <h4>Aucune vente sur cette période</h4>
              <p>Vos produits les plus vendus apparaîtront ici dès votre première vente !</p>
            </div>
          `;
        } else {
          listeTop.innerHTML = '';
          data.top_produits.forEach(prod => {
            let imageUrl = '../../assets/img/placeholder.png';
            if (prod.images) {
              try {
                const images = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
                if (images.length > 0) {
                  imageUrl = images[0].startsWith('http') 
                    ? images[0] 
                    : `https://addugo.up.railway.app${images[0].startsWith('/') ? '' : '/'}${images[0]}`;
                }
              } catch (e) {}
            }

            const div = document.createElement('div');
            div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 15px; border: 1px solid var(--bordure); border-radius: 10px; background: var(--fond-tres-clair); transition: transform 0.2s;';
            div.onmouseover = () => div.style.transform = 'translateX(5px)';
            div.onmouseout = () => div.style.transform = 'translateX(0)';

            div.innerHTML = `
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${imageUrl}" alt="${prod.nom}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; color: var(--texte);">${prod.nom}</h4>
                  <span style="font-size: 0.85rem; color: var(--texte-gris);">${prod.total_vendus} ventes</span>
                </div>
              </div>
              <div style="font-weight: 700; color: var(--orange);">
                ${new Intl.NumberFormat('fr-GN').format(prod.revenu_genere)}&nbsp;GNF
              </div>
            `;
            listeTop.appendChild(div);
          });
        }

        // -- Initialiser les Graphiques
        initCharts(data.revenus_chart, data.categories_chart, jours);

      } else {
        console.error(res.message);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques', error);
    }
  }
});

// Variables globales pour garder une référence aux graphiques
let lineChart = null;
let doughnutChart = null;

function initCharts(revenusData, categoriesData, jours = 7) {
  // Détruire les anciens graphiques s'ils existent (Très important dans les filtres pour éviter les superpositions)
  if (lineChart) lineChart.destroy();
  if (doughnutChart) doughnutChart.destroy();

  // Config globale Chart.js
  Chart.defaults.font.family = "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  Chart.defaults.color = '#7d879c';

  // 1. Graphique des Revenus (Ligne)
  const ctxRevenus = document.getElementById('chart-revenus').getContext('2d');

  // Préparer les données dynamiquement selon le filtre (jours)
  const isMobile = window.innerWidth <= 768;
  jours = parseInt(jours, 10);
  let labelsRevenus = [];
  let fullDates = [];
  let dataRevenus = [];

  if (jours === 0) {
    // Aujourd'hui: 00H à 23H
    labelsRevenus = Array.from({length: 24}).map((_, i) => `${String(i).padStart(2, '0')}H`);
    fullDates = Array.from({length: 24}).map((_, i) => `Aujourd'hui à ${String(i).padStart(2, '0')}H`);
    dataRevenus = Array(24).fill(0);

    revenusData.forEach(r => {
      const h = new Date(r.date).getHours();
      dataRevenus[h] += r.total;
    });

  } else if (jours === 7 || jours === undefined) {
    // 7 Jours: Lundi à Dimanche (Les 7 derniers jours)
    labelsRevenus = Array(7).fill('');
    fullDates = Array(7).fill('');
    dataRevenus = Array(7).fill(0);
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const idx = 6 - i;
      labelsRevenus[idx] = d.toLocaleDateString('fr-FR', { weekday: isMobile ? 'short' : 'long' }).replace('.', '');
      labelsRevenus[idx] = labelsRevenus[idx].charAt(0).toUpperCase() + labelsRevenus[idx].slice(1);
      
      let f = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      fullDates[idx] = f.charAt(0).toUpperCase() + f.slice(1);
      
      const match = revenusData.find(r => new Date(r.date).toDateString() === d.toDateString());
      if (match) dataRevenus[idx] += match.total;
    }

  } else if (jours === 30) {
    // 30 Jours: 4 Semaines
    labelsRevenus = isMobile 
      ? ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
      : ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'];
    
    fullDates = ['Semaine 1 (J-30 à J-22)', 'Semaine 2 (J-21 à J-15)', 'Semaine 3 (J-14 à J-8)', 'Semaine 4 (Les 7 derniers jours)'];
    dataRevenus = Array(4).fill(0);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    revenusData.forEach(r => {
      const d = new Date(r.date);
      d.setHours(0,0,0,0);
      const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) dataRevenus[3] += r.total;
      else if (diffDays <= 14) dataRevenus[2] += r.total;
      else if (diffDays <= 21) dataRevenus[1] += r.total;
      else dataRevenus[0] += r.total;
    });

  } else if (jours === 365) {
    // Année: Les 12 mois de l'année en cours
    const currentYear = new Date().getFullYear();
    labelsRevenus = Array(12).fill('');
    fullDates = Array(12).fill('');
    dataRevenus = Array(12).fill(0);
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentYear, i, 1);
      labelsRevenus[i] = d.toLocaleDateString('fr-FR', { month: isMobile ? 'short' : 'long' }).replace('.', '');
      labelsRevenus[i] = labelsRevenus[i].charAt(0).toUpperCase() + labelsRevenus[i].slice(1);
      
      fullDates[i] = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      fullDates[i] = fullDates[i].charAt(0).toUpperCase() + fullDates[i].slice(1);
      
      const match = revenusData.find(r => new Date(r.date).getMonth() === i && new Date(r.date).getFullYear() === currentYear);
      if (match) dataRevenus[i] += match.total;
    }
  }

  // Créer un dégradé pour la courbe
  let gradientOrange = ctxRevenus.createLinearGradient(0, 0, 0, 400);
  gradientOrange.addColorStop(0, 'rgba(255, 107, 0, 0.4)');
  gradientOrange.addColorStop(1, 'rgba(255, 107, 0, 0.0)');

  lineChart = new Chart(ctxRevenus, {
    type: 'line',
    data: {
      labels: labelsRevenus,
      datasets: [{
        label: 'Revenus',
        data: dataRevenus,
        borderColor: '#FF6B00',
        backgroundColor: gradientOrange,
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#FF6B00',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4 // Courbes lissées
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 13, family: "'Inter', sans-serif" },
          bodyFont: { size: 14, weight: 'bold', family: "'Inter', sans-serif" },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(tooltipItems) {
              return fullDates[tooltipItems[0].dataIndex];
            },
            label: function(context) {
              let value = context.raw || 0;
              return 'Revenus : ' + new Intl.NumberFormat('fr-GN').format(value) + '\u00A0GNF';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false }
        },
        y: {
          grid: { color: '#f1f3f5', drawBorder: false },
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return value >= 1000 ? (value/1000) + 'k' : value;
            }
          }
        }
      }
    }
  });

  // 2. Graphique des Catégories (Donut)
  const ctxCategories = document.getElementById('chart-categories').getContext('2d');
  
  const labelsCategories = categoriesData.length ? categoriesData.map(c => c.categorie) : ['Aucune vente'];
  const dataCategories = categoriesData.length ? categoriesData.map(c => c.total_vendus) : [1];
  
  doughnutChart = new Chart(ctxCategories, {
    type: 'doughnut',
    data: {
      labels: labelsCategories,
      datasets: [{
        data: dataCategories,
        backgroundColor: [
          '#FF6B00', // Orange principal
          '#007bff', // Bleu
          '#28a745', // Vert
          '#ffc107', // Jaune
          '#17a2b8', // Cyan (au lieu de violet)
          '#fd7e14'  // Orange clair (au lieu de rose)
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%', // Rendre le donut très fin
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 10,
          cornerRadius: 8
        }
      }
    }
  });
}
