const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuration Multer pour les images de produits
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/produits/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'produit-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max par image
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Erreur : Seules les images sont autorisées !'));
  }
});

// Routes publiques
router.get('/', productController.listerProduits);
router.get('/categories', productController.listerCategories);
router.get('/:id', productController.voirProduit);

// Routes protégées
router.post('/', authMiddleware, upload.array('images', 5), productController.ajouterProduit);
router.put('/:id', authMiddleware, upload.array('images', 5), productController.modifierProduit);
router.delete('/:id', authMiddleware, productController.supprimerProduit);

module.exports = router;
