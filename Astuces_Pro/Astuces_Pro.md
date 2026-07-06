# 💡 Les Astuces Pro du Développement Web

Ce document regroupe toutes les astuces, bonnes pratiques et explications techniques pour t'aider à maîtriser le développement web au fur et à mesure que nous construisons AdduGo.

---

### Astuce #1 : Automatiser le redémarrage avec Nodemon
*Date : 1er Juillet 2026*

Quand tu codes ton backend (Node.js), à chaque fois que tu modifies un fichier, tu dois arrêter et relancer le serveur manuellement pour voir les changements. C'est vite fatigant ! 
La solution des pros, c'est d'utiliser un outil qui s'appelle **Nodemon**. Au lieu de lancer ton serveur avec `node server.js`, tu le lances avec `npx nodemon server.js`. Nodemon va surveiller tes fichiers : dès que tu feras `Ctrl + S` pour sauvegarder une modification, il redémarrera le serveur tout seul en une fraction de seconde !

---

### Astuce #2 : Toujours détruire un graphique dynamique (Chart.js)
*Date : 1er Juillet 2026*

Lorsqu'on utilise des librairies de graphiques comme **Chart.js** pour créer des tableaux de bord dynamiques (comme l'interface de Statistiques), il y a un piège classique : si tu veux mettre à jour le graphique avec de nouvelles données, il ne suffit pas de le redessiner par-dessus l'ancien ! 
Si tu fais ça, les deux graphiques vont se superposer en mémoire. Visuellement ça a l'air normal, mais quand tu passeras ta souris dessus (pour voir les détails au survol), l'ancien graphique va "clignoter" et se mélanger avec le nouveau.
**La bonne pratique :** Toujours garder l'instance du graphique dans une variable, et faire un `.destroy()` dessus avant d'en créer un nouveau. Exemple :
```javascript
if (monGraphique) {
  monGraphique.destroy();
}
// Ensuite on crée le nouveau
monGraphique = new Chart(...)
```

---

### Astuce #3 : Le piège des styles "en ligne" (Inline Styles)
*Date : 1er Juillet 2026*

En CSS, tous les styles n'ont pas la même force. C'est ce qu'on appelle la **Spécificité**.
Si tu ajoutes une classe CSS (ex: `.mon-bouton { background: blue; }`) dans un fichier séparé, mais que directement dans ton HTML tu écris `<button style="background: white;">`, c'est le style HTML "en ligne" qui va **toujours gagner** ! 
Cela pose un gros problème quand tu veux ajouter des effets comme `:hover` (au survol) dans ton fichier CSS : le style "en ligne" bloquera le changement de couleur.
**La bonne pratique :** Évite un maximum les attributs `style="..."` dans ton HTML. Regroupe toujours tout dans des classes CSS, tu auras ainsi un code plus propre et tu pourras facilement gérer les animations et les survols de souris !

---

### Astuce #4 : L'effet "Glow" (Ombre portée colorée)
*Date : 1er Juillet 2026*

Dans le design d'applications web modernes (souvent appelé UI/UX), donner du relief aux éléments actifs est essentiel. Lorsqu'un bouton est cliqué, ou qu'une carte est survolée, on utilise la propriété CSS **`box-shadow`** (ombre de boîte).
Mais au lieu de faire une ombre noire classique qui donne un effet "sale" ou dépassé, la grande tendance est de faire une **ombre de la même couleur que l'élément**, avec beaucoup de transparence.

Exemple : Si ton bouton est Orange (`#ff6b00`), tu vas lui appliquer une ombre avec la couleur rgba(255, 107, 0, 0.4) (le `0.4` signifiant 40% de visibilité). 
Cela crée un effet de **"Glow" (lueur, ou rayonnement)** très élégant qui donne l'impression que le bouton émet de la lumière et sort de l'écran. C'est l'un des secrets pour passer d'un design basique à un design "Premium" !

---

### Astuce #5 : Manipuler et formater les dates intelligemment en JavaScript
*Date : 1er Juillet 2026*

Lorsqu'on doit afficher des dates (comme dans un graphique) de manière dynamique, sans jamais se tromper de jour, de mois ou d'année bissextile, il ne faut **jamais** essayer de calculer le calendrier soi-même à la main (ex: faire `- 30 jours` et calculer le mois précédent).

