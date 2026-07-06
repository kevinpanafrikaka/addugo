require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// TEST DE CONNEXION BASE DE DONNÉES
// ============================================================
require('./config/db');

// ============================================================
// ROUTES
// ============================================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/utilisateurs', require('./routes/userRoutes'));
app.use('/api/commerces', require('./routes/commerceRoutes'));
app.use('/api/produits', require('./routes/productRoutes'));
app.use('/api/commandes', require('./routes/orderRoutes'));
app.use('/api/livreurs', require('./routes/livreurRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API AdduGo !',
    version: '1.0.0'
  });
});

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================
app.listen(PORT, () => {
  console.log(`Serveur AdduGo démarré sur http://localhost:${PORT}`);
});

module.exports = app;
