const pool = require('../config/db');

// ============================================================
// LISTER LES CATÉGORIES
// ============================================================
exports.listerCategories = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const categories = await conn.query(
      'SELECT * FROM categories ORDER BY nom ASC'
    );

    return res.status(200).json({
      success: true,
      total: categories.length,
      categories: categories.map(c => ({ ...c, id: Number(c.id) }))
    });

  } catch (err) {
    console.error('Erreur listerCategories:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// AJOUTER UN PRODUIT
// ============================================================
exports.ajouterProduit = async (req, res) => {
  let conn;
  try {
    const { nom, description, prix, stock, categorie_id, commerce_id } = req.body;

    // LOGS DE DIAGNOSTIC
    console.log('<i class="fas fa-box" style="margin-right:4px;"></i>ajouterProduit appelé');
    console.log('  body:', req.body);
    console.log('  files:', req.files);

    if (!nom || !prix || !categorie_id || !commerce_id) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prix, catégorie et commerce sont obligatoires.'
      });
    }

    conn = await pool.getConnection();

    // Vérifier que le commerce appartient à l'utilisateur
    const commerces = await conn.query(
      'SELECT id FROM commerces WHERE id = ? AND utilisateur_id = ?',
      [commerce_id, req.utilisateur.id]
    );

    if (commerces.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à ajouter des produits à ce commerce.'
      });
    }

    let imagesJson = null;
    if (req.files && req.files.length > 0) {
      const urls = req.files.map(f => '/uploads/produits/' + f.filename);
      imagesJson = JSON.stringify(urls);
    }

    const result = await conn.query(
      `INSERT INTO produits (commerce_id, categorie_id, nom, description, prix, stock, images)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [commerce_id, categorie_id, nom, description || null, prix, stock || 0, imagesJson]
    );

    return res.status(201).json({
      success: true,
      message: 'Produit ajouté avec succès !',
      produit: {
        id: Number(result.insertId),
        nom,
        description,
        prix: Number(prix),
        stock: Number(stock) || 0,
        categorie_id: Number(categorie_id),
        commerce_id: Number(commerce_id)
      }
    });

  } catch (err) {
    console.error('Erreur ajouterProduit:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// LISTER LES PRODUITS
// ============================================================
exports.listerProduits = async (req, res) => {
  let conn;
  try {
    const { categorie_id, commerce_id } = req.query;

    conn = await pool.getConnection();

    // Si commerce_id est fourni (vue vendeur), on montre TOUS les produits
    // Sinon (vue client publique), on filtre uniquement les disponibles
    let query = `
      SELECT p.*, c.nom as categorie_nom, 
             com.nom as commerce_nom,
             com.logo as commerce_logo,
             com.adresse as commerce_adresse,
             com.utilisateur_id as commerce_utilisateur_id,
             u.photo_profil as commercant_photo,
             u.nom as commercant_nom,
             u.prenom as commercant_prenom
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      LEFT JOIN commerces com ON p.commerce_id = com.id
      LEFT JOIN utilisateurs u ON com.utilisateur_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (categorie_id) {
      query += ' AND p.categorie_id = ?';
      params.push(categorie_id);
    }

    if (commerce_id) {
      query += ' AND p.commerce_id = ?';
      params.push(commerce_id);
    }

    query += ' ORDER BY p.date_creation DESC';

    const produits = await conn.query(query, params);

    return res.status(200).json({
      success: true,
      total: produits.length,
      produits: produits.map(p => ({
        ...p,
        id: Number(p.id),
        prix: Number(p.prix),
        stock: Number(p.stock)
      }))
    });

  } catch (err) {
    console.error('Erreur listerProduits:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// VOIR UN PRODUIT
// ============================================================
exports.voirProduit = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    const produits = await conn.query(
      `SELECT p.*, c.nom as categorie_nom,
              com.nom as commerce_nom,
              com.adresse as commerce_adresse,
              com.telephone as commerce_telephone,
              com.logo as commerce_logo,
              com.utilisateur_id as commerce_utilisateur_id,
              u.photo_profil as commercant_photo,
              u.nom as commercant_nom,
              u.prenom as commercant_prenom
       FROM produits p
       LEFT JOIN categories c ON p.categorie_id = c.id
       LEFT JOIN commerces com ON p.commerce_id = com.id
       LEFT JOIN utilisateurs u ON com.utilisateur_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (produits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable.'
      });
    }

    const p = produits[0];
    return res.status(200).json({
      success: true,
      produit: {
        ...p,
        id: Number(p.id),
        prix: Number(p.prix),
        stock: Number(p.stock)
      }
    });

  } catch (err) {
    console.error('Erreur voirProduit:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MODIFIER UN PRODUIT
// ============================================================
exports.modifierProduit = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { nom, description, prix, stock, est_disponible } = req.body;

    // LOGS DE DIAGNOSTIC
    console.log('<i class="fas fa-pencil-alt" style="color:var(--orange);margin-right:4px;"></i>modifierProduit appelé, id:', id);
    console.log('  body:', req.body);
    console.log('  files:', req.files);

    conn = await pool.getConnection();

    // Vérifier que le produit appartient à un commerce de l'utilisateur
    const produits = await conn.query(
      `SELECT p.id FROM produits p
       JOIN commerces c ON p.commerce_id = c.id
       WHERE p.id = ? AND c.utilisateur_id = ?`,
      [id, req.utilisateur.id]
    );

    if (produits.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce produit.'
      });
    }

    let imagesQueryPart = '';
    let queryParams = [nom, description, prix, stock, est_disponible];

    if (req.files && req.files.length > 0) {
      const urls = req.files.map(f => '/uploads/produits/' + f.filename);
      imagesQueryPart = ', images = ?';
      queryParams.push(JSON.stringify(urls));
    }

    queryParams.push(id);

    await conn.query(
      `UPDATE produits
       SET nom = COALESCE(?, nom),
           description = COALESCE(?, description),
           prix = COALESCE(?, prix),
           stock = COALESCE(?, stock),
           est_disponible = COALESCE(?, est_disponible)
           ${imagesQueryPart}
       WHERE id = ?`,
      queryParams
    );

    return res.status(200).json({
      success: true,
      message: 'Produit mis à jour avec succès !'
    });

  } catch (err) {
    console.error('Erreur modifierProduit:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// SUPPRIMER UN PRODUIT (soft delete)
// ============================================================
exports.supprimerProduit = async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    const produits = await conn.query(
      `SELECT p.id FROM produits p
       JOIN commerces c ON p.commerce_id = c.id
       WHERE p.id = ? AND c.utilisateur_id = ?`,
      [id, req.utilisateur.id]
    );

    if (produits.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce produit.'
      });
    }

    await conn.query(
      'UPDATE produits SET est_disponible = 0 WHERE id = ?', [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Produit supprimé avec succès !'
    });

  } catch (err) {
    console.error('Erreur supprimerProduit:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};
