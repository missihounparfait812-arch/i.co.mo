/*
 * ==============================================
 * I.CO.MO — ROUTES PUBLIQUES DES PRODUITS
 * ==============================================
 */

const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController');

// Liste des produits avec filtres (catégorie, recherche, tri, disponibilité)
router.get('/', produitController.getAllPublic);

// Détail d'un produit
router.get('/:id', produitController.getById);

module.exports = router;
