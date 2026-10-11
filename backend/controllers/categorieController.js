/*
 * ==============================================
 * I.CO.MO — CONTRÔLEUR DE CATÉGORIES
 * ==============================================
 * Gestion des catégories de menuiserie (Salon, Chambre, etc.)
 */

const db = require('../models/database');

/**
 * Récupère toutes les catégories (avec le nombre de produits associés)
 * GET /api/categories
 */
function getAll(req, res) {
    try {
        const categories = db.prepare(`
            SELECT 
                c.*,
                COUNT(p.id) AS total_produits
            FROM categories c
            LEFT JOIN produits p ON p.categorie_id = c.id
            GROUP BY c.id
            ORDER BY c.nom ASC
        `).all();

        return res.json({
            success: true,
            total: categories.length,
            data: categories
        });
    } catch (err) {
        console.error('[CategorieController] Erreur getAll :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des catégories.' });
    }
}

/**
 * Créer une nouvelle catégorie
 * POST /api/admin/categories
 */
function create(req, res) {
    try {
        const { nom, description } = req.body;

        const existante = db.prepare('SELECT id FROM categories WHERE LOWER(nom) = LOWER(?)').get(nom.trim());
        if (existante) {
            return res.status(409).json({ success: false, message: 'Cette catégorie existe déjà.' });
        }

        const result = db.prepare(
            'INSERT INTO categories (nom, description) VALUES (?, ?)'
        ).run(nom.trim(), (description || '').trim());

        const nouvelle = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

        return res.status(201).json({
            success: true,
            message: 'Catégorie créée avec succès.',
            data: nouvelle
        });
    } catch (err) {
        console.error('[CategorieController] Erreur create :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la création de la catégorie.' });
    }
}

/**
 * Mettre à jour une catégorie
 * PUT /api/admin/categories/:id
 */
function update(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { nom, description } = req.body;

        const existante = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
        if (!existante) {
            return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
        }

        // Vérifier unicité du nom si changé
        const doublon = db.prepare('SELECT id FROM categories WHERE LOWER(nom) = LOWER(?) AND id != ?').get(nom.trim(), id);
        if (doublon) {
            return res.status(409).json({ success: false, message: 'Ce nom de catégorie est déjà utilisé.' });
        }

        db.prepare(
            'UPDATE categories SET nom = ?, description = ? WHERE id = ?'
        ).run(nom.trim(), (description || '').trim(), id);

        const modifiee = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

        return res.json({
            success: true,
            message: 'Catégorie mise à jour avec succès.',
            data: modifiee
        });
    } catch (err) {
        console.error('[CategorieController] Erreur update :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la catégorie.' });
    }
}

/**
 * Supprimer une catégorie
 * DELETE /api/admin/categories/:id
 */
function deleteCategorie(req, res) {
    try {
        const id = parseInt(req.params.id, 10);

        const existante = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
        if (!existante) {
            return res.status(404).json({ success: false, message: 'Catégorie introuvable.' });
        }

        // Dissocier les produits (categorie_id mis à NULL via SQLite foreign key ON DELETE SET NULL)
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);

        return res.json({
            success: true,
            message: 'Catégorie supprimée avec succès.'
        });
    } catch (err) {
        console.error('[CategorieController] Erreur deleteCategorie :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la catégorie.' });
    }
}

module.exports = {
    getAll,
    create,
    update,
    deleteCategorie
};
