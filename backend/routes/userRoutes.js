const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuration Multer pour les photos de profil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profils/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profil-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées.'));
    }
  }
});

// Toutes les routes utilisateur nécessitent un token JWT
router.get('/profil', authMiddleware, userController.monProfil);
router.put('/profil', authMiddleware, userController.modifierProfil);
router.put('/mot-de-passe', authMiddleware, userController.changerMotDePasse);
router.post('/role', authMiddleware, userController.ajouterRole);
router.delete('/role', authMiddleware, userController.supprimerRole);
router.post('/photo', authMiddleware, upload.single('photo'), userController.uploadPhotoProfil);
router.post('/couverture', authMiddleware, upload.single('couverture'), userController.uploadPhotoCouverture);

module.exports = router;
