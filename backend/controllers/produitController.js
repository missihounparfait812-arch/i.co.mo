/*
 * ==============================================
 * I.CO.MO — CONTRÔLEUR DE PRODUITS
 * ==============================================
 * Gère le catalogue : consultation publique, recherche,
 * filtres et gestion administrateur (CRUD + images).
 */

const db = require('../models/database');
const imageService = require('../services/imageService');

/**
 * Récupère les images associées à un ou plusieurs produits
 */
function attacherImagesAuxProduits(produits) {
    if (!produits || produits.length === 0) return [];

    const produitIds = produits.map(p => p.id);
    const placeholders = produitIds.map(() => '?').join(',');

    const toutesImages = db.prepare(`
        SELECT id, produit_id, chemin, principale
        FROM images_produit
        WHERE produit_id IN (${placeholders})
        ORDER BY principale DESC, id ASC
    `).all(...produitIds);

    const imagesParProduit = {};
    toutesImages.forEach(img => {
        if (!imagesParProduit[img.produit_id]) {
            imagesParProduit[img.produit_id] = [];
        }
        imagesParProduit[img.produit_id].push(img);
    });

    return produits.map(p => {
        const images = imagesParProduit[p.id] || [];
        const imagePrincipale = images.find(img => img.principale === 1) || images[0] || null;
        return {
            ...p,
            disponible: Boolean(p.disponible),
            publie: Boolean(p.publie),
            sur_mesure: Boolean(p.sur_mesure),
            image: imagePrincipale ? imagePrincipale.chemin : 'images/placeholder.jpg',
            images: images
        };
    });
}

// ============================================
// ENDPOINTS PUBLICS
// ============================================

/**
 * Liste des produits publiés (avec filtres, tri et recherche)
 * GET /api/produits
 */
function getAllPublic(req, res) {
    try {
        const { categorie, recherche, tri, disponible } = req.query;

        let query = `
            SELECT p.*, c.nom AS categorie_nom
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.publie = 1
        `;
        const params = [];

        // Filtre catégorie (id ou nom)
        if (categorie) {
            const catId = parseInt(categorie, 10);
            if (!isNaN(catId)) {
                query += ` AND p.categorie_id = ?`;
                params.push(catId);
            } else {
                query += ` AND LOWER(c.nom) = LOWER(?)`;
                params.push(categorie.trim());
            }
        }

        // Filtre recherche textuelle
        if (recherche && recherche.trim()) {
            const terme = `%${recherche.trim()}%`;
            query += ` AND (p.nom LIKE ? OR p.description LIKE ? OR p.materiau LIKE ?)`;
            params.push(terme, terme, terme);
        }

        // Filtre disponibilité
        if (disponible !== undefined) {
            query += ` AND p.disponible = ?`;
            params.push(disponible === '1' || disponible === 'true' ? 1 : 0);
        }

        // Tri
        switch (tri) {
            case 'prix-asc':
                query += ` ORDER BY p.prix ASC`;
                break;
            case 'prix-desc':
                query += ` ORDER BY p.prix DESC`;
                break;
            case 'nom-asc':
                query += ` ORDER BY p.nom ASC`;
                break;
            case 'recent':
            default:
                query += ` ORDER BY p.created_at DESC, p.id DESC`;
                break;
        }

        const produitsBruts = db.prepare(query).all(...params);
        const produits = attacherImagesAuxProduits(produitsBruts);

        return res.json({
            success: true,
            total: produits.length,
            data: produits
        });
    } catch (err) {
        console.error('[ProduitController] Erreur getAllPublic :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits.' });
    }
}

/**
 * Détail d'un produit par ID
 * GET /api/produits/:id
 */
function getById(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Identifiant invalide.' });
        }

        const produit = db.prepare(`
            SELECT p.*, c.nom AS categorie_nom
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.id = ?
        `).get(id);

        if (!produit) {
            return res.status(404).json({ success: false, message: 'Produit introuvable.' });
        }

        const [produitComplet] = attacherImagesAuxProduits([produit]);

        return res.json({
            success: true,
            data: produitComplet
        });
    } catch (err) {
        console.error('[ProduitController] Erreur getById :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération du produit.' });
    }
}

// ============================================
// ENDPOINTS ADMIN
// ============================================

/**
 * Liste complète des produits (y compris brouillons)
 * GET /api/admin/produits
 */
function getAllAdmin(req, res) {
    try {
        const query = `
            SELECT p.*, c.nom AS categorie_nom
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            ORDER BY p.id DESC
        `;
        const produitsBruts = db.prepare(query).all();
        const produits = attacherImagesAuxProduits(produitsBruts);

        return res.json({
            success: true,
            total: produits.length,
            data: produits
        });
    } catch (err) {
        console.error('[ProduitController] Erreur getAllAdmin :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits admin.' });
    }
}

