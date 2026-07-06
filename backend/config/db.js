const mariadb = require('mariadb');
require('dotenv').config({ path: '../.env' });

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 10,
  acquireTimeout: 30000,
  connectTimeout: 10000,
  charset: 'utf8mb4',
  allowPublicKeyRetrieval: true
});

// Test de connexion + migration automatique
async function testerConnexion() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Connexion à la base de données AdduGo réussie !');
    
    // Migration automatique : ajouter la colonne derniere_activite si absente
    try {
      await conn.query(
        'ALTER TABLE utilisateurs ADD COLUMN derniere_activite DATETIME NULL DEFAULT NULL'
      );
      console.log('Migration : colonne derniere_activite ajoutée.');
    } catch (migErr) {
      if (migErr.errno !== 1060) { // 1060 = colonne déjà existante
        console.warn('Migration derniere_activite :', migErr.message);
      }
    }

    return true;
  } catch (err) {
    console.error('Erreur de connexion à la base de données :', err.message);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

testerConnexion();

module.exports = pool;
