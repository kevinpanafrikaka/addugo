const pool = require('../config/db');

// ============================================================
// RÉCUPÉRER LA LISTE DES CONVERSATIONS
// ============================================================
exports.getConversations = async (req, res) => {
  let conn;
  try {
    const userId = req.utilisateur.id;
    conn = await pool.getConnection();

    // Récupérer toutes les conversations où l'utilisateur participe
    const query = `
      SELECT c.id AS conversation_id, c.date_mise_a_jour,
             u.id AS autre_id, u.nom, u.prenom, u.photo_profil
      FROM conversations c
      JOIN utilisateurs u ON (u.id = c.participant1_id OR u.id = c.participant2_id) AND u.id != ?
      WHERE c.participant1_id = ? OR c.participant2_id = ?
      ORDER BY c.date_mise_a_jour DESC
    `;
    const conversations = await conn.query(query, [userId, userId, userId]);

    // Optionnel : Récupérer le dernier message de chaque conversation
    for (let conv of conversations) {
      const lastMsg = await conn.query(
        `SELECT contenu, est_lu, date_envoi, expediteur_id 
         FROM messages WHERE conversation_id = ? 
         ORDER BY date_envoi DESC LIMIT 1`,
        [conv.conversation_id]
      );
      if (lastMsg.length > 0) {
        conv.dernier_message = lastMsg[0].contenu;
        conv.dernier_message_date = lastMsg[0].date_envoi;
        conv.non_lu = (!lastMsg[0].est_lu && Number(lastMsg[0].expediteur_id) !== Number(userId));
      } else {
        conv.dernier_message = 'Nouvelle conversation';
        conv.dernier_message_date = conv.date_mise_a_jour;
        conv.non_lu = false;
      }
    }

    return res.status(200).json({
      success: true,
      data: conversations
    });

  } catch (err) {
    console.error('Erreur getConversations:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// RÉCUPÉRER LES MESSAGES D'UNE CONVERSATION
// ============================================================
exports.getMessages = async (req, res) => {
  let conn;
  try {
    const userId = req.utilisateur.id;
    const { autre_utilisateur_id } = req.params; // On demande par ID de l'autre participant
    
    if (!autre_utilisateur_id) {
      return res.status(400).json({ success: false, message: 'L\'ID de l\'autre utilisateur est requis' });
    }

    if (Number(userId) === Number(autre_utilisateur_id)) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas discuter avec vous-même' });
    }

    conn = await pool.getConnection();

    // 1. Trouver ou créer la conversation
    let conv = await conn.query(
      `SELECT id FROM conversations 
       WHERE (participant1_id = ? AND participant2_id = ?) 
          OR (participant1_id = ? AND participant2_id = ?) LIMIT 1`,
      [userId, autre_utilisateur_id, autre_utilisateur_id, userId]
    );

    let conversation_id;
    if (conv.length === 0) {
      // Créer la conversation si elle n'existe pas encore
      const result = await conn.query(
        `INSERT INTO conversations (participant1_id, participant2_id) VALUES (?, ?)`,
        [userId, autre_utilisateur_id]
      );
      conversation_id = Number(result.insertId);
    } else {
      conversation_id = Number(conv[0].id);
    }

    // 2. Marquer les messages comme lus
    await conn.query(
      `UPDATE messages SET est_lu = 1 WHERE conversation_id = ? AND expediteur_id = ?`,
      [conversation_id, autre_utilisateur_id]
    );

    // 3. Récupérer l'historique
    const messages = await conn.query(
      `SELECT id, expediteur_id, contenu, est_lu, date_envoi 
       FROM messages 
       WHERE conversation_id = ? 
       ORDER BY date_envoi ASC`,
      [conversation_id]
    );

    // Infos sur l'autre utilisateur
    const autre = await conn.query(
      `SELECT id, nom, prenom, photo_profil FROM utilisateurs WHERE id = ?`,
      [autre_utilisateur_id]
    );

    return res.status(200).json({
      success: true,
      conversation_id: conversation_id,
      autre_utilisateur: autre[0],
      data: messages
    });

  } catch (err) {
    console.error('Erreur getMessages:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// ENVOYER UN MESSAGE
// ============================================================
exports.sendMessage = async (req, res) => {
  let conn;
  try {
    const userId = req.utilisateur.id;
    const { destinataire_id, contenu } = req.body;

    if (!destinataire_id || !contenu) {
      return res.status(400).json({ success: false, message: 'Le destinataire et le contenu sont requis.' });
    }
    
    if (Number(userId) === Number(destinataire_id)) {
      return res.status(400).json({ success: false, message: 'Impossible de s\'envoyer un message à soi-même.' });
    }

    conn = await pool.getConnection();

    // 1. Trouver ou créer la conversation
    let conv = await conn.query(
      `SELECT id FROM conversations 
       WHERE (participant1_id = ? AND participant2_id = ?) 
          OR (participant1_id = ? AND participant2_id = ?) LIMIT 1`,
      [userId, destinataire_id, destinataire_id, userId]
    );

    let conversation_id;
    if (conv.length === 0) {
      const result = await conn.query(
        `INSERT INTO conversations (participant1_id, participant2_id) VALUES (?, ?)`,
        [userId, destinataire_id]
      );
      conversation_id = Number(result.insertId);
    } else {
      conversation_id = Number(conv[0].id);
    }

    // 2. Insérer le message
    const msgResult = await conn.query(
      `INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)`,
      [conversation_id, userId, contenu]
    );

    // 3. Mettre à jour la date de la conversation
    await conn.query(
      `UPDATE conversations SET date_mise_a_jour = CURRENT_TIMESTAMP WHERE id = ?`,
      [conversation_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Message envoyé',
      data: {
        id: Number(msgResult.insertId),
        conversation_id,
        expediteur_id: userId,
        contenu,
        est_lu: 0,
        date_envoi: new Date()
      }
    });

  } catch (err) {
    console.error('Erreur sendMessage:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    if (conn) conn.release();
  }
};
