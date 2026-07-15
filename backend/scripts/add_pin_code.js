const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'addugo_db',
  port: process.env.DB_PORT || 3306
};

async function checkAndAddColumn() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('Connecté à la base de données.');

    // Ajouter la colonne code_pin à la table commandes si elle n'existe pas
    try {
      await conn.query(`ALTER TABLE commandes ADD COLUMN code_pin VARCHAR(4) DEFAULT NULL AFTER montant_total;`);
      console.log('Colonne "code_pin" ajoutée avec succès à la table "commandes".');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('La colonne "code_pin" existe déjà.');
      } else {
        throw e;
      }
    }

  } catch (error) {
    console.error('Erreur :', error);
  } finally {
    if (conn) {
      await conn.end();
      console.log('Connexion fermée.');
    }
  }
}

checkAndAddColumn();
