document.addEventListener('DOMContentLoaded', () => {
  // 1. Récupérer la requête de recherche dans l'URL (ex: ?q=montre)
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';
  
  // Mettre à jour l'affichage de la requête et la barre de recherche
  const queryTextSpan = document.getElementById('recherche-query-text');
  const searchInput = document.getElementById('navbar-search-input');
  
  if (query) {
    if (queryTextSpan) queryTextSpan.textContent = `"${query}"`;
    if (searchInput) searchInput.value = query;
  } else {
    if (queryTextSpan) queryTextSpan.textContent = `"Toutes les recherches"`;
  }

  // ==== CHARGEMENT DES RÉSULTATS (FICTIFS) ====
  chargerResultatsRecherche(query);
});

function chargerResultatsRecherche(query) {
  const feed = document.getElementById('recherche-resultats-feed');
  if (!feed) return;

  // Base de données fictive
  const tousLesProduits = [
    { nom: "Sneakers Air Max", desc: "Chaussures de sport confortables pour toutes vos sorties.", prix: "600 000 GNF", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80" },
    { nom: "Montre Connectée Z-Pro", desc: "Suivez votre rythme cardiaque et recevez vos notifs.", prix: "350 000 GNF", img: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&q=80" },
    { nom: "Sac à main en cuir", desc: "Un style élégant pour les soirées chics.", prix: "250 000 GNF", img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&q=80" },
    { nom: "Casque Audio Sans Fil", desc: "Réduction de bruit active, 40h d'autonomie.", prix: "450 000 GNF", img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80" },
    { nom: "Appareil Photo Reflex", desc: "Capturez vos meilleurs moments avec une qualité 4K.", prix: "3 500 000 GNF", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80" },
    { nom: "Lunettes de Soleil", desc: "Protection UV400, monture en métal léger.", prix: "120 000 GNF", img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80" },
    { nom: "Parfum Élixir Boisé", desc: "Senteur masculine envoûtante, tenue longue durée.", prix: "550 000 GNF", img: "https://images.unsplash.com/photo-1523293115678-d2900f52f461?w=500&q=80" },
    { nom: "Enceinte Bluetooth", desc: "Son stéréo puissant, étanche IPX7.", prix: "300 000 GNF", img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80" },
    { nom: "Montre Classique en Cuir", desc: "Design intemporel, mouvement à quartz précis.", prix: "280 000 GNF", img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80" },
    { nom: "Sac à dos Urbain", desc: "Compartiment PC, imperméable et résistant.", prix: "180 000 GNF", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" }
  ];

  // Simuler un temps de chargement réseau
  setTimeout(() => {
    // Filtrage simple en JS
    const requeteClean = query.toLowerCase().trim();
    let resultats = tousLesProduits;

    if (requeteClean) {
      resultats = tousLesProduits.filter(p => 
        p.nom.toLowerCase().includes(requeteClean) || 
        p.desc.toLowerCase().includes(requeteClean)
      );
    }

    if (resultats.length === 0) {
      // Aucun résultat trouvé
      feed.innerHTML = `
        <div class="aucun-resultat" style="grid-column: 1 / -1;">
          <i class="fas fa-search-minus"></i>
          <h3>Aucun produit ne correspond à "${query}"</h3>
          <p>Essayez de vérifier l'orthographe ou d'utiliser des termes plus généraux.</p>
        </div>
      `;
      return;
    }

    // Afficher les résultats
    let html = '';
    resultats.forEach((p, index) => {
      const fakeId = index + 1000;
      const fakeCommerceId = (index % 3) + 1;
      const nomBoutique = "Boutique Recherche " + fakeCommerceId;
      const prixNumerique = parseInt(p.prix.replace(/[^0-9]/g, ''), 10) || 0;

      html += `
        <div class="produit-carte" style="background: var(--blanc); border-radius: var(--rayon-md); overflow: hidden; box-shadow: var(--ombre-sm); display: flex; flex-direction: column;">
          <img src="${p.img}" alt="${p.nom}" style="width: 100%; height: 200px; object-fit: cover; background: var(--fond);" />
          <div style="padding: 16px; display: flex; flex-direction: column; flex-grow: 1;">
            
            <div style="font-size: 0.85rem; color: var(--texte-gris); margin-bottom: 16px; flex-grow: 1;">${p.desc}</div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 700; color: var(--orange); font-size: 1.1rem;">${p.prix}</span>
            </div>
            
            <div class="produit-actions" style="margin-top: 15px; display: flex; gap: 8px; align-items: center;">
              <button title="Contacter" style="background: #1A1A2E; border: none; border-radius: 6px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #FFFFFF; flex-shrink: 0; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" onclick="window.location.href='../espace-client/messages.html?user=${fakeCommerceId}&p_nom=' + encodeURIComponent('${p.nom.replace(/'/g, "\\'")}') + '&p_prix=' + encodeURIComponent('${p.prix}') + '&p_img=' + encodeURIComponent('${p.img}')">
                <i class="fas fa-comment-dots" style="font-size: 1.1rem;"></i>
              </button>
              <button class="btn btn-orange" style="flex: 1; padding: 0; height: 34px; font-size: 0.8rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;" onclick="ajouterAuPanier(${fakeId}, '${p.nom.replace(/'/g, "\\'")}', ${prixNumerique}, '${p.img}', ${fakeCommerceId}, '${p.boutique.replace(/'/g, "\\'")}')">
                <i class="fas fa-cart-plus"></i> Ajouter
              </button>
            </div>
          </div>
        </div>
      `;
    });

    feed.innerHTML = html;
    
  }, 600); // 600ms de faux chargement pour voir l'effet
}
