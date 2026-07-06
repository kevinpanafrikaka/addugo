document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('addugo_token');
  const userStr = localStorage.getItem('addugo_user');
  
  if (!token || !userStr) {
    window.location.href = '../login.html';
    return;
  }
  
  const currentUser = JSON.parse(userStr);
  let currentOtherUserId = null;
  let conversationsList = [];
  let currentMessagesJson = '[]';

  const conversationsContainer = document.getElementById('conversations-list');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');
  const chatHeader = document.getElementById('chat-header');
  const searchInput = document.getElementById('search-conversations');

  // Affichage du header initial
  chatHeader.innerHTML = `
    <div style="display:flex; align-items:center; gap:15px;">
      <div>
        <h2 style="font-size:1.15rem; margin:0; font-family:var(--police-titre); color:var(--texte);">Sélectionnez une conversation</h2>
        <p style="font-size:0.82rem; margin:2px 0 0 0; color:var(--texte-clair);">Vos échanges s'afficheront ici</p>
      </div>
    </div>
  `;
  chatMessages.innerHTML = `
    <div style="text-align:center; margin:auto; padding:40px; color:var(--texte-clair);">
      <i class="fas fa-comments" style="font-size:3rem; color:var(--bordure); margin-bottom:12px;"></i>
      <div style="font-size:0.95rem; font-weight:600;">Bienvenue dans votre messagerie AdduGo</div>
      <div style="font-size:0.83rem; margin-top:4px;">Choisissez une conversation à gauche pour échanger en direct.</div>
    </div>
  `;

  // ==== INJECTION DES 3 ICÔNES NAVBAR POUR MESSAGERIE COMMUNE ====
  function initialiserNavbarContextuelle() {
    const roles = currentUser.roles || ['client'];
    const navbarDroite = document.getElementById('navbar-droite-messages');
    if (!navbarDroite) return;

    // Isoler le wrapper profil existant pour ne pas le détruire
    const profilWrapper = document.getElementById('profil-wrapper');
    const profilWrapperHTML = profilWrapper ? profilWrapper.outerHTML : '';

    // 1. Icône Accueil (Home)
    const iconAccueil = `
      <a href="../home.html" class="nav-icone icone-accueil" title="Accueil">
        <i class="fas fa-house-user" style="color: #0D9488;"></i>
      </a>
    `;

    // 2. Icône Ma Boutique ou Mon Espace Livraison (selon l'utilisateur)
    let iconExtra = '';
    if (roles.includes('commerce')) {
      iconExtra = `
        <a href="../commerce/produits.html" class="nav-icone icone-produits" title="Ma Boutique">
          <i class="fas fa-store" style="color: #10B981;"></i>
        </a>
      `;
    } else if (roles.includes('livreur')) {
      iconExtra = `
        <a href="../livreur/dashboard.html" class="nav-icone" title="Mon Espace Livraison">
          <i class="fas fa-motorcycle" style="color: #3B82F6;"></i>
        </a>
      `;
    }

    // 3. Icône Mon Espace Client (Chocolat #7A3E1D)
    const iconClient = `
      <a href="dashboard.html" class="nav-icone icone-client" title="Mon Espace Client">
        <i class="fas fa-user-circle" style="color: #7A3E1D;"></i>
      </a>
    `;

    // Assemblage des 3 icônes + menu profil
    navbarDroite.innerHTML = iconAccueil + iconExtra + iconClient + profilWrapperHTML;

    // Mettre à jour le menu déroulant profil spécifique
    const conteneurEspaces = document.getElementById('conteneur-mes-espaces');
    if (conteneurEspaces) {
      let extraDropdownLink = '';
      if (roles.includes('commerce')) {
        extraDropdownLink = `
          <a href="../commerce/produits.html" class="sidebar-lien">
            <i class="fas fa-store"></i> Ma Boutique
          </a>
        `;
      } else if (roles.includes('livreur')) {
        extraDropdownLink = `
          <a href="../livreur/dashboard.html" class="sidebar-lien">
            <i class="fas fa-motorcycle"></i> Mon Espace de Livraison
          </a>
        `;
      }
      conteneurEspaces.innerHTML = extraDropdownLink;
    }
  }

  initialiserNavbarContextuelle();

  // ==== LOAD CONVERSATIONS ====
  async function loadConversations() {
    try {
      const res = await apiFetch('/messages/conversations');
      const data = await res.json();
      if (data.success) {
        conversationsList = data.data;
        renderConversations();
      }
    } catch (err) {
      console.error("Erreur de chargement des conversations", err);
    }
  }

  function renderConversations(filterText = '') {
    conversationsContainer.innerHTML = '';
    
    let filtered = conversationsList;
    if (filterText) {
      const query = filterText.toLowerCase();
      filtered = conversationsList.filter(c => 
        (c.prenom && c.prenom.toLowerCase().includes(query)) ||
        (c.nom && c.nom.toLowerCase().includes(query)) ||
        (c.dernier_message && c.dernier_message.toLowerCase().includes(query))
      );
    }

    if (filtered.length === 0) {
      conversationsContainer.innerHTML = filterText 
        ? '<div style="padding:20px; text-align:center; color:var(--texte-clair); font-size:0.85rem;">Aucun résultat</div>'
        : '<div style="padding:20px; text-align:center; color:var(--texte-clair); font-size:0.85rem;">Aucune conversation</div>';
      return;
    }

    filtered.forEach(conv => {
      const div = document.createElement('div');
      div.className = `conversation-item ${currentOtherUserId === conv.autre_id ? 'active' : ''}`;
      
      const avatarUrl = conv.photo_profil 
        ? (conv.photo_profil.startsWith('http') ? conv.photo_profil : `https://addugo.up.railway.app${conv.photo_profil}`)
        : '../../assets/img/default-avatar.png';

      const unreadBadge = conv.non_lu ? `<div class="unread-badge">Nouveau</div>` : '';
      
      let dateAffichee = '';
      if (conv.dernier_message_date) {
        const d = new Date(conv.dernier_message_date);
        dateAffichee = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      let dernierMsgTexte = conv.dernier_message || '';
      if (dernierMsgTexte.startsWith('[PRODUIT]||')) {
        dernierMsgTexte = 'Demande d\'info produit...';
      }

      div.innerHTML = `
        <div class="conversation-avatar-wrapper">
          <img src="${avatarUrl}" alt="${conv.nom}" class="conversation-avatar">
          <div class="status-indicator"></div>
        </div>
        <div class="conversation-content">
          <div class="conversation-top">
            <span class="conversation-name">${conv.prenom || ''} ${conv.nom || ''}</span>
            <span class="conversation-time">${dateAffichee}</span>
          </div>
          <div class="conversation-bottom">
            <span class="conversation-last-message" style="${conv.non_lu ? 'font-weight:700;color:var(--texte);' : ''}">
              ${dernierMsgTexte}
            </span>
            ${unreadBadge}
          </div>
        </div>
      `;

      div.addEventListener('click', () => {
        currentOtherUserId = conv.autre_id;
        renderConversations(searchInput ? searchInput.value : ''); 
        loadMessages(conv.autre_id);
      });

      conversationsContainer.appendChild(div);
    });
  }

  // Écouteur pour la recherche en direct
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderConversations(e.target.value.trim());
    });
  }

  // ==== LOAD MESSAGES FOR SELECTED USER ====
  async function loadMessages(autreId, silent = false) {
    try {
      if (!silent) chatMessages.innerHTML = `<div style="text-align:center; margin:auto; color:var(--texte-clair);">Chargement...</div>`;
      const res = await apiFetch(`/messages/${autreId}`);
      const data = await res.json();
      if (data.success) {
        renderChatArea(data.autre_utilisateur, data.data, silent);
      }
    } catch (err) {
      console.error(err);
      chatMessages.innerHTML = `<div style="text-align:center; margin:auto; color:var(--danger);">Erreur de chargement</div>`;
    }
  }

  function renderChatArea(autreUtilisateur, messages, silent = false) {
    const messagesJson = JSON.stringify(messages);
    if (silent && messagesJson === currentMessagesJson) {
      return; // Évite le scintillement si rien n'a changé
    }
    currentMessagesJson = messagesJson;

    const avatarUrl = autreUtilisateur.photo_profil 
      ? (autreUtilisateur.photo_profil.startsWith('http') ? autreUtilisateur.photo_profil : `https://addugo.up.railway.app${autreUtilisateur.photo_profil}`)
      : '../../assets/img/default-avatar.png';

    chatHeader.innerHTML = `
      <div class="chat-header-user">
        <button class="btn-back-chat" id="btn-back-chat" title="Retour"><i class="fas fa-arrow-left"></i></button>
        <img src="${avatarUrl}" alt="${autreUtilisateur.nom}" class="chat-header-avatar">
        <div class="chat-header-info">
          <h3>${autreUtilisateur.prenom || ''} ${autreUtilisateur.nom || ''}</h3>
          <p>En ligne</p>
        </div>
      </div>
      <div class="chat-actions">
        <button class="chat-action-btn" title="Options"><i class="fas fa-ellipsis-v"></i></button>
      </div>
    `;

    chatMessages.innerHTML = '';
    if (messages.length === 0) {
      chatMessages.innerHTML = `
        <div style="text-align:center; margin:auto; color:var(--texte-clair); font-size:0.9rem;">
          <i class="fas fa-paper-plane" style="font-size:2rem; margin-bottom:8px; opacity:0.5;"></i>
          <div>Aucun message. Dites bonjour !</div>
        </div>
      `;
    } else {
      messages.forEach(msg => {
        const isMe = Number(msg.expediteur_id) === Number(currentUser.id);
        const div = document.createElement('div');
        div.className = `message ${isMe ? 'sent' : 'received'}`;
        
        const d = new Date(msg.date_envoi);
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let contenuHTML = msg.contenu;
        if (msg.contenu.startsWith('[PRODUIT]||')) {
          const parts = msg.contenu.split('||');
          const pNom = parts[1] || 'Produit inconnu';
          const pPrix = parts[2] || '';
          const pImg = parts[3] || '../../assets/img/default-image.png';
          contenuHTML = `
            <div style="background:rgba(255,255,255,0.9); padding:12px; border-radius:12px; margin-bottom:8px; border:1px solid rgba(0,0,0,0.08); text-align:left; color:#333; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <div style="font-weight:800; font-size:0.72rem; color:var(--orange); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Demande d'information produit</div>
              <div style="display:flex; gap:12px; align-items:center;">
                <img src="${pImg}" style="width:55px; height:55px; object-fit:cover; border-radius:8px; border:1px solid var(--bordure);">
                <div style="flex:1;">
                  <div style="font-weight:700; font-size:0.9rem; margin-bottom:2px; font-family:var(--police-titre);">${pNom}</div>
                  <div style="color:var(--orange); font-size:0.88rem; font-weight:800; font-family:var(--police-titre);">${pPrix}</div>
                </div>
              </div>
            </div>
            <div>Bonjour, je suis intéressé par ce produit. Est-il toujours disponible ?</div>
          `;
        }

        div.innerHTML = `
          <div class="message-bubble">${contenuHTML}</div>
          <div class="message-time">
            ${time} ${isMe ? '<i class="fas fa-check-double" style="color:rgba(255,255,255,0.8); margin-left:3px;"></i>' : ''}
          </div>
        `;
        chatMessages.appendChild(div);
      });
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Mobile layout toggle
    const layout = document.querySelector('.messagerie-layout');
    if (layout) layout.classList.add('chat-active');

    const btnBack = document.getElementById('btn-back-chat');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        if (layout) layout.classList.remove('chat-active');
        currentOtherUserId = null;
      });
    }
  }

  async function sendMessage() {
    if (!currentOtherUserId) {
      alert("Veuillez sélectionner une conversation d'abord.");
      return;
    }
    
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';

    const div = document.createElement('div');
    div.className = `message sent`;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="message-bubble">${text}</div>
      <div class="message-time">${now} <i class="fas fa-clock" style="margin-left:3px; opacity:0.7;"></i></div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          destinataire_id: currentOtherUserId,
          contenu: text
        })
      });
      const data = await res.json();

      if (data.success) {
        loadMessages(currentOtherUserId);
        loadConversations();
      } else {
        alert(data.message || "Erreur d'envoi");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  }

  btnSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // URL query user check
  const urlParams = new URLSearchParams(window.location.search);
  const startUserId = urlParams.get('user');

  if (startUserId) {
    currentOtherUserId = Number(startUserId);
    loadMessages(currentOtherUserId);

    const pNom = urlParams.get('p_nom');
    const pPrix = urlParams.get('p_prix');
    const pImg = urlParams.get('p_img');
    
    if (pNom) {
      window.history.replaceState({}, document.title, window.location.pathname + '?user=' + currentOtherUserId);
      const autoMsg = `[PRODUIT]||${pNom}||${pPrix}||${pImg}`;
      
      apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          destinataire_id: currentOtherUserId,
          contenu: autoMsg
        })
      }).then(r => r.json()).then((res) => {
        if (res.success) {
          loadMessages(currentOtherUserId);
          loadConversations();
        }
      });
    }
  }

  loadConversations();
  
  setInterval(() => {
    if (currentOtherUserId) {
      loadMessages(currentOtherUserId, true);
    }
    loadConversations();
  }, 5000);
});
