-- ============================================================
--  AdduGo — Schéma SQL complet
--  Moteur    : InnoDB
--  Encodage  : UTF8MB4
--  Généré le : 2026-06-27
-- ============================================================

CREATE DATABASE IF NOT EXISTS addugo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE addugo;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. TABLE : utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
  id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  nom               VARCHAR(100)     NOT NULL,
  prenom            VARCHAR(100)     NOT NULL,
  email             VARCHAR(255)     NOT NULL UNIQUE,
  mot_de_passe      VARCHAR(255)     NOT NULL,
  telephone         VARCHAR(20)               DEFAULT NULL,
  adresse           TEXT                       DEFAULT NULL,
  photo_profil      VARCHAR(500)               DEFAULT NULL,
  est_actif         TINYINT(1)       NOT NULL  DEFAULT 1,
  date_creation     DATETIME         NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME         NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email   (email),
  INDEX idx_actif   (est_actif)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. TABLE : roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id  TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom VARCHAR(50)      NOT NULL UNIQUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Insertion des rôles par défaut
INSERT INTO roles (nom) VALUES
  ('client'),
  ('commerce'),
  ('livreur'),
  ('admin');


-- ============================================================
-- 3. TABLE : utilisateur_roles  (liaison M-N)
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateur_roles (
  utilisateur_id INT UNSIGNED     NOT NULL,
  role_id        TINYINT UNSIGNED NOT NULL,
  date_assignation DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (utilisateur_id, role_id),
  CONSTRAINT fk_ur_utilisateur
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ur_role
    FOREIGN KEY (role_id)        REFERENCES roles (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. TABLE : categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nom         VARCHAR(150) NOT NULL UNIQUE,
  description TEXT                  DEFAULT NULL,
  icone       VARCHAR(500)          DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Insertion des 8 catégories par défaut
INSERT INTO categories (nom, description, icone) VALUES
  ('Électroménagers',        'Appareils électroménagers pour la maison',      NULL),
  ('Électroniques',          'Produits électroniques et high-tech',           NULL),
  ('Modes & Accessoires',    'Vêtements, chaussures et accessoires de mode',  NULL),
  ('Cosmétiques & Beauté',   'Produits de beauté, soins et cosmétiques',      NULL),
  ('Sport & Loisirs',        'Équipements sportifs et articles de loisirs',   NULL),
  ('Meubles',                'Mobilier et décoration intérieure',             NULL),
  ('Jouets & Enfants',       'Jouets, jeux et articles pour enfants',         NULL),
  ('Fournitures & Papeterie','Fournitures de bureau, papeterie et scolaire',  NULL);


-- ============================================================
-- 5. TABLE : commerces
-- ============================================================
CREATE TABLE IF NOT EXISTS commerces (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  utilisateur_id INT UNSIGNED NOT NULL,
  nom            VARCHAR(200) NOT NULL,
  description    TEXT                  DEFAULT NULL,
  adresse        TEXT                  DEFAULT NULL,
  telephone      VARCHAR(20)           DEFAULT NULL,
  logo           VARCHAR(500)          DEFAULT NULL,
  est_actif      TINYINT(1)   NOT NULL DEFAULT 1,
  date_creation  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_commerce_utilisateur (utilisateur_id),
  INDEX idx_commerce_actif       (est_actif),
  CONSTRAINT fk_commerce_utilisateur
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. TABLE : produits
-- ============================================================
CREATE TABLE IF NOT EXISTS produits (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  commerce_id    INT UNSIGNED   NOT NULL,
  categorie_id   INT UNSIGNED   NOT NULL,
  nom            VARCHAR(300)   NOT NULL,
  description    TEXT                    DEFAULT NULL,
  prix           DECIMAL(10, 2) NOT NULL CHECK (prix >= 0),
  stock          INT UNSIGNED   NOT NULL DEFAULT 0,
  images         JSON                    DEFAULT NULL,
  videos         JSON                    DEFAULT NULL,
  est_disponible TINYINT(1)     NOT NULL DEFAULT 1,
  date_creation  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_produit_commerce   (commerce_id),
  INDEX idx_produit_categorie  (categorie_id),
  INDEX idx_produit_disponible (est_disponible),
  CONSTRAINT fk_produit_commerce
    FOREIGN KEY (commerce_id)  REFERENCES commerces  (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_produit_categorie
    FOREIGN KEY (categorie_id) REFERENCES categories (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. TABLE : commandes
-- ============================================================
CREATE TABLE IF NOT EXISTS commandes (
  id                INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  client_id         INT UNSIGNED   NOT NULL,
  commerce_id       INT UNSIGNED   NOT NULL,
  adresse_livraison TEXT           NOT NULL,
  montant_total     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  statut            ENUM(
                      'en_attente',
                      'confirmee',
                      'en_preparation',
                      'prete',
                      'en_livraison',
                      'livree',
                      'annulee'
                    ) NOT NULL DEFAULT 'en_attente',
  date_creation     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_commande_client    (client_id),
  INDEX idx_commande_commerce  (commerce_id),
  INDEX idx_commande_statut    (statut),
  CONSTRAINT fk_commande_client
    FOREIGN KEY (client_id)   REFERENCES utilisateurs (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_commande_commerce
    FOREIGN KEY (commerce_id) REFERENCES commerces   (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. TABLE : commande_articles
-- ============================================================
CREATE TABLE IF NOT EXISTS commande_articles (
  id            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  commande_id   INT UNSIGNED   NOT NULL,
  produit_id    INT UNSIGNED   NOT NULL,
  quantite      INT UNSIGNED   NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_unitaire DECIMAL(10, 2) NOT NULL CHECK (prix_unitaire >= 0),
  sous_total    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  INDEX idx_article_commande (commande_id),
  INDEX idx_article_produit  (produit_id),
  CONSTRAINT fk_article_commande
    FOREIGN KEY (commande_id) REFERENCES commandes (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_article_produit
    FOREIGN KEY (produit_id)  REFERENCES produits  (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. TABLE : livraisons
-- ============================================================
CREATE TABLE IF NOT EXISTS livraisons (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  commande_id      INT UNSIGNED   NOT NULL UNIQUE,
  livreur_id       INT UNSIGNED   NOT NULL,
  statut           ENUM(
                     'assignee',
                     'en_cours',
                     'livree',
                     'echouee'
                   ) NOT NULL DEFAULT 'assignee',
  position_lat     DECIMAL(10, 7)          DEFAULT NULL,
  position_lng     DECIMAL(10, 7)          DEFAULT NULL,
  date_assignation DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_livraison   DATETIME                DEFAULT NULL,
  notes            TEXT                    DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX idx_livraison_livreur (livreur_id),
  INDEX idx_livraison_statut  (statut),
  CONSTRAINT fk_livraison_commande
    FOREIGN KEY (commande_id) REFERENCES commandes    (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_livraison_livreur
    FOREIGN KEY (livreur_id)  REFERENCES utilisateurs (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. TABLE : statuts_historique
-- ============================================================
CREATE TABLE IF NOT EXISTS statuts_historique (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  commande_id     INT UNSIGNED NOT NULL,
  statut          ENUM(
                    'en_attente',
                    'confirmee',
                    'en_preparation',
                    'prete',
                    'en_livraison',
                    'livree',
                    'annulee'
                  ) NOT NULL,
  commentaire     TEXT                  DEFAULT NULL,
  date_changement DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_historique_commande (commande_id),
  INDEX idx_historique_statut   (statut),
  CONSTRAINT fk_historique_commande
    FOREIGN KEY (commande_id) REFERENCES commandes (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. TABLE : notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  utilisateur_id INT UNSIGNED NOT NULL,
  titre          VARCHAR(255) NOT NULL,
  message        TEXT         NOT NULL,
  est_lue        TINYINT(1)   NOT NULL DEFAULT 0,
  date_creation  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notif_utilisateur (utilisateur_id),
  INDEX idx_notif_lue         (est_lue),
  CONSTRAINT fk_notification_utilisateur
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. TABLE : livreur_disponibilites
-- ============================================================
CREATE TABLE IF NOT EXISTS livreur_disponibilites (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  livreur_id        INT UNSIGNED NOT NULL UNIQUE,
  est_disponible    TINYINT(1)   NOT NULL DEFAULT 1,
  date_modification DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_disponible_statut (est_disponible),
  CONSTRAINT fk_disponibilite_livreur
    FOREIGN KEY (livreur_id) REFERENCES utilisateurs (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. TABLE : conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  participant1_id INT UNSIGNED NOT NULL,
  participant2_id INT UNSIGNED NOT NULL,
  date_creation   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_mise_a_jour DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_participants (participant1_id, participant2_id),
  INDEX idx_conv_p1 (participant1_id),
  INDEX idx_conv_p2 (participant2_id),
  CONSTRAINT fk_conv_p1 FOREIGN KEY (participant1_id) REFERENCES utilisateurs (id) ON DELETE CASCADE,
  CONSTRAINT fk_conv_p2 FOREIGN KEY (participant2_id) REFERENCES utilisateurs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. TABLE : messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id INT UNSIGNED NOT NULL,
  expediteur_id   INT UNSIGNED NOT NULL,
  contenu         TEXT         NOT NULL,
  est_lu          TINYINT(1)   NOT NULL DEFAULT 0,
  date_envoi      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_msg_conv (conversation_id),
  INDEX idx_msg_exp  (expediteur_id),
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_exp  FOREIGN KEY (expediteur_id)   REFERENCES utilisateurs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FIN DU SCHÉMA AdduGo
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;
