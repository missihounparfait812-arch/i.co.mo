/*
 * ==============================================
 * I.CO.MO — BASE DE DONNÉES SQLite
 * ==============================================
 * Crée la connexion, initialise les tables et
 * exporte l'instance pour les contrôleurs.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Créer le dossier data/ s'il n'existe pas
const dataDir = path.dirname(config.dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Connexion SQLite native (Node.js 24)
const db = new DatabaseSync(config.dbPath);

// Activer le mode WAL et les clés étrangères
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Helper transaction pour compatibilité
db.transaction = function(fn) {
    return function(...args) {
        db.exec('BEGIN');
        try {
            const res = fn(...args);
            db.exec('COMMIT');
            return res;
        } catch (err) {
            db.exec('ROLLBACK');
            throw err;
        }
    };
};

// ============================================
// CRÉATION DES TABLES
// ============================================

db.exec(`
    -- Table des administrateurs
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nom TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des catégories
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des produits
    CREATE TABLE IF NOT EXISTS produits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        categorie_id INTEGER,
        prix INTEGER NOT NULL DEFAULT 0,
        description TEXT DEFAULT '',
        disponible INTEGER DEFAULT 1,
        publie INTEGER DEFAULT 1,
        dimensions TEXT DEFAULT '',
        materiau TEXT DEFAULT '',
        couleur TEXT DEFAULT '',
        sur_mesure INTEGER DEFAULT 0,
        quantite INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    -- Table des images de produits
    CREATE TABLE IF NOT EXISTS images_produit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produit_id INTEGER NOT NULL,
        chemin TEXT NOT NULL,
        principale INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE CASCADE
    );

    -- Table des commandes
    CREATE TABLE IF NOT EXISTS commandes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT UNIQUE NOT NULL,
        client_nom TEXT NOT NULL,
        client_telephone TEXT NOT NULL,
        client_adresse TEXT DEFAULT '',
        client_commune TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        total INTEGER NOT NULL DEFAULT 0,
        statut TEXT DEFAULT 'en_attente',
        whatsapp_envoyee INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Table des lignes de commande
    CREATE TABLE IF NOT EXISTS lignes_commande (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commande_id INTEGER NOT NULL,
        produit_id INTEGER,
        nom_produit TEXT NOT NULL,
        prix_unitaire INTEGER NOT NULL DEFAULT 0,
        quantite INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
        FOREIGN KEY (produit_id) REFERENCES produits(id) ON DELETE SET NULL
    );

    -- Table des paramètres (clé/valeur)
    CREATE TABLE IF NOT EXISTS parametres (
        cle TEXT PRIMARY KEY,
        valeur TEXT DEFAULT ''
    );
`);

module.exports = db;
