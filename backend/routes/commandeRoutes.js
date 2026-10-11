/*
 * ==============================================
 * I.CO.MO — ROUTES PUBLIQUES DES COMMANDES
 * ==============================================
 */

const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');
const { validerCommande } = require('../middleware/validation');

// Création d'une nouvelle commande (panier client)
router.post('/', validerCommande, commandeController.create);

module.exports = router;
