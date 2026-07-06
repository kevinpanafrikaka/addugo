const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Protection : JWT requis + Rôle admin requis
router.use(authMiddleware, adminMiddleware);

// ============================================================
// ROUTES UTILISATEURS
// ============================================================
router.get('/utilisateurs', adminController.listerUtilisateurs);
router.put('/utilisateurs/:id/statut', adminController.changerStatutUtilisateur);

// ============================================================
// ROUTES COMMERCES
// ============================================================
router.get('/commerces', adminController.listerTousCommerces);
router.put('/commerces/:id/statut', adminController.changerStatutCommerce);

// ============================================================
// ROUTES COMMANDES
// ============================================================
router.get('/commandes', adminController.listerToutesCommandes);

// ============================================================
// ROUTES LIVRAISONS
// ============================================================
router.get('/livraisons', adminController.listerToutesLivraisons);
router.put('/livraisons/:id/statut', adminController.changerStatutLivraison);

module.exports = router;
