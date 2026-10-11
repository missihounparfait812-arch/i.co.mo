/*
 * ==============================================
 * I.CO.MO — ROUTES D'ADMINISTRATION (PROTÉGÉES)
 * ==============================================
 * Toutes les routes nécessitent un token JWT valide.
 */

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validerProduit, validerCategorie } = require('../middleware/validation');

const produitController = require('../controllers/produitController');
const categorieController = require('../controllers/categorieController');
const commandeController = require('../controllers/commandeController');
const parametreController = require('../controllers/parametreController');

// Appliquer le middleware d'authentification sur TOUTES les routes admin
router.use(requireAuth);

// ============================================
// STATISTIQUES DASHBOARD
// ============================================
router.get('/statistiques', commandeController.getStatistiques);

// ============================================
// GESTION DES PRODUITS
// ============================================
router.get('/produits', produitController.getAllAdmin);
router.post('/produits', upload.array('images', 5), validerProduit, produitController.create);
router.put('/produits/:id', upload.array('images', 5), validerProduit, produitController.update);
router.delete('/produits/:id', produitController.deleteProduit);

router.patch('/produits/:id/disponibilite', produitController.toggleDisponibilite);
router.patch('/produits/:id/publication', produitController.togglePublication);

// Images des produits
router.post('/produits/:id/images', upload.array('images', 5), produitController.uploadImages);
router.delete('/images/:id', produitController.deleteImage);
router.patch('/images/:id/principale', produitController.setMainImage);

// ============================================
// GESTION DES CATÉGORIES
// ============================================
router.post('/categories', validerCategorie, categorieController.create);
router.put('/categories/:id', validerCategorie, categorieController.update);
router.delete('/categories/:id', categorieController.deleteCategorie);

// ============================================
// GESTION DES COMMANDES
// ============================================
router.get('/commandes', commandeController.getAll);
router.get('/commandes/:id', commandeController.getById);
router.patch('/commandes/:id/statut', commandeController.updateStatut);
router.delete('/commandes/:id', commandeController.deleteCommande);

// ============================================
// PARAMÈTRES DU SITE
// ============================================
router.get('/parametres', parametreController.getAll);
router.put('/parametres', parametreController.update);

module.exports = router;