**La bonne pratique :** Déléguer tout ce travail à l'objet interne **`Date`** de JavaScript, combiné avec `toLocaleDateString`.
1. **Création et Recul Temporel** : Si l'on veut obtenir la date d'il y a 5 jours, il suffit de récupérer la date actuelle (`let maDate = new Date();`) puis de dire au moteur JavaScript de reculer (`maDate.setDate(maDate.getDate() - 5);`). C'est le moteur qui fera tous les calculs complexes pour savoir si l'on change de mois ou d'année !
2. **Formatage linguistique ultra-propre** : Au lieu de coller des bouts de texte manuellement, les pros utilisent `maDate.toLocaleDateString('fr-FR', options)`. En lui donnant des options comme `{ weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }`, JavaScript s'occupe de tout traduire parfaitement pour afficher **"mercredi 01 juillet 2026"**. C'est propre, sûr à 100%, et ça gère même les fusions de langues !

---

### Astuce #6 : Centraliser une interface commune tout en gardant un contexte dynamique
*Date : 2 Juillet 2026*

Dans une application web multi-rôles (ex: Clients, Commerçants, Livreurs), créer un fichier HTML distinct pour chaque rôle quand l'outil est identique (ex: la messagerie) est une mauvaise pratique qui alourdit le projet.

**La bonne pratique des pros :**
1. **Fichier unique centralisé** : On crée un seul fichier `messages.html`. Si des anciennes URLs existent encore (`/commerce/messages.html`, `/livreur/messages.html`), on y place un script de redirection ultra-rapide vers le fichier central avec un paramètre de provenance (`?from=commerce` ou `?from=livreur`).
2. **Barre de navigation adaptative en JS** : C'est le script JavaScript de la page qui analyse l'URL et les rôles de l'utilisateur stockés pour adapter dynamiquement :
   - Les icônes de la barre de navigation (ex: montrer *Commandes* & *Boutique* pour un marchand, ou *Livraisons* pour un livreur).
   - Les options du menu profil déroulant.

Cette approche évite d'avoir à dupliquer le code HTML/CSS à 3 endroits différents, tout en offrant une expérience personnalisée et sur-mesure pour chaque type d'utilisateur !

---

### Astuce #7 : Éviter le piège des valeurs `undefined` dans les requêtes SQL (MariaDB / MySQL)
*Date : 2 Juillet 2026*

Lorsqu'on effectue des requêtes SQL paramétrées en Node.js avec le driver MariaDB/MySQL (ex: `conn.query(sql, [nom, description, adresse, telephone])`), il existe un piège très fréquent en travaillant avec des formulaires `FormData`.

Si des champs secondaires ne sont pas transmis par le client (par exemple `adresse` ou `telephone`), leur valeur en JavaScript devient `undefined`. 
Le driver MariaDB refuse catégoriquement d'insérer des éléments `undefined` dans les paramètres bindés et lève une erreur fatale (`TypeError: Bind parameters must not be undefined`), provoquant immédiatement une **Erreur serveur 500** à l'écran de l'utilisateur !

**La solution des pros :**
Toujours appliquer un fallback explicite vers `null` pour tout paramètre SQL facultatif :
```javascript
const nom = req.body?.nom || null;
const description = req.body?.description || null;
const adresse = req.body?.adresse || null;
const telephone = req.body?.telephone || null;
```
En faisant ainsi, si un paramètre est omis, MySQL reçoit la valeur `null` (ce qui est 100% valide avec la fonction SQL `COALESCE(?, adresse)`), la requête s'exécute parfaitement et aucune erreur serveur n'est générée !

---

### Astuce #8 : Concevoir des barres de navigation mobiles fixes en haut et en bas sans chevauchement
*Date : 2 Juillet 2026*

Dans le développement d'applications web mobiles modernisées (PWA / Web Mobile App), l'ergonomie repose souvent sur **deux barres de navigation statiques** :
1. **La barre d'en-tête (Top Bar)** : contient le logo, le titre d'espace et le menu profil.
2. **La barre d'action inférieure (Bottom Tab Bar)** : contient les icônes de navigation principales (`Accueil`, `Ma Boutique`, `Messages`).

**Le problème fréquent :**
Lors du défilement de la page (scroll), le contenu passe sous les barres et la fin de la page ou les boutons d'action restent masqués derrière la barre inférieure !

