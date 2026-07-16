const pool = require('../config/db');

// ============================================================
// CHANGER DISPONIBILITÉ
// ============================================================
exports.changerDisponibilite = async (req, res) => {
  let conn;
  try {
    const { est_disponible } = req.body;
    conn = await pool.getConnection();

    // Vérifier si une entrée existe déjà
    const existant = await conn.query(
      'SELECT id FROM livreur_disponibilites WHERE livreur_id = ?',
      [req.utilisateur.id]
    );

    if (existant.length > 0) {
      await conn.query(
        'UPDATE livreur_disponibilites SET est_disponible = ? WHERE livreur_id = ?',
        [est_disponible, req.utilisateur.id]
      );
    } else {
      await conn.query(
        'INSERT INTO livreur_disponibilites (livreur_id, est_disponible) VALUES (?, ?)',
        [req.utilisateur.id, est_disponible]
      );
    }

    return res.status(200).json({
      success: true,
      message: est_disponible
        ? 'Vous êtes maintenant disponible pour des livraisons !'
        : 'Vous êtes maintenant indisponible.'
    });

  } catch (err) {
    console.error('Erreur changerDisponibilite:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// COMMANDES DISPONIBLES À LIVRER
// ============================================================
exports.commandesDisponibles = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const commandes = await conn.query(
      `SELECT c.id, c.adresse_livraison, c.montant_total,
              c.date_creation, com.nom as commerce_nom,
              com.adresse as commerce_adresse,
              u.nom as client_nom, u.prenom as client_prenom,
              u.telephone as client_telephone,
              com.utilisateur_id as commerce_utilisateur_id
       FROM commandes c
       JOIN commerces com ON c.commerce_id = com.id
       JOIN utilisateurs u ON c.client_id = u.id
       WHERE c.statut = 'prete'
       AND c.id NOT IN (SELECT commande_id FROM livraisons)
       ORDER BY c.date_creation ASC`
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
    console.error('Erreur commandesDisponibles:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// ACCEPTER UNE LIVRAISON
// ============================================================
exports.accepterLivraison = async (req, res) => {
  let conn;
  try {
    const { commande_id } = req.body;

    if (!commande_id) {
      return res.status(400).json({
        success: false,
        message: 'L\'identifiant de la commande est obligatoire.'
      });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Vérifier que la commande est disponible
    const commandes = await conn.query(
      `SELECT id FROM commandes 
       WHERE id = ? AND statut = 'prete'
       AND id NOT IN (SELECT commande_id FROM livraisons)`,
      [commande_id]
    );

    if (commandes.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cette commande n\'est pas disponible pour la livraison.'
      });
    }

    // Créer la livraison
    const result = await conn.query(
      `INSERT INTO livraisons (commande_id, livreur_id, statut)
       VALUES (?, ?, 'assignee')`,
      [commande_id, req.utilisateur.id]
    );

    // Mettre à jour le statut de la commande
    await conn.query(
      'UPDATE commandes SET statut = ? WHERE id = ?',
      ['en_livraison', commande_id]
    );

    // Enregistrer dans l'historique
    await conn.query(
      `INSERT INTO statuts_historique (commande_id, statut, commentaire)
       VALUES (?, 'en_livraison', 'Livreur assigné')`,
      [commande_id]
    );

    // Mettre le livreur comme indisponible
    await conn.query(
      `INSERT INTO livreur_disponibilites (livreur_id, est_disponible)
       VALUES (?, 0)
       ON DUPLICATE KEY UPDATE est_disponible = 0`,
      [req.utilisateur.id]
    );

    // Notifier le client
    const commandeInfo = await conn.query(
      'SELECT client_id FROM commandes WHERE id = ?',
      [commande_id]
    );

    try {
      await conn.query(
        `INSERT INTO notifications (utilisateur_id, titre, message)
         VALUES (?, '<i class="fas fa-bicycle" style="color:var(--orange);margin-right:4px;"></i>Livreur en route !', ?)`,
        [
          Number(commandeInfo[0].client_id),
          `Un livreur a pris en charge votre commande #${commande_id}`
        ]
      );
    } catch (notifErr) {
      console.warn('Notifications non disponibles:', notifErr.message);
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Livraison acceptée avec succès !',
      livraison: {
        id: Number(result.insertId),
        commande_id: Number(commande_id),
        statut: 'assignee'
      }
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Erreur accepterLivraison:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// METTRE À JOUR POSITION GPS
// ============================================================
exports.mettreAJourPosition = async (req, res) => {
  let conn;
  try {
    const { livraison_id, position_lat, position_lng } = req.body;

    if (!livraison_id || !position_lat || !position_lng) {
      return res.status(400).json({
        success: false,
        message: 'ID livraison et coordonnées GPS sont obligatoires.'
      });
    }

    conn = await pool.getConnection();

    await conn.query(
      `UPDATE livraisons 
       SET position_lat = ?, position_lng = ?, statut = 'en_cours'
       WHERE id = ? AND livreur_id = ?`,
      [position_lat, position_lng, livraison_id, req.utilisateur.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Position mise à jour !',
      position: { lat: position_lat, lng: position_lng }
    });

  } catch (err) {
    console.error('Erreur mettreAJourPosition:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// TERMINER UNE LIVRAISON
// ============================================================
exports.terminerLivraison = async (req, res) => {
  let conn;
  try {
    const { livraison_id, notes, code_pin } = req.body;

    if (!livraison_id) {
      return res.status(400).json({
        success: false,
        message: 'L\'identifiant de la livraison est obligatoire.'
      });
    }

    if (!code_pin) {
      return res.status(400).json({
        success: false,
        message: 'Le code PIN du client est obligatoire pour valider la livraison.'
      });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Récupérer la livraison
    const livraisons = await conn.query(
      'SELECT * FROM livraisons WHERE id = ? AND livreur_id = ?',
      [livraison_id, req.utilisateur.id]
    );

    if (livraisons.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Livraison introuvable.'
      });
    }

    const commande_id = Number(livraisons[0].commande_id);

    // Vérifier le code PIN avec celui de la commande (SELECT * pour éviter erreur si colonne absente)
    const commandesInfo = await conn.query(
      'SELECT * FROM commandes WHERE id = ?',
      [commande_id]
    );

    if (commandesInfo.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Commande introuvable.' });
    }

    const pinEnBase = commandesInfo[0].code_pin;
    
    // Si un code PIN existe en base, on le vérifie strictement
    if (pinEnBase !== undefined && pinEnBase !== null && String(pinEnBase).trim() !== String(code_pin).trim()) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le code PIN saisi est incorrect. Demandez au client de vérifier son application.'
      });
    }

    // Mettre à jour la livraison
    await conn.query(
      `UPDATE livraisons 
       SET statut = 'livree', date_livraison = NOW(), notes = ?
       WHERE id = ?`,
      [notes || null, livraison_id]
    );

    // Mettre à jour le statut de la commande
    await conn.query(
      'UPDATE commandes SET statut = ? WHERE id = ?',
      ['livree', commande_id]
    );

    // Enregistrer dans l'historique
    await conn.query(
      `INSERT INTO statuts_historique (commande_id, statut, commentaire)
       VALUES (?, 'livree', 'Livraison effectuée avec succès')`,
      [commande_id]
    );

    // Remettre le livreur disponible
    await conn.query(
      `UPDATE livreur_disponibilites SET est_disponible = 1
       WHERE livreur_id = ?`,
      [req.utilisateur.id]
    );

    // Notifier le client
    const commandeInfo = await conn.query(
      'SELECT client_id FROM commandes WHERE id = ?',
      [commande_id]
    );

    try {
      await conn.query(
        `INSERT INTO notifications (utilisateur_id, titre, message)
         VALUES (?, 'Commande livrée !', ?)`,
        [
          Number(commandeInfo[0].client_id),
          `Votre commande #${commande_id} a été livrée avec succès !`
        ]
      );
    } catch (notifErr) {
      console.warn('Notifications non disponibles:', notifErr.message);
    }

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: 'Livraison terminée avec succès !'
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Erreur terminerLivraison:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MES LIVRAISONS
// ============================================================
exports.mesLivraisons = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const livraisons = await conn.query(
      `SELECT l.*, c.adresse_livraison, c.montant_total,
              com.nom as commerce_nom,
              u.nom as client_nom, u.prenom as client_prenom,
              u.telephone as client_telephone
       FROM livraisons l
       JOIN commandes c ON l.commande_id = c.id
       JOIN commerces com ON c.commerce_id = com.id
       JOIN utilisateurs u ON c.client_id = u.id
       WHERE l.livreur_id = ?
       ORDER BY l.date_assignation DESC`,
      [req.utilisateur.id]
    );

    return res.status(200).json({
      success: true,
      total: livraisons.length,
      livraisons: livraisons.map(l => ({
        ...l,
        id: Number(l.id),
        montant_total: Number(l.montant_total)
      }))
    });

  } catch (err) {
    console.error('Erreur mesLivraisons:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};