/**
 * Création d'un nouveau produit avec images optionnelles
 * POST /api/admin/produits
 */
function create(req, res) {
    try {
        const {
            nom,
            categorie_id,
            prix,
            description,
            disponible,
            publie,
            dimensions,
            materiau,
            couleur,
            sur_mesure,
            quantite,
            image_url // URL ou chemin direct optionnel
        } = req.body;

        const catId = categorie_id ? parseInt(categorie_id, 10) : null;
        const disp = disponible === 'true' || disponible === 1 || disponible === '1' ? 1 : 0;
        const pub = publie === undefined || publie === 'true' || publie === 1 || publie === '1' ? 1 : 0;
        const surMes = sur_mesure === 'true' || sur_mesure === 1 || sur_mesure === '1' ? 1 : 0;
        const qte = quantite !== undefined ? parseInt(quantite, 10) : 0;

        const insertStmt = db.prepare(`
            INSERT INTO produits (
                nom, categorie_id, prix, description, disponible, publie,
                dimensions, materiau, couleur, sur_mesure, quantite,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        const result = insertStmt.run(
            nom,
            catId,
            prix,
            description || '',
            disp,
            pub,
            dimensions || '',
            materiau || '',
            couleur || '',
            surMes,
            qte
        );

        const nouveauProduitId = result.lastInsertRowid;

        // Traiter les images téléversées via Multer
        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                const cheminRelatif = `images/${file.filename}`;
                imageService.enregistrerImage(nouveauProduitId, cheminRelatif, index === 0);
            });
        } else if (image_url && image_url.trim()) {
            // Si une URL ou chemin direct est fourni
            imageService.enregistrerImage(nouveauProduitId, image_url.trim(), true);
        }

        const produitCree = db.prepare(`
            SELECT p.*, c.nom AS categorie_nom
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.id = ?
        `).get(nouveauProduitId);

        const [produitComplet] = attacherImagesAuxProduits([produitCree]);

        return res.status(201).json({
            success: true,
            message: 'Produit créé avec succès.',
            data: produitComplet
        });
    } catch (err) {
        console.error('[ProduitController] Erreur create :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la création du produit.' });
    }
}

/**
 * Mise à jour d'un produit existant
 * PUT /api/admin/produits/:id
 */
function update(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Identifiant invalide.' });
        }

        const existant = db.prepare('SELECT id FROM produits WHERE id = ?').get(id);
        if (!existant) {
            return res.status(404).json({ success: false, message: 'Produit introuvable.' });
        }

        const {
            nom,
            categorie_id,
            prix,
            description,
            disponible,
            publie,
            dimensions,
            materiau,
            couleur,
            sur_mesure,
            quantite,
            image_url
        } = req.body;

        const catId = categorie_id ? parseInt(categorie_id, 10) : null;
        const disp = disponible === 'true' || disponible === 1 || disponible === '1' ? 1 : 0;
        const pub = publie === undefined || publie === 'true' || publie === 1 || publie === '1' ? 1 : 0;
        const surMes = sur_mesure === 'true' || sur_mesure === 1 || sur_mesure === '1' ? 1 : 0;
        const qte = quantite !== undefined ? parseInt(quantite, 10) : 0;

        db.prepare(`
            UPDATE produits SET
                nom = ?,
                categorie_id = ?,
                prix = ?,
                description = ?,
                disponible = ?,
                publie = ?,
                dimensions = ?,
                materiau = ?,
                couleur = ?,
                sur_mesure = ?,
                quantite = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            nom,
            catId,
            prix,
            description || '',
            disp,
            pub,
            dimensions || '',
            materiau || '',
            couleur || '',
            surMes,
            qte,
            id
        );

        // Si de nouveaux fichiers sont ajoutés
        if (req.files && req.files.length > 0) {
            // Vérifier si le produit a déjà une image principale
            const nbImages = db.prepare('SELECT COUNT(*) as count FROM images_produit WHERE produit_id = ?').get(id).count;
            req.files.forEach((file, index) => {
                const cheminRelatif = `images/${file.filename}`;
                imageService.enregistrerImage(id, cheminRelatif, nbImages === 0 && index === 0);
            });
        } else if (image_url && image_url.trim()) {
            const nbImages = db.prepare('SELECT COUNT(*) as count FROM images_produit WHERE produit_id = ?').get(id).count;
            imageService.enregistrerImage(id, image_url.trim(), nbImages === 0);
        }

        const produitModifie = db.prepare(`
            SELECT p.*, c.nom AS categorie_nom
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.id = ?
        `).get(id);

        const [produitComplet] = attacherImagesAuxProduits([produitModifie]);

        return res.json({
            success: true,
            message: 'Produit mis à jour avec succès.',
            data: produitComplet
        });
    } catch (err) {
        console.error('[ProduitController] Erreur update :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du produit.' });
    }
}

