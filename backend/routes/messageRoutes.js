const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const verifierToken = require('../middlewares/authMiddleware');

// Toutes les routes de messagerie nécessitent d'être connecté
router.use(verifierToken);

// Récupérer la liste des conversations de l'utilisateur
router.get('/conversations', messageController.getConversations);

// Récupérer les messages avec un utilisateur précis (ça crée la conversation si elle n'existe pas)
router.get('/:autre_utilisateur_id', messageController.getMessages);

// Envoyer un nouveau message
router.post('/', messageController.sendMessage);

module.exports = router;
