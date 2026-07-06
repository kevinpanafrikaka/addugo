const pool = require('../config/db');

// ============================================================
// LISTER TOUS LES UTILISATEURS
// ============================================================
exports.listerUtilisateurs = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const utilisateurs = await conn.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.est_actif, u.date_creation,
              GROUP_CONCAT(r.nom) as roles
       FROM utilisateurs u
       LEFT JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
       LEFT JOIN roles r ON ur.role_id = r.id
       GROUP BY u.id
       ORDER BY u.date_creation DESC`
    );

    return res.status(200).json({
      success: true,
      total: utilisateurs.length,
      utilisateurs: utilisateurs.map(u => ({
        ...u,
        id: Number(u.id),
        roles: u.roles ? u.roles.split(',') : []
      }))
    });
  } catch (err) {
    console.error('Erreur listerUtilisateurs:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MODIFIER STATUT UTILISATEUR
// ============================================================
exports.changerStatutUtilisateur = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { est_actif } = req.body; // 1 ou 0

    conn = await pool.getConnection();
    await conn.query(
      'UPDATE utilisateurs SET est_actif = ? WHERE id = ?',
      [est_actif ? 1 : 0, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Statut utilisateur mis à jour.'
    });
  } catch (err) {
    console.error('Erreur changerStatutUtilisateur:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// LISTER TOUS LES COMMERCES (ACTIFS ET INACTIFS)
// ============================================================
exports.listerTousCommerces = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const commerces = await conn.query(
      `SELECT c.id, c.nom, c.description, c.adresse, c.telephone,
              c.logo, c.est_actif, c.date_creation,
              u.nom as proprio_nom, u.prenom as proprio_prenom
       FROM commerces c
       JOIN utilisateurs u ON c.utilisateur_id = u.id
       ORDER BY c.date_creation DESC`
    );

    return res.status(200).json({
      success: true,
      total: commerces.length,
      commerces: commerces.map(c => ({
        ...c,
        id: Number(c.id)
      }))
    });
  } catch (err) {
    console.error('Erreur listerTousCommerces:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MODIFIER STATUT COMMERCE
// ============================================================
exports.changerStatutCommerce = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { est_actif } = req.body;

    conn = await pool.getConnection();
    await conn.query(
      'UPDATE commerces SET est_actif = ? WHERE id = ?',
      [est_actif ? 1 : 0, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Statut commerce mis à jour.'
    });
  } catch (err) {
    console.error('Erreur changerStatutCommerce:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// LISTER TOUTES LES COMMANDES
// ============================================================
exports.listerToutesCommandes = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const commandes = await conn.query(
      `SELECT cmd.*, 
              u.nom as client_nom, u.prenom as client_prenom,
              c.nom as commerce_nom
       FROM commandes cmd
       JOIN utilisateurs u ON cmd.client_id = u.id
       JOIN commerces c ON cmd.commerce_id = c.id
       ORDER BY cmd.date_creation DESC`
    );

    return res.status(200).json({
      success: true,
      total: commandes.length,
      commandes: commandes.map(c => ({
        ...c,
        id: Number(c.id),
        montant_total: Number(c.montant_total)
      }))
    });
  } catch (err) {
    console.error('Erreur listerToutesCommandes:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// LISTER TOUTES LES LIVRAISONS
// ============================================================
exports.listerToutesLivraisons = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const livraisons = await conn.query(
      `SELECT l.id, l.commande_id, l.statut, l.date_assignation, l.date_livraison, l.notes,
              cmd.adresse_livraison, cmd.montant_total,
              c.nom as commerce_nom,
              client.nom as client_nom, client.prenom as client_prenom, client.telephone as client_telephone,
              livreur.nom as livreur_nom, livreur.prenom as livreur_prenom, livreur.telephone as livreur_telephone
       FROM livraisons l
       JOIN commandes cmd ON l.commande_id = cmd.id
       JOIN commerces c ON cmd.commerce_id = c.id
       JOIN utilisateurs client ON cmd.client_id = client.id
       JOIN utilisateurs livreur ON l.livreur_id = livreur.id
       ORDER BY l.date_assignation DESC`
    );

    return res.status(200).json({
      success: true,
      total: livraisons.length,
      livraisons: livraisons.map(l => ({
        ...l,
        id: Number(l.id),
        commande_id: Number(l.commande_id),
        montant_total: Number(l.montant_total)
      }))
    });
  } catch (err) {
    console.error('Erreur listerToutesLivraisons:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MODIFIER STATUT LIVRAISON
// ============================================================
exports.changerStatutLivraison = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { statut } = req.body; // 'assignee', 'en_cours', 'livree', 'echouee'

    if (!['assignee', 'en_cours', 'livree', 'echouee'].includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide.'
      });
    }

    conn = await pool.getConnection();
    
    // Mettre à jour la livraison
    await conn.query(
      'UPDATE livraisons SET statut = ?, date_livraison = IF(? = "livree", CURRENT_TIMESTAMP, date_livraison) WHERE id = ?',
      [statut, statut, id]
    );

    // Si la livraison est livrée, on peut aussi marquer la commande comme livrée
    if (statut === 'livree') {
      const livraison = await conn.query('SELECT commande_id FROM livraisons WHERE id = ?', [id]);
      if (livraison.length > 0) {
         await conn.query(
           'UPDATE commandes SET statut = "livree" WHERE id = ?',
           [livraison[0].commande_id]
         );
         // Ajouter à l'historique
         await conn.query(
           'INSERT INTO statuts_historique (commande_id, statut, commentaire) VALUES (?, ?, ?)',
           [livraison[0].commande_id, 'livree', 'Commande livrée (màj par Admin)']
         );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Statut de la livraison mis à jour.'
    });
  } catch (err) {
    console.error('Erreur changerStatutLivraison:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};
