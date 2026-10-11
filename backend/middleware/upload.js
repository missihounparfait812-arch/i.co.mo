/*
 * ==============================================
 * I.CO.MO — MIDDLEWARE D'UPLOAD (MULTER)
 * ==============================================
 * Configure Multer pour le téléversement d'images
 * avec validation du type et de la taille.
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const fs = require('fs');

// Créer le dossier images/ s'il n'existe pas
if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.uploadDir);
    },
    filename: function (req, file, cb) {
        // Nom unique : prefixe_timestamp_random.ext
        const ext = path.extname(file.originalname).toLowerCase();
        const prefix = 'produit';
        const uniqueSuffix = Date.now() + '_' + crypto.randomBytes(4).toString('hex');
        cb(null, `${prefix}_${uniqueSuffix}${ext}`);
    }
});

// Filtre de fichiers
const fileFilter = function (req, file, cb) {
    if (config.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé : ${file.mimetype}. Types acceptés : JPEG, PNG, WebP, GIF.`), false);
    }
};

// Instance Multer configurée
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.maxFileSize,
        files: 5 // Maximum 5 images par requête
    }
});

module.exports = upload;
