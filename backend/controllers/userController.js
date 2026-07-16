const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ============================================================
// VOIR SON PROFIL
// ============================================================
exports.monProfil = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const utilisateurs = await conn.query(
      `SELECT u.id, u.nom, u.prenom, u.genre, u.email, u.telephone, 
              u.adresse, u.photo_profil, u.date_creation,
              GROUP_CONCAT(r.nom) as roles
       FROM utilisateurs u
       LEFT JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.utilisateur.id]
    );

    if (utilisateurs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable.'
      });
    }

    const u = utilisateurs[0];

    return res.status(200).json({
      success: true,
      utilisateur: {
        id: Number(u.id),
        nom: u.nom,
        prenom: u.prenom,
        genre: u.genre || 'M',
        email: u.email,
        telephone: u.telephone,
        adresse: u.adresse,
        photo_profil: u.photo_profil,
        date_creation: u.date_creation,
        roles: u.roles ? u.roles.split(',') : []
      }
    });

  } catch (err) {
    console.error('Erreur monProfil:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// MODIFIER SON PROFIL
// ============================================================
exports.modifierProfil = async (req, res) => {
  let conn;
  try {
    const { nom, prenom, genre, telephone, adresse } = req.body;

    conn = await pool.getConnection();
    await conn.query(
      `UPDATE utilisateurs 
       SET nom = COALESCE(?, nom),
           prenom = COALESCE(?, prenom),
           genre = COALESCE(?, genre),
           telephone = COALESCE(?, telephone),
           adresse = COALESCE(?, adresse)
       WHERE id = ?`,
      [
        nom !== undefined ? nom : null,
        prenom !== undefined ? prenom : null,
        genre !== undefined ? genre : null,
        telephone !== undefined ? telephone : null,
        adresse !== undefined ? adresse : null,
        req.utilisateur.id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès !'
    });

  } catch (err) {
    console.error('Erreur modifierProfil:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// CHANGER MOT DE PASSE
// ============================================================
exports.changerMotDePasse = async (req, res) => {
  let conn;
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Ancien et nouveau mot de passe obligatoires.'
      });
    }

    conn = await pool.getConnection();
    const utilisateurs = await conn.query(
      'SELECT mot_de_passe FROM utilisateurs WHERE id = ?',
      [req.utilisateur.id]
    );

    const valide = await bcrypt.compare(
      ancien_mot_de_passe,
      utilisateurs[0].mot_de_passe
    );

    if (!valide) {
      return res.status(401).json({
        success: false,
        message: 'Ancien mot de passe incorrect.'
      });
    }

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 12);
    await conn.query(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
      [hash, req.utilisateur.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Mot de passe changé avec succès !'
    });

  } catch (err) {
    console.error('Erreur changerMotDePasse:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// AJOUTER UN RÔLE
// ============================================================
exports.ajouterRole = async (req, res) => {
  let conn;
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Le rôle est obligatoire.'
      });
    }

    conn = await pool.getConnection();
    const roles = await conn.query(
      'SELECT id FROM roles WHERE nom = ?', [role]
    );

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rôle introuvable.'
      });
    }

    // Vérifications anti-cumul
    if (role === 'livreur') {
      const isCommerce = await conn.query(
        `SELECT 1 FROM utilisateur_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.utilisateur_id = ? AND r.nom = 'commerce'`,
        [req.utilisateur.id]
      );
      if (isCommerce.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'En tant que commerçant, vous ne pouvez pas devenir livreur.'
        });
      }
    }

    if (role === 'commerce') {
      const isLivreur = await conn.query(
        `SELECT 1 FROM utilisateur_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.utilisateur_id = ? AND r.nom = 'livreur'`,
        [req.utilisateur.id]
      );
      if (isLivreur.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'En tant que livreur, vous ne pouvez pas posséder de boutique.'
        });
      }
    }

    await conn.query(
      `INSERT IGNORE INTO utilisateur_roles (utilisateur_id, role_id) 
       VALUES (?, ?)`,
      [req.utilisateur.id, Number(roles[0].id)]
    );

    return res.status(200).json({
      success: true,
      message: `Rôle "${role}" ajouté avec succès !`
    });

  } catch (err) {
    console.error('Erreur ajouterRole:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// SUPPRIMER UN RÔLE
// ============================================================
exports.supprimerRole = async (req, res) => {
  let conn;
  try {
    const { role } = req.body;

    if (!role || role === 'client') {
      return res.status(400).json({
        success: false,
        message: 'Le rôle principal client ne peut pas être supprimé.'
      });
    }

    conn = await pool.getConnection();

    await conn.query(
      `DELETE ur FROM utilisateur_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.utilisateur_id = ? AND r.nom = ?`,
      [req.utilisateur.id, role]
    );

    return res.status(200).json({
      success: true,
      message: `Rôle "${role}" retiré avec succès !`
    });

  } catch (err) {
    console.error('Erreur supprimerRole:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait du rôle.'
    });
  } finally {
    if (conn) conn.release();
  }
};


// ============================================================
// UPLOAD PHOTO DE PROFIL
// ============================================================
exports.uploadPhotoProfil = async (req, res) => {
  let conn;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image sélectionnée.'
      });
    }

    // Le chemin relatif à sauvegarder en base de données
    const photoUrl = '/uploads/profils/' + req.file.filename;

    conn = await pool.getConnection();
    await conn.query(
      'UPDATE utilisateurs SET photo_profil = ? WHERE id = ?',
      [photoUrl, req.utilisateur.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Photo de profil mise à jour avec succès !',
      photoUrl: photoUrl
    });

  } catch (err) {
    console.error('Erreur uploadPhotoProfil:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la sauvegarde de la photo.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// UPLOAD PHOTO DE COUVERTURE
// ============================================================
exports.uploadPhotoCouverture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image sélectionnée.'
      });
    }

    const ext = path.extname(req.file.originalname);
    const newFileName = `cover_${req.utilisateur.id}${ext}`;
    const oldPath = req.file.path;
    const newPath = path.join(req.file.destination, newFileName);

    // Supprimer l'ancienne couverture si elle existe avec une autre extension
    const files = fs.readdirSync(req.file.destination);
    for (const f of files) {
      if (f.startsWith(`cover_${req.utilisateur.id}.`)) {
        fs.unlinkSync(path.join(req.file.destination, f));
      }
    }

    // Renommer le fichier téléchargé
    fs.renameSync(oldPath, newPath);

    // Le chemin relatif à renvoyer au frontend
    const photoUrl = '/uploads/profils/' + newFileName;

    return res.status(200).json({
      success: true,
      message: 'Image de couverture mise à jour avec succès !',
      photoUrl: photoUrl
    });

  } catch (err) {
    console.error('Erreur uploadPhotoCouverture:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la sauvegarde de la photo de couverture.'
    });
  }
};
