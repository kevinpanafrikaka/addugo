const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/inscription
router.post('/inscription', authController.inscription);

// POST /api/auth/connexion
router.post('/connexion', authController.connexion);

module.exports = router;
