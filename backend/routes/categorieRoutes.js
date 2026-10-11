/*
 * ==============================================
 * I.CO.MO — ROUTES PUBLIQUES DES CATÉGORIES
 * ==============================================
 */

const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorieController');

// Liste de toutes les catégories avec le nombre de produits
router.get('/', categorieController.getAll);

module.exports = router;
