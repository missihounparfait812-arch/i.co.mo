/*
 * ==============================================
 * I.CO.MO — CONFIGURATION CENTRALISÉE
 * ==============================================
 * Charge les variables d'environnement et exporte
 * un objet de configuration unique pour tout le backend.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    // Serveur
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',

    // Base de données
    dbPath: path.resolve(__dirname, '../../', process.env.DB_PATH || 'backend/data/icomo.db'),

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'CHANGEZ_MOI',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

    // Admin initial (seed uniquement)
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin@Icomo2026!',

    // WhatsApp
    whatsappNumber: process.env.WHATSAPP_NUMBER || '225XXXXXXXXXX',

    // Upload
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
    uploadDir: path.resolve(__dirname, '../../images'),
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

    // Chemins
    rootDir: path.resolve(__dirname, '../../'),
    backendDir: path.resolve(__dirname, '../'),
};

module.exports = config;
