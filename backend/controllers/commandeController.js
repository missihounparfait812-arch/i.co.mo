/*
 * ==============================================
 * I.CO.MO — CONTRÔLEUR DE COMMANDES & STATS
 * ==============================================
 * Traitement des commandes clients (panier) et
 * tableau de bord d'administration.
 */

const db = require('../models/database');

/**
 * Génère une référence unique de commande (ex: CMD-2026-9482)
 */
function genererReference() {
    const annee = new Date().getFullYear();
    const aleatoire = Math.floor(1000 + Math.random() * 9000);
    return `CMD-${annee}-${aleatoire}`;
}

// ============================================
// ENDPOINTS PUBLICS
// ============================================

/**
 * Création d'une commande par un client
 * POST /api/commandes
 */
function create(req, res) {
    try {
        const {
            client_nom,
            client_telephone,
            client_adresse,
            client_commune,
            notes,
            articles,
            whatsapp_envoyee
        } = req.body;

        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({ success: false, message: 'Le panier est vide.' });
        }

        // Calculer le total et valider les articles
        let total = 0;
        const articlesValides = [];

        for (const item of articles) {
            const produitId = item.id || item.produit_id;
            let produit = null;
            if (produitId) {
                produit = db.prepare('SELECT id, nom, prix FROM produits WHERE id = ?').get(produitId);
            }

            const quantite = Math.max(1, parseInt(item.quantite, 10) || 1);
            const prix = produit ? produit.prix : Math.max(0, parseInt(item.prix, 10) || 0);
            const nomProduit = produit ? produit.nom : (item.nom || 'Article');

            const sousTotal = prix * quantite;
            total += sousTotal;

            articlesValides.push({
                produit_id: produit ? produit.id : null,
                nom_produit: nomProduit,
                prix_unitaire: prix,
                quantite: quantite
            });
        }

        // Transaction SQLite pour cohérence
        const reference = genererReference();
        const insertCommande = db.prepare(`
            INSERT INTO commandes (
                reference, client_nom, client_telephone, client_adresse,
                client_commune, notes, total, statut, whatsapp_envoyee,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'en_attente', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

        const insertLigne = db.prepare(`
            INSERT INTO lignes_commande (
                commande_id, produit_id, nom_produit, prix_unitaire, quantite
            ) VALUES (?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction(() => {
            const resCommande = insertCommande.run(
                reference,
                client_nom,
                client_telephone,
                client_adresse || '',
                client_commune || '',
                notes || '',
                total,
                whatsapp_envoyee ? 1 : 0
            );

            const commandeId = resCommande.lastInsertRowid;

            for (const art of articlesValides) {
                insertLigne.run(
                    commandeId,
                    art.produit_id,
                    art.nom_produit,
                    art.prix_unitaire,
                    art.quantite
                );
            }

            return commandeId;
        });

        const nouveauCommandeId = transaction();

        const commandeCreee = db.prepare('SELECT * FROM commandes WHERE id = ?').get(nouveauCommandeId);

        return res.status(201).json({
            success: true,
            message: 'Commande enregistrée avec succès.',
            data: {
                ...commandeCreee,
                articles: articlesValides
            }
        });
    } catch (err) {
        console.error('[CommandeController] Erreur create :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'enregistrement de la commande.' });
    }
}

// ============================================
// ENDPOINTS ADMIN
// ============================================

/**
 * Récupère toutes les commandes avec leurs lignes
 * GET /api/admin/commandes
 */
function getAll(req, res) {
    try {
        const { statut } = req.query;

        let query = `SELECT * FROM commandes`;
        const params = [];

        if (statut) {
            query += ` WHERE statut = ?`;
            params.push(statut);
        }

        query += ` ORDER BY id DESC`;

        const commandes = db.prepare(query).all(...params);

        if (commandes.length === 0) {
            return res.json({ success: true, total: 0, data: [] });
        }

        const commandeIds = commandes.map(c => c.id);
        const placeholders = commandeIds.map(() => '?').join(',');

        const lignes = db.prepare(`
            SELECT * FROM lignes_commande WHERE commande_id IN (${placeholders})
        `).all(...commandeIds);

        const lignesParCommande = {};
        lignes.forEach(l => {
            if (!lignesParCommande[l.commande_id]) lignesParCommande[l.commande_id] = [];
            lignesParCommande[l.commande_id].push(l);
        });

        const result = commandes.map(c => ({
            ...c,
            whatsapp_envoyee: Boolean(c.whatsapp_envoyee),
            articles: lignesParCommande[c.id] || []
        }));

        return res.json({
            success: true,
            total: result.length,
            data: result
        });
    } catch (err) {
        console.error('[CommandeController] Erreur getAll :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes.' });
    }
}

/**
 * Récupère le détail d'une commande
 * GET /api/admin/commandes/:id
 */
function getById(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const commande = db.prepare('SELECT * FROM commandes WHERE id = ?').get(id);

        if (!commande) {
            return res.status(404).json({ success: false, message: 'Commande introuvable.' });
        }

        const articles = db.prepare('SELECT * FROM lignes_commande WHERE commande_id = ?').all(id);

        return res.json({
            success: true,
            data: {
                ...commande,
                articles
            }
        });
    } catch (err) {
        console.error('[CommandeController] Erreur getById :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la commande.' });
    }
}

