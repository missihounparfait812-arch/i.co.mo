/*
 * ==============================================
 * I.CO.MO — CONTRÔLEUR DES PARAMÈTRES
 * ==============================================
 * Gestion de la configuration du site (WhatsApp, etc.)
 */

const db = require('../models/database');

/**
 * Récupère les paramètres publics (WhatsApp, contact)
 * GET /api/parametres/public
 */
function getPublic(req, res) {
    try {
        const rows = db.prepare('SELECT cle, valeur FROM parametres').all();
        const parametres = {};
        rows.forEach(r => {
            parametres[r.cle] = r.valeur;
        });

        return res.json({
            success: true,
            data: {
                whatsapp_number: parametres.whatsapp_number || process.env.WHATSAPP_NUMBER || '+225 07 00 00 00 00',
                telephone: parametres.telephone || '+225 07 00 00 00 00',
                email: parametres.email || 'contact@icomo-menuiserie.ci',
                adresse: parametres.adresse || 'Abidjan, Côte d\'Ivoire',
                horaires: parametres.horaires || 'Lun - Sam : 08h00 - 18h00'
            }
        });
    } catch (err) {
        console.error('[ParametreController] Erreur getPublic :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres.' });
    }
}

/**
 * Récupère tous les paramètres (admin)
 * GET /api/admin/parametres
 */
function getAll(req, res) {
    try {
        const rows = db.prepare('SELECT cle, valeur FROM parametres').all();
        const parametres = {};
        rows.forEach(r => {
            parametres[r.cle] = r.valeur;
        });

        return res.json({
            success: true,
            data: parametres
        });
    } catch (err) {
        console.error('[ParametreController] Erreur getAll :', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
}

/**
 * Met à jour des paramètres
 * PUT /api/admin/parametres
 */
function update(req, res) {
    try {
        const donnees = req.body;
        if (!donnees || typeof donnees !== 'object') {
            return res.status(400).json({ success: false, message: 'Données invalides.' });
        }

        const upsert = db.prepare(`
            INSERT INTO parametres (cle, valeur)
            VALUES (?, ?)
            ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur
        `);

        const transaction = db.transaction(() => {
            for (const [cle, valeur] of Object.entries(donnees)) {
                upsert.run(cle, String(valeur));
            }
        });

        transaction();

        return res.json({
            success: true,
            message: 'Paramètres mis à jour avec succès.'
        });
    } catch (err) {
        console.error('[ParametreController] Erreur update :', err);
        return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des paramètres.' });
    }
}

module.exports = {
    getPublic,
    getAll,
    update
};
