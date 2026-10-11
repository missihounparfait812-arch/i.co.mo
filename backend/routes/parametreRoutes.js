/*
 * ==============================================
 * I.CO.MO — ROUTES PUBLIQUES DES PARAMÈTRES
 * ==============================================
 */

const express = require('express');
const router = express.Router();
const parametreController = require('../controllers/parametreController');

// Paramètres publics (WhatsApp, téléphone, horaires, etc.)
router.get('/public', parametreController.getPublic);

module.exports = router;
