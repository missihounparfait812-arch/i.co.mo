/*
 * ==============================================
 * I.CO.MO — ROUTEUR PRINCIPAL DE L'API
 * ==============================================
 * Centralise et monte toutes les sous-routes.
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const produitRoutes = require('./produitRoutes');
const categorieRoutes = require('./categorieRoutes');
const commandeRoutes = require('./commandeRoutes');
const parametreRoutes = require('./parametreRoutes');
const adminRoutes = require('./adminRoutes');

// Point d'état de l'API
router.get('/health', (req, res) => {
    res.json({
        success: true,
        nom: 'I.CO.MO API',
        version: '1.0.0',
        statut: 'en ligne',
        timestamp: new Date().toISOString()
    });
});

// Montage des routes
router.use('/auth', authRoutes);
router.use('/produits', produitRoutes);
router.use('/categories', categorieRoutes);
router.use('/commandes', commandeRoutes);
router.use('/parametres', parametreRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
