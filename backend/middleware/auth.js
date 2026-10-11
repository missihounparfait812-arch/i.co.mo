/*
 * ==============================================
 * I.CO.MO — MIDDLEWARE D'AUTHENTIFICATION
 * ==============================================
 * Vérifie le JWT dans le header Authorization
 * ou dans un cookie httpOnly.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware : exige un JWT valide pour continuer
 */
function requireAuth(req, res, next) {
    // Chercher le token dans le header Authorization ou le cookie
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.icomo_token) {
        token = req.cookies.icomo_token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Accès refusé. Veuillez vous connecter.'
        });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Session expirée. Veuillez vous reconnecter.'
        });
    }
}

/**
 * Génère un JWT pour un administrateur
 */
function generateToken(admin) {
    return jwt.sign(
        { id: admin.id, username: admin.username },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
}

module.exports = { requireAuth, generateToken };
