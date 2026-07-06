const pool = require('../config/db');

async function migrate() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SHOW COLUMNS FROM utilisateurs LIKE 'genre'");
    if (rows.length === 0) {
      await conn.query("ALTER TABLE utilisateurs ADD COLUMN genre VARCHAR(10) NOT NULL DEFAULT 'M' AFTER prenom");
      console.log("Colonne 'genre' ajoutée avec succès à la table utilisateurs !");
    } else {
      console.log("La colonne 'genre' existe déjà.");
    }
  } catch (err) {
    console.error("Erreur migration genre:", err);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

migrate();