**La solution des pros :**
1. **Verrouiller les barres avec `position: fixed`** et attribuer des `z-index` élevés (`z-index: 9998` en haut, `9999` en bas).
2. **Ajouter un `padding-top` et `padding-bottom` explicite sur le `body` ou le conteneur principal** correspondant exactement aux hauteurs des deux barres (ex: `padding-top: 64px !important;` et `padding-bottom: 75px !important;`).
3. **Prendre en compte les encoches d'iPhone (iOS Safe Area)** avec la fonction CSS `env(safe-area-inset-bottom, 0px)` dans le `padding-bottom` de la barre du bas.
---

### Astuce #9 : Gérer dynamiquement la disposition des sous-barres de recherche mobiles avec le sélecteur CSS `:has()`
*Date : 2 Juillet 2026*

Sur smartphone, placer la barre de recherche sur la même ligne que l'en-tête (Logo + Titre d'espace) provoque un écrasement visuel où le champ de recherche se retrouve tronqué.

**La solution moderne en CSS natif :**
Plutôt que d'écrire des scripts JS complexes pour mesurer la présence d'une barre de recherche, on utilise le pseudo-sélecteur CSS moderne `:has()` :
```css
/* Si la navbar d'en-tête contient une barre de recherche (.navbar-home-recherche) */
.navbar-home:has(.navbar-home-recherche) {
  height: auto !important;
  min-height: 106px !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  padding: 8px 12px !important;
  gap: 6px !important;
}

/* Ajuster automatiquement le padding-top du body uniquement pour les pages avec recherche */
body:has(.navbar-home-recherche) {
  padding-top: 112px !important;
}
```
**Avantage :** Sur les pages avec recherche (ex: `produits.html`), l'en-tête passe automatiquement sur 2 lignes (Ligne 1 : Logo & Titre, Ligne 2 : Barre de recherche complète). Sur les pages sans recherche (ex: `statistiques.html`), l'en-tête reste compact sur 1 seule ligne à 60px de hauteur !

---

### Astuce #10 : Structurer les tableaux de bord analytiques en panneaux unifiés (Card Panels)
*Date : 2 Juillet 2026*

Dans les interfaces de tableaux de bord modernes (Dashboard UX), éparpiller le titre de bienvenue, les boutons d'action, les filtres de dates et les cartes de données (KPIs) sur plusieurs blocs distincts crée un encombrement visuel inutile.

**La bonne pratique des pros :**
Regrouper tous les éléments de contrôle supérieurs dans un **Panneau Unifié (Card Panel)** doté d'un fond blanc clair, d'un léger contour (`border: 1px solid #E5E7EB`) et d'une ombre subtile (`box-shadow: 0 4px 16px rgba(0,0,0,0.02)`).

1. **Ligne 1** : Titre d'espace à gauche, Bouton d'action principal à droite (`Voir mes livraisons` en Noir Siphon `#1A1A2E`).
2. **Ligne 2** : Filtres temporels de dates (`Aujourd'hui`, `7 Derniers Jours`, `30 Derniers Jours`, `Cette Année`).
3. **Ligne 3** : Grille de cartes KPIs aux couleurs pastels douces (`#FFF3EE`, `#E8F5E9`, `#EFF6FF`, `#FFF9E6`).

Cette disposition crée une hiérarchie visuelle parfaite où l'utilisateur contrôle toute la période de son analyse avant de lire le graphique principal !

---

### Astuce #11 : Optimiser la lisibilité des axes de graphiques mobiles (Chart UX)
*Date : 2 Juillet 2026*

Sur les appareils mobiles, l'espace horizontal disponible pour les graphiques est restreint. Afficher des devises longues comme "GNF" sur chaque graduation de l'axe Y (ex: `50 000 GNF`, `40 000 GNF`) compresse la zone du graphique et rend les montants illisibles.

**La bonne pratique des pros :**
1. **Épurage de l'axe Y** : Remplacer la répétition de la devise par un format abrégé compact (`50k`, `40k`, `30k`, `20k`, `10k`, `0`). Cela libère immédiatement 40% de largeur pour étendre la courbe du graphique.
2. **Transfert de la précision vers le Tooltip** : Lorsqu'un utilisateur touche un point du graphique, la carte noire détaillée (`#1A1A2E`) prend le relais pour afficher le montant complet avec la devise exacte (ex: `Gains : 50 000 GNF`) ainsi que la date complète (ex: `Vendredi 26 Juin 2026`).