/**
 * Met à jour le statut d'une commande
 * PATCH /api/admin/commandes/:id/statut
 */
function updateStatut(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { statut } = req.body;

        const statutsAutorises = ['en_attente', 'confirmee', 'en_fabrication', 'livree', 'annulee'];
        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({
                success: false,
                message: `Statut invalide. Statuts possibles : ${statutsAutorises.join(', ')}`
            });
        }

        const result = db.prepare(`
            UPDATE commandes
            SET statut = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(statut, id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Commande introuvable.' });
        }

        return res.json({
            success: true,
            message: 'Statut mis à jour avec succès.',
            statut
        });
    } catch (err) {
        console.error('[CommandeController] Erreur updateStatut :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du statut.' });
    }
}

/**
 * Supprime une commande
 * DELETE /api/admin/commandes/:id
 */
function deleteCommande(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const result = db.prepare('DELETE FROM commandes WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, message: 'Commande introuvable.' });
        }

        return res.json({
            success: true,
            message: 'Commande supprimée avec succès.'
        });
    } catch (err) {
        console.error('[CommandeController] Erreur deleteCommande :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la commande.' });
    }
}

/**
 * Statistiques globales pour le tableau de bord
 * GET /api/admin/statistiques
 */
function getStatistiques(req, res) {
    try {
        const totalProduits = db.prepare('SELECT COUNT(*) as count FROM produits').get().count;
        const totalPublies = db.prepare('SELECT COUNT(*) as count FROM produits WHERE publie = 1').get().count;
        const totalDisponibles = db.prepare('SELECT COUNT(*) as count FROM produits WHERE disponible = 1').get().count;
        const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;

        const totalCommandes = db.prepare('SELECT COUNT(*) as count FROM commandes').get().count;
        const commandesEnAttente = db.prepare("SELECT COUNT(*) as count FROM commandes WHERE statut = 'en_attente'").get().count;
        const commandesEnCours = db.prepare("SELECT COUNT(*) as count FROM commandes WHERE statut IN ('confirmee', 'en_fabrication')").get().count;
        const commandesLivrees = db.prepare("SELECT COUNT(*) as count FROM commandes WHERE statut = 'livree'").get().count;

        const chiffreAffaires = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM commandes WHERE statut != 'annulee'").get().total;

        // 5 dernières commandes
        const dernieresCommandes = db.prepare(`
            SELECT id, reference, client_nom, client_telephone, total, statut, created_at
            FROM commandes
            ORDER BY id DESC
            LIMIT 5
        `).all();

        return res.json({
            success: true,
            data: {
                produits: {
                    total: totalProduits,
                    publies: totalPublies,
                    disponibles: totalDisponibles
                },
                categories: totalCategories,
                commandes: {
                    total: totalCommandes,
                    en_attente: commandesEnAttente,
                    en_cours: commandesEnCours,
                    livrees: commandesLivrees
                },
                chiffre_affaires: chiffreAffaires,
                dernieres_commandes: dernieresCommandes
            }
        });
    } catch (err) {
        console.error('[CommandeController] Erreur getStatistiques :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques.' });
    }
}

module.exports = {
    create,
    getAll,
    getById,
    updateStatut,
    deleteCommande,
    getStatistiques
};