/**
 * Suppression d'un produit (et de ses images)
 * DELETE /api/admin/produits/:id
 */
function deleteProduit(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Identifiant invalide.' });
        }

        const existant = db.prepare('SELECT id FROM produits WHERE id = ?').get(id);
        if (!existant) {
            return res.status(404).json({ success: false, message: 'Produit introuvable.' });
        }

        // Supprimer physiquement les images associées
        imageService.supprimerImagesProduit(id);

        // Supprimer le produit de la base
        db.prepare('DELETE FROM produits WHERE id = ?').run(id);

        return res.json({
            success: true,
            message: 'Produit et images supprimés avec succès.'
        });
    } catch (err) {
        console.error('[ProduitController] Erreur deleteProduit :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la suppression du produit.' });
    }
}

/**
 * Basculer la disponibilité d'un produit
 * PATCH /api/admin/produits/:id/disponibilite
 */
function toggleDisponibilite(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const produit = db.prepare('SELECT disponible FROM produits WHERE id = ?').get(id);

        if (!produit) {
            return res.status(404).json({ success: false, message: 'Produit introuvable.' });
        }

        const nouvelleValeur = produit.disponible === 1 ? 0 : 1;
        db.prepare('UPDATE produits SET disponible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nouvelleValeur, id);

        return res.json({
            success: true,
            disponible: Boolean(nouvelleValeur),
            message: `Disponibilité mise à jour (${nouvelleValeur ? 'Disponible' : 'Indisponible'}).`
        });
    } catch (err) {
        console.error('[ProduitController] Erreur toggleDisponibilite :', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
}

/**
 * Basculer la publication d'un produit
 * PATCH /api/admin/produits/:id/publication
 */
function togglePublication(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const produit = db.prepare('SELECT publie FROM produits WHERE id = ?').get(id);

        if (!produit) {
            return res.status(404).json({ success: false, message: 'Produit introuvable.' });
        }

        const nouvelleValeur = produit.publie === 1 ? 0 : 1;
        db.prepare('UPDATE produits SET publie = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nouvelleValeur, id);

        return res.json({
            success: true,
            publie: Boolean(nouvelleValeur),
            message: `Publication mise à jour (${nouvelleValeur ? 'Publié' : 'Brouillon'}).`
        });
    } catch (err) {
        console.error('[ProduitController] Erreur togglePublication :', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
}

/**
 * Ajouter des images à un produit
 * POST /api/admin/produits/:id/images
 */
function uploadImages(req, res) {
    try {
        const produitId = parseInt(req.params.id, 10);
        const produit = db.prepare('SELECT id FROM produits WHERE id = ?').get(produitId);

        if (!produit) {
            return res.status(404).json({ success: false, message: 'Produit introuvable.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Aucun fichier sélectionné.' });
        }

        const imagesCreees = [];
        req.files.forEach((file, index) => {
            const cheminRelatif = `images/${file.filename}`;
            const img = imageService.enregistrerImage(produitId, cheminRelatif, false);
            imagesCreees.push(img);
        });

        return res.status(201).json({
            success: true,
            message: `${imagesCreees.length} image(s) ajoutée(s).`,
            data: imagesCreees
        });
    } catch (err) {
        console.error('[ProduitController] Erreur uploadImages :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout des images.' });
    }
}

/**
 * Supprimer une image spécifique
 * DELETE /api/admin/images/:id
 */
function deleteImage(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const supprime = imageService.supprimerImage(id);

        if (!supprime) {
            return res.status(404).json({ success: false, message: 'Image introuvable.' });
        }

        return res.json({
            success: true,
            message: 'Image supprimée avec succès.'
        });
    } catch (err) {
        console.error('[ProduitController] Erreur deleteImage :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'image.' });
    }
}

/**
 * Définir comme image principale
 * PATCH /api/admin/images/:id/principale
 */
function setMainImage(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const image = db.prepare('SELECT * FROM images_produit WHERE id = ?').get(id);

        if (!image) {
            return res.status(404).json({ success: false, message: 'Image introuvable.' });
        }

        // Remettre à 0 toutes les images du produit
        db.prepare('UPDATE images_produit SET principale = 0 WHERE produit_id = ?').run(image.produit_id);
        // Mettre celle-ci à 1
        db.prepare('UPDATE images_produit SET principale = 1 WHERE id = ?').run(id);

        return res.json({
            success: true,
            message: 'Image principale mise à jour.'
        });
    } catch (err) {
        console.error('[ProduitController] Erreur setMainImage :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'image.' });
    }
}

module.exports = {
    getAllPublic,
    getById,
    getAllAdmin,
    create,
    update,
    deleteProduit,
    toggleDisponibilite,
    togglePublication,
    uploadImages,
    deleteImage,
    setMainImage
};
