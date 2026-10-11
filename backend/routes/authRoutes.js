/*
 * ==============================================
 * I.CO.MO — ROUTES D'AUTHENTIFICATION
 * ==============================================
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Public
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protégé
router.get('/check', requireAuth, authController.check);
router.put('/profil', requireAuth, authController.updateProfil);

module.exports = router;
