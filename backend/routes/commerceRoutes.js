const express = require('express');
const router = express.Router();
const commerceController = require('../controllers/commerceController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuration Multer pour les logos de commerces
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/commerces/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
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

// Routes publiques
router.get('/', commerceController.listerCommerces);
router.get('/:id', commerceController.voirCommerce);

// Routes protégées
router.post('/', authMiddleware, upload.single('logo'), commerceController.creerCommerce);
router.put('/:id', authMiddleware, upload.single('logo'), commerceController.modifierCommerce);
router.delete('/:id', authMiddleware, commerceController.supprimerCommerce);
router.get('/mes/commerces', authMiddleware, commerceController.mesCommerces);
router.get('/:id/statistiques', authMiddleware, commerceController.getCommerceStats);

module.exports = router;
