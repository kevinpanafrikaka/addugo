const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config({ path: '../.env' });

// ============================================================
// INSCRIPTION
// ============================================================
exports.inscription = async (req, res) => {
  let conn;
  try {
    const { nom, prenom, email, mot_de_passe, telephone, adresse, role } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom, email et mot de passe sont obligatoires.'
      });
    }

    conn = await pool.getConnection();

    // Vérification email existant
    const existant = await conn.query(
      'SELECT id FROM utilisateurs WHERE email = ?', [email]
    );
    if (existant.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé.'
      });
    }

    // Chiffrement du mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 12);

    // Insertion de l'utilisateur
    const result = await conn.query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, adresse)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, prenom, email, hash, telephone || null, adresse || null]
    );

    const utilisateurId = Number(result.insertId);

    // Assignation du rôle (défaut: client - Forcé selon le nouveau plan)
    const roleNom = 'client';
    const roles = await conn.query(
      'SELECT id FROM roles WHERE nom = ?', [roleNom]
    );

    if (roles.length > 0) {
      await conn.query(
        'INSERT INTO utilisateur_roles (utilisateur_id, role_id) VALUES (?, ?)',
        [utilisateurId, Number(roles[0].id)]
      );
    }

    // Génération du token JWT
    const token = jwt.sign(
      { id: utilisateurId, email, role: roleNom },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Inscription réussie !',
      token,
      utilisateur: { id: utilisateurId, nom, prenom, email, role: roleNom }
    });

  } catch (err) {
    console.error('Erreur inscription:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription.'
    });
  } finally {
    if (conn) conn.release();
  }
};

// ============================================================
// CONNEXION
// ============================================================
exports.connexion = async (req, res) => {
  let conn;
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe sont obligatoires.'
      });
    }

    conn = await pool.getConnection();

    // Recherche de l'utilisateur
    const utilisateurs = await conn.query(
      `SELECT u.*, GROUP_CONCAT(r.nom) as roles
       FROM utilisateurs u
       LEFT JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = ? AND u.est_actif = 1
       GROUP BY u.id`,
      [email]
    );

    if (utilisateurs.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    const utilisateur = utilisateurs[0];

    // Vérification du mot de passe
    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // Génération du token JWT
    const token = jwt.sign(
      { id: Number(utilisateur.id), email: utilisateur.email, roles: utilisateur.roles },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Connexion réussie !',
      token,
      utilisateur: {
        id: Number(utilisateur.id),
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        roles: utilisateur.roles ? utilisateur.roles.split(',') : []
      }
    });

  } catch (err) {
    console.error('Erreur connexion:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion.'
    });
  } finally {
    if (conn) conn.release();
  }
};