Cette séparation entre **lisibilité d'axe épurée** et **carte d'information au toucher** offre une expérience utilisateur ultra-moderne digne des plus grandes applications du marché !

---

### Astuce #13 : Centralisation de la Déconnexion et Redirection dynamique d'URL
*Date : 3 Juillet 2026*

Dans une application web comportant plusieurs sous-dossiers de pages (ex: `/pages/client/`, `/pages/commerce/`, `/pages/livreur/`, `/pages/admin/`), rediriger manuellement un utilisateur après déconnexion avec des chemins fixes (comme `login.html` ou `../login.html`) crée des erreurs d'URL introuvables (erreurs 404) ou renvoie l'utilisateur vers des sous-dossiers incorrects.

**La bonne pratique des pros :**
1. **Fonction utilitaire globale unique (`seDeconnecter()`)** : Créer une fonction centrale placée dans `api.js` (le fichier JavaScript principal inclus sur toutes les pages).
2. **Nettoyage du stockage local** : Supprimer l'ensemble des clés d'authentification et de session (`addugo_token`, `addugo_user`, `addugo_commerce_id`) en une seule opération propre.
3. **Calcul dynamique de la profondeur du chemin (`window.location.pathname`)** : La fonction calcule la profondeur de la page actuelle dans l'arborescence du site et redirige précisément vers la page d'accueil initiale **`index.html`** :
   - Depuis une sous-page (`/pages/client/dashboard.html`) ➔ `../../index.html`
   - Depuis un dossier intermédiaire (`/pages/home.html`) ➔ `../index.html`
   - Depuis la racine ➔ `index.html`
4. **Attachement automatique d'écouteurs** : Un écouteur global `DOMContentLoaded` dans `api.js` attache automatiquement la déconnexion à tous les boutons portant la classe `.btn-deconnexion` ou l'identifiant `#btn-logout` dans toute l'application.

---

### Astuce #14 : Simplification UX du Profil et Élimination des Bannières Lentes
*Date : 3 Juillet 2026*

Dans la conception d'interfaces utilisateur modernes (Web & Mobile UX), surcharger la page profil avec des images de couverture de bannière à charger pose plusieurs problèmes majeurs :
- Ralentissement du temps de chargement sur les réseaux mobiles 3G/4G.
- Problèmes d'alignement et de chevauchement du texte sur petits écrans d'écrans mobiles.
- Complexité inutile de stockage en base de données pour un élément sans valeur ajoutée transactionnelle.

**La bonne pratique des pros :**
1. **Header de Profil Épuré et Rapide** : Remplacer la grande bannière de couverture par un Panneau d'En-tête Blanc unifié (`carte-profil-header`) comprenant un avatar circulaire (100px x 100px) avec survol caméra pour changer la photo, le nom en gras, le badge de rôle et un badge d'authenticité vert (**`🟢 Compte Vérifié`**).
2. **Formulaires enrichis et ergonomiques** :
   - Intégrer les cartes de sélection de genre (**👨 Homme** / **👩 Femme**).
   - Ajouter la géolocalisation et l'adresse (**📍 Adresse / Zone**).
   - Intégrer des basculeurs de visibilité d'œils (`👁️`) sur tous les champs de mots de passe pour garantir une saisie sans erreur sur écran tactile.
---

### Astuce #15 : Centralisation vers une Page HTML Unique & Redirection de Rétro-compatibilité
*Date : 3 Juillet 2026*

Lors de la refonte d'une application multi-dossiers (ex: `/pages/client/`, `/pages/commerce/`, `/pages/livreur/`, `/pages/admin/`), dupliquer des fichiers HTML identiques dans chaque sous-dossier alourdit la maintenance du code et risque de créer des décalages visuels.

**La bonne pratique des pros :**
1. **Création du Fichier Unique Centralisé** : Désigner une seule page HTML maître (`client/profil.html`) gérée par le script unique `shared-profil.js`.
2. **Redirection de rétro-compatibilité instantanée (`window.location.replace`)** : Placer dans les anciens emplacements (`commerce/profil.html`, `livreur/profil.html`, `admin/profil.html`) un script ultra-léger de redirection :
   ```html
   <script>
     window.location.replace("../client/profil.html?from=livreur");
   </script>
   ```
