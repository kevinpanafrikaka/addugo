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
