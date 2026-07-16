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

app.get('/api/fix-db', async (req, res) => {
  const mariadb = require('mariadb');
  let conn;
  try {
    const urlBaseDeDonnees = 'mariadb://root:FucQdFylVdwVzuPiYbbKPjKPRtSxvbvx@hayabusa.proxy.rlwy.net:26647/addugo';
    const pool = mariadb.createPool(urlBaseDeDonnees);
    conn = await pool.getConnection();
    await conn.query('ALTER TABLE commandes ADD COLUMN code_pin VARCHAR(4) DEFAULT NULL AFTER montant_total');
    res.json({ success: true, message: 'Colonne code_pin ajoutée avec succès via root !' });
  } catch (err) {
    if (err.errno === 1060) {
      res.json({ success: true, message: 'La colonne code_pin existe déjà.' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  } finally {
    if (conn) conn.release();
  }
});

// ============================================================
// WEBSOCKETS (SOCKET.IO) POUR LE SUIVI GPS
// ============================================================
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // En production, on limitera à nos domaines
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('⚡ Nouveau client connecté via WebSocket:', socket.id);

  // Un client (ou un livreur) rejoint le "canal" de suivi d'une commande
  socket.on('join_commande', (commandeId) => {
    socket.join(`commande_${commandeId}`);
    console.log(`📍 Client a rejoint le suivi de la commande #${commandeId}`);
  });

  // Le livreur envoie sa nouvelle position
  socket.on('livreur_position', (data) => {
    // data = { commandeId, lat, lng }
    if (data.commandeId && data.lat && data.lng) {
      // On rediffuse la position à tous ceux qui sont dans ce "canal" (le client)
      io.to(`commande_${data.commandeId}`).emit('update_position', {
        lat: data.lat,
        lng: data.lng
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client déconnecté:', socket.id);
  });
});

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================
server.listen(PORT, () => {
  console.log(`Serveur AdduGo démarré sur http://localhost:${PORT}`);
});

module.exports = { app, server, io };