3. **Avantages du `location.replace` par rapport à `location.href`** : `replace()` n'ajoute pas l'ancienne URL dans l'historique du navigateur. Ainsi, lorsque l'utilisateur clique sur le bouton "Retour" de son navigateur, il n'est pas bloqué dans une boucle de redirection infinie !

---

### Astuce #16 : Agrégation Dynamique des Données de Graphiques par Mois et Semaine Réels
*Date : 3 Juillet 2026*

Lors de l'affichage d'un graphique d'évolution temporelle (ex: Gains annuels avec Chart.js), une erreur classique consiste à affecter la totalité du montant annuel au seul mois en cours, ou à utiliser une répartition théorique par pourcentages fixes. Cela produit une courbe faussée avec un pic unique irréaliste et des mois passés désespérément plats.

**La bonne pratique des pros :**
1. **Initialiser la structure temporelle complète** : Créer un tableau `dataPoints` rempli de zéro pour tous les 12 mois de l'année (`Array(12).fill(0)`).
2. **Grouper par date réelle d'événement** : Parcourir chaque transaction livrée, lire le mois exact de la commande via `d.getMonth()` (0 pour Janvier, 1 pour Février... 11 pour Décembre), et additionner le montant au bon index :
   ```javascript
   const m = d.getMonth();
   dataPoints[m] += Number(l.montant_total) || 0;
   ```
3. **Calcul par différence de jours pour les périodes récentes** : Pour les filtres 30 jours, calculer la différence en jours (`diffJours = Math.floor((maintenant - d.getTime()) / 86400000)`) pour ventiler les montants dans les 4 semaines exactes.

---

### Astuce #17 : Optimisation de l'Axe Y et Lisibilité Responsive des Graphiques (Chart.js sur Mobile)
*Date : 3 Juillet 2026*

