const mariadb = require('mariadb');

async function corrigerBaseDeDonnees() {
  console.log("⏳ Connexion à la base de données Railway en cours...");
  let conn;
  try {
    const pool = mariadb.createPool({
      host: 'hayabusa.proxy.rlwy.net',
      port: 26647,
      user: 'root',
      password: 'FucQdFylVdwVzuPiYbbKPjKPRtSxvbvx',
      database: 'railway',
      connectionLimit: 5
    });
    conn = await pool.getConnection();
    console.log("✅ Connecté avec succès en tant qu'administrateur (root) !");
    
    console.log("⏳ Ajout de la colonne code_pin...");
    await conn.query('ALTER TABLE commandes ADD COLUMN code_pin VARCHAR(4) DEFAULT NULL AFTER montant_total');
    
    console.log("🎉 SUCCÈS : La colonne code_pin a été ajoutée ! Ton problème est définitivement réglé !");
    
  } catch (err) {
    if (err.errno === 1060) {
      console.log("✅ INFO : La colonne code_pin existe DÉJÀ. Tout est bon !");
    } else {
      console.error("❌ ERREUR :", err.message);
    }
  } finally {
    if (conn) conn.end();
  }
}

corrigerBaseDeDonnees();
