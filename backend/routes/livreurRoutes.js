const express = require('express');
const router = express.Router();
const livreurController = require('../controllers/livreurController');
const authMiddleware = require('../middlewares/authMiddleware');

// Toutes les routes livreur nécessitent un token JWT
router.put('/disponibilite', authMiddleware, livreurController.changerDisponibilite);
router.get('/commandes-disponibles', authMiddleware, livreurController.commandesDisponibles);
router.post('/accepter', authMiddleware, livreurController.accepterLivraison);
router.put('/position', authMiddleware, livreurController.mettreAJourPosition);
router.put('/terminer', authMiddleware, livreurController.terminerLivraison);
router.get('/mes-livraisons', authMiddleware, livreurController.mesLivraisons);

module.exports = router;
