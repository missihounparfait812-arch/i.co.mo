/*
 * ==============================================
 * I.CO.MO — SERVICE DE GESTION DES IMAGES
 * ==============================================
 * Gère la suppression physique des fichiers images
 * et vérifie qu'un fichier n'est pas utilisé ailleurs.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const db = require('../models/database');

/**
 * Supprime un fichier image du disque
 * @param {string} chemin - Chemin relatif de l'image (ex: "images/produit_xxx.jpg")
 */
function supprimerFichier(chemin) {
    if (!chemin) return;

    const fichierAbsolu = path.resolve(config.rootDir, chemin);

    // Sécurité : vérifier que le fichier est bien dans le dossier images/
    const imagesDir = path.resolve(config.rootDir, 'images');
    if (!fichierAbsolu.startsWith(imagesDir)) {
        console.warn(`[ImageService] Tentative de suppression hors du dossier images/ : ${chemin}`);
        return;
    }

    if (fs.existsSync(fichierAbsolu)) {
        try {
            fs.unlinkSync(fichierAbsolu);
            console.log(`[ImageService] Fichier supprimé : ${chemin}`);
        } catch (err) {
            console.error(`[ImageService] Erreur suppression ${chemin} :`, err.message);
        }
    }
}

/**
 * Supprime toutes les images d'un produit (DB + disque)
 * @param {number} produitId - ID du produit
 */
function supprimerImagesProduit(produitId) {
    const images = db.prepare('SELECT chemin FROM images_produit WHERE produit_id = ?').all(produitId);

    images.forEach(img => {
        supprimerFichier(img.chemin);
    });

    db.prepare('DELETE FROM images_produit WHERE produit_id = ?').run(produitId);
}

/**
 * Supprime une image spécifique (DB + disque)
 * @param {number} imageId - ID de l'image
 * @returns {boolean} true si supprimée
 */
function supprimerImage(imageId) {
    const image = db.prepare('SELECT * FROM images_produit WHERE id = ?').get(imageId);
    if (!image) return false;

    supprimerFichier(image.chemin);
    db.prepare('DELETE FROM images_produit WHERE id = ?').run(imageId);
    return true;
}

/**
 * Enregistre une image en base
 * @param {number} produitId - ID du produit
 * @param {string} chemin - Chemin relatif du fichier
 * @param {boolean} principale - Image principale ?
 * @returns {Object} L'image insérée
 */
function enregistrerImage(produitId, chemin, principale = false) {
    // Si c'est l'image principale, retirer le flag des autres
    if (principale) {
        db.prepare('UPDATE images_produit SET principale = 0 WHERE produit_id = ?').run(produitId);
    }

    const result = db.prepare(
        'INSERT INTO images_produit (produit_id, chemin, principale) VALUES (?, ?, ?)'
    ).run(produitId, chemin, principale ? 1 : 0);

    return {
        id: result.lastInsertRowid,
        produit_id: produitId,
        chemin,
        principale
    };
}

module.exports = {
    supprimerFichier,
    supprimerImagesProduit,
    supprimerImage,
    enregistrerImage
};
