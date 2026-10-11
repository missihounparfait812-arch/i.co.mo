/*
 * ==============================================
 * I.CO.MO — SERVEUR PRINCIPAL
 * ==============================================
 * Serveur Express : API REST + service des fichiers statiques.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');

const app = express();

// ============================================
// SÉCURITÉ & MIDDLEWARES GLOBAUX
// ============================================

// Configuration Helmet adaptée pour servir les assets frontend
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
    origin: true,
    credentials: true
}));

// Parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Anti-brute-force sur le login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 tentatives max
    message: {
        success: false,
        message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth/login', loginLimiter);

// Limiteur général d'API (100 requêtes / minute)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 120,
    message: { success: false, message: 'Trop de requêtes, veuillez ralentir.' }
});
app.use('/api/', apiLimiter);

// ============================================
// ROUTES DE L'API REST
// ============================================

app.use('/api', routes);

// ============================================
// FICHIERS STATIQUES DU FRONTEND
// ============================================

// Servir les dossiers spécifiques
app.use('/images', express.static(path.resolve(config.rootDir, 'images')));
app.use('/css', express.static(path.resolve(config.rootDir, 'css')));
app.use('/js', express.static(path.resolve(config.rootDir, 'js')));

// Servir la racine (pour index.html, admin.html, produits.html, etc.)
app.use(express.static(config.rootDir, {
    index: 'index.html',
    extensions: ['html']
}));

// Fallback 404 pour l'API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint API introuvable : ${req.method} ${req.originalUrl}`
    });
});

// ============================================
// GESTION GLOBALE DES ERREURS
// ============================================

app.use((err, req, res, next) => {
    console.error('[Serveur] Erreur non gérée :', err);

    // Erreur Multer
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'Le fichier dépasse la taille maximale autorisée (5 Mo).' });
        }
        return res.status(400).json({ success: false, message: `Erreur téléversement : ${err.message}` });
    }

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Une erreur interne est survenue sur le serveur.'
    });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

const server = app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               I.CO.MO — SERVEUR OPÉRATIONNEL                 ║
╠══════════════════════════════════════════════════════════════╣
║  🌍 Application : http://localhost:${config.port}                     ║
║  ⚙️  API REST    : http://localhost:${config.port}/api                 ║
║  🔐 Admin        : http://localhost:${config.port}/admin.html           ║
║  📦 Environnement: ${config.nodeEnv.padEnd(42)}║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// Arrêt gracieux
process.on('SIGTERM', () => {
    console.log('Arrêt du serveur...');
    server.close(() => process.exit(0));
});

module.exports = app;
