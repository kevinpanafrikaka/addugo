const pool = require('../config/db');

// ============================================================
// CRÉER UN COMMERCE
// ============================================================
exports.creerCommerce = async (req, res) => {
  let conn;
  try {
    const { nom, description, adresse, telephone } = req.body;

    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du commerce est obligatoire.'
      });
    }

    // Gérer l'image s'il y en a une
    const logoUrl = req.file ? '/uploads/commerces/' + req.file.filename : null;

    conn = await pool.getConnection();

    // Vérifier si l'utilisateur possède déjà une boutique
    const existingShop = await conn.query(
      `SELECT id FROM commerces WHERE utilisateur_id = ? LIMIT 1`,
      [req.utilisateur.id]
    );

    if (existingShop.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous possédez déjà une boutique. Un seul commerce par compte est autorisé.'
      });
    }

    // Vérifier si l'utilisateur possède le rôle livreur (interdit de cumuler)
    const isLivreur = await conn.query(
      `SELECT 1 FROM utilisateur_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.utilisateur_id = ? AND r.nom = 'livreur'`,
      [req.utilisateur.id]
    );

    if (isLivreur.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'En tant que livreur, vous ne pouvez pas posséder de boutique.'
      });
    }

    // Vérifier si l'utilisateur a déjà le rôle commerce
    const roles = await conn.query(
      `SELECT r.nom FROM roles r
       JOIN utilisateur_roles ur ON r.id = ur.role_id
       WHERE ur.utilisateur_id = ? AND r.nom = 'commerce'`,
      [req.utilisateur.id]
    );

    // S'il n'a pas le rôle commerce, on le lui attribue
    if (roles.length === 0) {
      const roleId = await conn.query(`SELECT id FROM roles WHERE nom = 'commerce'`);
      if (roleId.length > 0) {
        await conn.query(
          `INSERT IGNORE INTO utilisateur_roles (utilisateur_id, role_id) VALUES (?, ?)`,
          [req.utilisateur.id, roleId[0].id]
        );
      }
    }

    const result = await conn.query(
      `INSERT INTO commerces (utilisateur_id, nom, description, adresse, telephone, logo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.utilisateur.id, nom, description || null, adresse || null, telephone || null, logoUrl]
    );

    return res.status(201).json({
      success: true,
      message: 'Commerce créé avec succès !',
      commerce: {
        id: Number(result.insertId),
        nom,
        description,
        adresse,
        telephone,
        logo: logoUrl
      }
    });

  } catch (err) {
    console.error('Erreur creerCommerce:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// LISTER TOUS LES COMMERCES
// ============================================================
exports.listerCommerces = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const commerces = await conn.query(
      `SELECT c.id, c.nom, c.description, c.adresse, c.telephone,
              c.logo, c.est_actif, c.date_creation,
              u.nom as proprio_nom, u.prenom as proprio_prenom
       FROM commerces c
       JOIN utilisateurs u ON c.utilisateur_id = u.id
       WHERE c.est_actif = 1
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
    console.error('Erreur listerCommerces:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// VOIR UN COMMERCE
// ============================================================
exports.voirCommerce = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    const commerces = await conn.query(
      `SELECT c.*, u.nom as proprio_nom, u.prenom as proprio_prenom,
              u.telephone as proprio_telephone
       FROM commerces c
       JOIN utilisateurs u ON c.utilisateur_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (commerces.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commerce introuvable.'
      });
    }

    // Récupérer les produits du commerce
    const produits = await conn.query(
      `SELECT p.*, cat.nom as categorie_nom
       FROM produits p
       JOIN categories cat ON p.categorie_id = cat.id
       WHERE p.commerce_id = ? AND p.est_disponible = 1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      commerce: {
        ...commerces[0],
        id: Number(commerces[0].id),
        produits: produits.map(p => ({
          ...p,
          id: Number(p.id),
          prix: Number(p.prix)
        }))
      }
    });

  } catch (err) {
    console.error('Erreur voirCommerce:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MODIFIER UN COMMERCE
// ============================================================
exports.modifierCommerce = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const nom = req.body?.nom || null;
    const description = req.body?.description || null;
    const adresse = req.body?.adresse || null;
    const telephone = req.body?.telephone || null;
    const logoUrl = req.file ? '/uploads/commerces/' + req.file.filename : null;

    conn = await pool.getConnection();

    // Vérifier que le commerce appartient à l'utilisateur
    const commerces = await conn.query(
      'SELECT id FROM commerces WHERE id = ? AND utilisateur_id = ?',
      [id, req.utilisateur.id]
    );

    if (commerces.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce commerce.'
      });
    }

    if (logoUrl) {
      await conn.query(
        `UPDATE commerces
         SET nom = COALESCE(?, nom),
             description = COALESCE(?, description),
             adresse = COALESCE(?, adresse),
             telephone = COALESCE(?, telephone),
             logo = ?
         WHERE id = ?`,
        [nom, description, adresse, telephone, logoUrl, id]
      );
    } else {
      await conn.query(
        `UPDATE commerces
         SET nom = COALESCE(?, nom),
             description = COALESCE(?, description),
             adresse = COALESCE(?, adresse),
             telephone = COALESCE(?, telephone)
         WHERE id = ?`,
        [nom, description, adresse, telephone, id]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Commerce mis à jour avec succès !'
    });

  } catch (err) {
    console.error('Erreur modifierCommerce:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MES COMMERCES
// ============================================================
exports.mesCommerces = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const commerces = await conn.query(
      `SELECT * FROM commerces WHERE utilisateur_id = ?
       ORDER BY date_creation DESC`,
      [req.utilisateur.id]
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
    console.error('Erreur mesCommerces:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// STATISTIQUES DU COMMERCE
// ============================================================
exports.getCommerceStats = async (req, res) => {
  let conn;
  try {
    const commerceId = req.params.id;
    const jours = parseInt(req.query.jours);
    
    // Construction du filtre de date conditionnel
    let dateCondition = "";
    if (!isNaN(jours)) {
      if (jours === 0) {
        dateCondition = " AND DATE(c.date_creation) = CURDATE() ";
      } else if (jours === 365) {
        dateCondition = " AND c.date_creation >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ";
      } else {
        dateCondition = ` AND c.date_creation >= DATE_SUB(CURDATE(), INTERVAL ${jours} DAY) `;
      }
    }

    conn = await pool.getConnection();

    // 1. KPIs de base (le total des commandes dépend du paramètre de temps, sauf les produits)
    const kpiRows = await conn.query(`
      SELECT 
        (SELECT SUM(montant_total) FROM commandes c WHERE c.commerce_id = ? AND c.statut = 'livree' ${dateCondition}) as chiffre_affaires,
        (SELECT COUNT(*) FROM commandes c WHERE c.commerce_id = ? ${dateCondition}) as commandes_total,
        (SELECT COUNT(*) FROM commandes c WHERE c.commerce_id = ? AND c.statut = 'en_attente' ${dateCondition}) as commandes_attente,
        (SELECT COUNT(*) FROM commandes c WHERE c.commerce_id = ? AND c.statut = 'livree' ${dateCondition}) as commandes_livrees,
        (SELECT COUNT(*) FROM produits WHERE commerce_id = ? AND est_disponible = 1) as produits_actifs
    `, [commerceId, commerceId, commerceId, commerceId, commerceId]);

    const kpis = {
      chiffre_affaires: Number(kpiRows[0].chiffre_affaires || 0),
      commandes_total: Number(kpiRows[0].commandes_total || 0),
      commandes_attente: Number(kpiRows[0].commandes_attente || 0),
      commandes_livrees: Number(kpiRows[0].commandes_livrees || 0),
      produits_actifs: Number(kpiRows[0].produits_actifs || 0)
    };

    // 2. Top 3 produits
    const topProduits = await conn.query(`
      SELECT p.id, p.nom, p.images, 
             SUM(ca.quantite) as total_vendus, 
             SUM(ca.sous_total) as revenu_genere
      FROM commande_articles ca
      JOIN commandes c ON ca.commande_id = c.id
      JOIN produits p ON ca.produit_id = p.id
      WHERE c.commerce_id = ? AND c.statut = 'livree' ${dateCondition}
      GROUP BY p.id
      ORDER BY total_vendus DESC
      LIMIT 3
    `, [commerceId]);

    // 3. Graphique Revenus (7 derniers jours par défaut si pas de paramètre)
    let conditionRevenus = dateCondition;
    if (isNaN(jours)) {
        conditionRevenus = " AND c.date_creation >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ";
    }
    
    let selectDateStr = "DATE(c.date_creation)";
    let groupByStr = "DATE(c.date_creation)";
    
    if (jours === 0) {
        selectDateStr = "DATE_FORMAT(c.date_creation, '%Y-%m-%d %H:00:00')";
        groupByStr = "DATE_FORMAT(c.date_creation, '%Y-%m-%d %H:00:00')";
    } else if (jours === 365) {
        selectDateStr = "DATE_FORMAT(c.date_creation, '%Y-%m-01')";
        groupByStr = "YEAR(c.date_creation), MONTH(c.date_creation)";
    }

    const revenusChart = await conn.query(`
      SELECT ${selectDateStr} as date, SUM(c.montant_total) as total
      FROM commandes c
      WHERE c.commerce_id = ? AND c.statut = 'livree' ${conditionRevenus}
      GROUP BY ${groupByStr}
      ORDER BY MIN(c.date_creation) ASC
    `, [commerceId]);

    // 4. Graphique Ventes par Catégorie
    const categoriesChart = await conn.query(`
      SELECT cat.nom as categorie, SUM(ca.quantite) as total_vendus
      FROM commande_articles ca
      JOIN commandes c ON ca.commande_id = c.id
      JOIN produits p ON ca.produit_id = p.id
      JOIN categories cat ON p.categorie_id = cat.id
      WHERE c.commerce_id = ? AND c.statut = 'livree' ${dateCondition}
      GROUP BY cat.id
    `, [commerceId]);

    return res.status(200).json({
      success: true,
      data: {
        kpis,
        top_produits: topProduits.map(p => ({
          ...p, 
          total_vendus: Number(p.total_vendus),
          revenu_genere: Number(p.revenu_genere)
        })),
        revenus_chart: revenusChart.map(r => ({ ...r, total: Number(r.total) })),
        categories_chart: categoriesChart.map(c => ({ ...c, total_vendus: Number(c.total_vendus) }))
      }
    });

  } catch (err) {
    console.error('Erreur getCommerceStats:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques.' });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// SUPPRIMER UN COMMERCE
// ============================================================
exports.supprimerCommerce = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    const commerces = await conn.query(
      'SELECT id FROM commerces WHERE id = ? AND utilisateur_id = ?',
      [id, req.utilisateur.id]
    );

    if (commerces.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce commerce.'
      });
    }

    await conn.query('DELETE FROM commerces WHERE id = ?', [id]);

    // Retirer le rôle commerce si plus de boutique
    const remaining = await conn.query('SELECT id FROM commerces WHERE utilisateur_id = ?', [req.utilisateur.id]);
    if (remaining.length === 0) {
      await conn.query(
        `DELETE ur FROM utilisateur_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.utilisateur_id = ? AND r.nom = 'commerce'`,
        [req.utilisateur.id]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Commerce supprimé avec succès !'
    });
  } catch (err) {
    console.error('Erreur supprimerCommerce:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de la suppression du commerce.' });
  } finally {
    if (conn) conn.release();
  }
};

