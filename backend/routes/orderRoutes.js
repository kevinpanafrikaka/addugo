const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// Toutes les routes commandes nécessitent un token JWT
router.post('/', authMiddleware, orderController.creerCommande);
router.get('/mes-commandes', authMiddleware, orderController.mesCommandes);
router.get('/commerce/:commerce_id', authMiddleware, orderController.commandesCommerce);
router.get('/:id', authMiddleware, orderController.voirCommande);
router.put('/:id/statut', authMiddleware, orderController.changerStatut);

module.exports = router;
