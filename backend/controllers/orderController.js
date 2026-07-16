const pool = require('../config/db');

// ============================================================
// CRÉER UNE COMMANDE
// ============================================================
exports.creerCommande = async (req, res) => {
  let conn;
  try {
    const { commerce_id, adresse_livraison, articles } = req.body;

    if (!commerce_id || !adresse_livraison || !articles || articles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Commerce, adresse de livraison et articles sont obligatoires.'
      });
    }

    conn = await pool.getConnection();

    // Règle anti-auto-commande : un commerçant ne peut pas commander chez lui-même
    const commerceOwner = await conn.query(
      `SELECT utilisateur_id FROM commerces WHERE id = ?`,
      [commerce_id]
    );

    if (commerceOwner.length > 0 && Number(commerceOwner[0].utilisateur_id) === Number(req.utilisateur.id)) {
      if (conn) conn.release();
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas passer commande dans votre propre boutique.'
      });
    }

    await conn.beginTransaction();

    // Calculer le montant total
    let montant_total = 0;
    for (const article of articles) {
      const produits = await conn.query(
        'SELECT prix, stock FROM produits WHERE id = ? AND est_disponible = 1',
        [article.produit_id]
      );

      if (produits.length === 0) {
        await conn.rollback();
        return res.status(404).json({
          success: false,
          message: `Produit ${article.produit_id} introuvable ou indisponible.`
        });
      }

      if (produits[0].stock < article.quantite) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour le produit ${article.produit_id}.`
        });
      }

      montant_total += Number(produits[0].prix) * article.quantite;
    }

    // Générer un code PIN à 4 chiffres
    const code_pin = String(Math.floor(1000 + Math.random() * 9000));

    // Créer la commande
    let result;
    try {
      result = await conn.query(
        `INSERT INTO commandes (client_id, commerce_id, adresse_livraison, montant_total, code_pin)
         VALUES (?, ?, ?, ?, ?)`,
        [req.utilisateur.id, commerce_id, adresse_livraison, montant_total, code_pin]
      );
    } catch (insertErr) {
      // Si la colonne code_pin n'existe pas dans la base de données, on réessaie sans
      if (insertErr.errno === 1054 || insertErr.code === 'ER_BAD_FIELD_ERROR' || String(insertErr.message).includes('code_pin')) {
        result = await conn.query(
          `INSERT INTO commandes (client_id, commerce_id, adresse_livraison, montant_total)
           VALUES (?, ?, ?, ?)`,
          [req.utilisateur.id, commerce_id, adresse_livraison, montant_total]
        );
      } else {
        throw insertErr;
      }
    }

    const commande_id = Number(result.insertId);

    // Insérer les articles et mettre à jour le stock
    for (const article of articles) {
      const produits = await conn.query(
        'SELECT prix FROM produits WHERE id = ?',
        [article.produit_id]
      );

      const prix_unitaire = Number(produits[0].prix);
      const sous_total = prix_unitaire * article.quantite;

      await conn.query(
        `INSERT INTO commande_articles 
         (commande_id, produit_id, quantite, prix_unitaire, sous_total)
         VALUES (?, ?, ?, ?, ?)`,
        [commande_id, article.produit_id, article.quantite, prix_unitaire, sous_total]
      );

      // Mettre à jour le stock
      await conn.query(
        'UPDATE produits SET stock = stock - ? WHERE id = ?',
        [article.quantite, article.produit_id]
      );
    }

    // Enregistrer dans l'historique
    await conn.query(
      `INSERT INTO statuts_historique (commande_id, statut, commentaire)
       VALUES (?, 'en_attente', 'Commande créée')`,
      [commande_id]
    );

    // Créer une notification pour le commerce
    try {
      await conn.query(
        `INSERT INTO notifications (utilisateur_id, titre, message)
         SELECT utilisateur_id, '<i class="fas fa-shopping-cart" style="margin-right:4px;"></i>Nouvelle commande !', 
                CONCAT('Vous avez reçu une nouvelle commande #', ?)
         FROM commerces WHERE id = ?`,
        [commande_id, commerce_id]
      );
    } catch (notifErr) {
      console.warn('Notifications non disponibles:', notifErr.message);
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Commande créée avec succès !',
      commande: {
        id: commande_id,
        montant_total,
        statut: 'en_attente',
        adresse_livraison
      }
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Erreur creerCommande:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MES COMMANDES (CLIENT)
// ============================================================
exports.mesCommandes = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const commandes = await conn.query(
      `SELECT c.*, com.nom as commerce_nom,
              com.adresse as commerce_adresse,
              com.logo as commerce_logo
       FROM commandes c
       JOIN commerces com ON c.commerce_id = com.id
       WHERE c.client_id = ?
       ORDER BY c.date_creation DESC`,
      [req.utilisateur.id]
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
    console.error('Erreur mesCommandes:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// COMMANDES DU COMMERCE
// ============================================================
exports.commandesCommerce = async (req, res) => {
  let conn;
  try {
    const { commerce_id } = req.params;
    conn = await pool.getConnection();

    // Vérifier que le commerce appartient à l'utilisateur
    const commerces = await conn.query(
      'SELECT id FROM commerces WHERE id = ? AND utilisateur_id = ?',
      [commerce_id, req.utilisateur.id]
    );

    if (commerces.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé.'
      });
    }

    const commandes = await conn.query(
      `SELECT c.*, u.nom as client_nom, u.prenom as client_prenom,
              u.telephone as client_telephone
       FROM commandes c
       JOIN utilisateurs u ON c.client_id = u.id
       WHERE c.commerce_id = ?
       ORDER BY c.date_creation DESC`,
      [commerce_id]
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
    console.error('Erreur commandesCommerce:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// VOIR UNE COMMANDE
// ============================================================
exports.voirCommande = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    const commandes = await conn.query(
      `SELECT c.*, com.nom as commerce_nom,
              u.nom as client_nom, u.prenom as client_prenom
       FROM commandes c
       JOIN commerces com ON c.commerce_id = com.id
       JOIN utilisateurs u ON c.client_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (commandes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable.'
      });
    }

    // Récupérer les articles
    const articles = await conn.query(
      `SELECT ca.*, p.nom as produit_nom, p.images
       FROM commande_articles ca
       JOIN produits p ON ca.produit_id = p.id
       WHERE ca.commande_id = ?`,
      [id]
    );

    // Récupérer l'historique des statuts
    const historique = await conn.query(
      `SELECT * FROM statuts_historique
       WHERE commande_id = ?
       ORDER BY date_changement ASC`,
      [id]
    );

    const commande = commandes[0];
    return res.status(200).json({
      success: true,
      commande: {
        ...commande,
        id: Number(commande.id),
        montant_total: Number(commande.montant_total),
        articles: articles.map(a => ({
          ...a,
          id: Number(a.id),
          prix_unitaire: Number(a.prix_unitaire),
          sous_total: Number(a.sous_total)
        })),
        historique
      }
    });

  } catch (err) {
    console.error('Erreur voirCommande:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// CHANGER STATUT COMMANDE
// ============================================================
exports.changerStatut = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { statut, commentaire } = req.body;

    const statuts_valides = [
      'en_attente', 'confirmee', 'en_preparation',
      'prete', 'en_livraison', 'livree', 'annulee'
    ];

    if (!statuts_valides.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide.'
      });
    }

    conn = await pool.getConnection();

    // Mettre à jour le statut
    await conn.query(
      'UPDATE commandes SET statut = ? WHERE id = ?',
      [statut, id]
    );

    // Enregistrer dans l'historique
    await conn.query(
      `INSERT INTO statuts_historique (commande_id, statut, commentaire)
       VALUES (?, ?, ?)`,
      [id, statut, commentaire || null]
    );

    // Notifier le client
    const commandes = await conn.query(
      'SELECT client_id FROM commandes WHERE id = ?', [id]
    );

    if (commandes.length > 0) {
      try {
        await conn.query(
          `INSERT INTO notifications (utilisateur_id, titre, message)
           VALUES (?, '<i class="fas fa-box" style="margin-right:4px;"></i>Statut de commande mis à jour', ?)`,
          [
            Number(commandes[0].client_id),
            `Votre commande #${id} est maintenant : ${statut}`
          ]
        );
      } catch (notifErr) {
        console.warn('Notifications non disponibles:', notifErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Statut mis à jour : ${statut}`
    });

  } catch (err) {
    console.error('Erreur changerStatut:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};