Sur petit écran mobile, deux problèmes visuels récurrents surviennent avec les graphiques de données (ex: 12 mois de l'année) :
1. **L'Axe Y trop éloigné de la bordure gauche** : Les valeurs (`50k`, `40k`, `30k`...) prennent trop d'espace horizontal, ce qui compresse la zone d'affichage de la courbe.
2. **Chevauchement des 12 libellés de l'Axe X** : Les noms des mois (`JanFévMarAvrMaiJuinJuil...`) se télescopent car la largeur de l'écran n'est pas suffisante pour 12 mots de 3 ou 4 lettres.

**La bonne pratique des pros :**
1. **Plaquer l'Axe Y à l'extrême gauche** :
   - Définir `layout.padding: { left: 0, right: 8, top: 10, bottom: 0 }`.
   - Réduire `ticks.padding: 2` dans l'échelle `y` pour coller les chiffres à la marge.
2. **Adaptation responsive intelligente de l'Axe X** :
   - Si `window.innerWidth <= 600` (Mobile) : Utiliser des libellés ultra-courts (`['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']`), une police `8.5px` et réduire la taille des puces (`pointRadius: 3.5`).
   - Conserver dans le `tooltip` (au clic/survol) la date en toutes lettres (`Janvier 2026`, `Février 2026`).

---

### Astuce #18 : Injections Dynamiques et Harmonisation Centralisée des Menus Déroulants
*Date : 3 Juillet 2026*

Plutôt que de devoir éditer manuellement le code HTML de chaque menu déroulant de profil sur des dizaines de fichiers HTML, la meilleure pratique d'architecture web consiste à déléguer la génération du contenu de menu à un script de navbar centralisé (`navbar.js`).

**La bonne pratique des pros :**
1. **Conteneur HTML cible neutre** : Laisser un conteneur `<div class="dropdown-menu-container"></div>` dans l'en-tête HTML.
2. **Génération dynamique selon le contexte et les rôles dans `navbar.js`** :
   - Calculer le chemin relatif dynamique (`basePath = '../'`).
   - Lire les rôles réels de l'utilisateur (`user.roles`) et la page active (`window.location.pathname`).
   - Injecter dynamiquement les 5 liens unifiés (*Mon Profil*, *Home*, *Mon Espace Client*, *Mon Espace Livreur*, *Ma Boutique*, *Se déconnecter*).
   - Marquer automatiquement l'élément actif avec la classe `.actif`.

---

### Astuce #19 : Gestion Équitable et Dynamique du Fil d'Accueil Marketplace (Algorithme Fisher-Yates & Masquage Vendeur)
*Date : 3 Juillet 2026*

Sur un fil d'accueil Marketplace (Home feed), deux contraintes d'expérience utilisateur (UX) et de business sont primordiales :
1. **L'Équité de visibilité entre commerçants** : Sans algorithme de mélange, ce sont toujours les mêmes premières boutiques enregistrées qui apparaissent au sommet.
2. **La pertinence du feed Commerçant** : Un vendeur se connecte sur l'Accueil pour découvrir ce que les autres vendent. Il n'a aucun intérêt à voir ses propres articles sur son propre fil d'actualité général.

**La bonne pratique des pros :**
1. **Masquage dynamique des propres produits du vendeur** :
   ```javascript
   if (user && user.id) {
     produitsAffiches = produits.filter(p => Number(p.commerce_utilisateur_id) !== Number(user.id));
   }
   ```
2. **Mélange dynamique Fisher-Yates à chaque rafraîchissement** :
   ```javascript
   function melangerTableau(arr) {
     const res = [...arr];
     for (let i = res.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [res[i], res[j]] = [res[j], res[i]];
     }
     return res;
   }
   ```
3. **Cartes Produits Valorisons la Marque (Merchant Brand Card)** : Intégrer au pied de chaque carte la photo du commerçant/logo boutique et son nom en gras (`font-weight: 800`) pour humaniser l'achat et créer la confiance.




---

### Astuce #18 : Le "Cold Start" des serveurs gratuits (Railway, Render, etc.)
*Date : 6 Juillet 2026*

Quand ton application semble "lente" au chargement, la cause est souvent le **Cold Start** (démarrage à froid). Voici ce qui se passe :

Les serveurs gratuits (Railway gratuit, Render gratuit, Heroku Eco) **mettent ton serveur en veille** quand personne ne l'utilise pendant 15–30 minutes, pour économiser des ressources. La prochaine fois qu'un utilisateur arrive, le serveur doit "se réveiller" — ce réveil peut prendre **2 à 10 secondes**. Pendant ce temps, toutes les requêtes API attendent.

**Solutions selon ton niveau :**
- **Simple (gratuit)** : Ajouter un service de ping régulier comme UptimeRobot qui appelle ton URL Railway toutes les 5 minutes pour garder le serveur éveillé.
- **Moyen** : Passer sur le plan payant de Railway (~5$/mois) qui ne met jamais en veille.
- **Pro** : Afficher un écran de "Chargement..." élégant à l'utilisateur pendant ce temps, pour que l'attente ne soit pas frustrante.

---

### Astuce #19 : HTML statique vs. Contenu Dynamique — Un piège classique
*Date : 6 Juillet 2026*

Un piège très courant en développement web : **écrire du contenu en dur (statique) dans le HTML alors que ce contenu devrait être dynamique**.

**Exemple typique :** Un dropdown de notifications qui dit "Aucune notification" dans le HTML, alors qu'on a un badge JavaScript qui compte les vraies notifications. Le badge se met à jour, mais le contenu du dropdown affiche toujours la phrase figée dans le fichier `.html`.

**La règle d'or :** Tout contenu qui **dépend de données utilisateur** (messages, notifications, panier, profil) ne doit **jamais** être écrit en dur dans le HTML. Il doit avoir :
1. Un **id unique** sur l'élément conteneur (`id="messages-dropdown-liste"`)
2. Un **texte de chargement temporaire** comme placeholder (`Chargement...`)
3. Une **fonction JavaScript** qui remplace ce contenu dès que les vraies données arrivent

```html
<!-- ❌ MAUVAIS : Contenu figé -->
<div>Aucun nouveau message.</div>

<!-- ✅ BON : Conteneur dynamique avec ID -->
<div id="messages-dropdown-liste">Chargement...</div>
```

```javascript
// Le JS injecte le vrai contenu après l'appel API
document.getElementById('messages-dropdown-liste').innerHTML = vraiContenu;
```



