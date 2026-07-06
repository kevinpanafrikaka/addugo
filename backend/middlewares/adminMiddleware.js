module.exports = (req, res, next) => {
  try {
    let roles = [];
    if (typeof req.utilisateur.roles === 'string') {
      roles = req.utilisateur.roles.split(',');
    } else if (Array.isArray(req.utilisateur.roles)) {
      roles = req.utilisateur.roles;
    }
    
    const roleUnique = req.utilisateur.role;

    if (roles.includes('admin') || roleUnique === 'admin') {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux administrateurs.'
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Erreur de vérification des droits admin.'
    });
  }
};
