/*
 * ==============================================
 * I.CO.MO — MIDDLEWARE DE VALIDATION
 * ==============================================
 * Fonctions de validation des données entrantes
 * pour protéger la base de données.
 */

/**
 * Valide les données d'un produit
 */
function validerProduit(req, res, next) {
    const { nom, prix } = req.body;

    const erreurs = [];

    if (!nom || typeof nom !== 'string' || nom.trim().length < 2) {
        erreurs.push('Le nom du produit est requis (minimum 2 caractères).');
    }
    if (nom && nom.trim().length > 200) {
        erreurs.push('Le nom du produit ne peut pas dépasser 200 caractères.');
    }

    const prixNum = parseInt(prix, 10);
    if (isNaN(prixNum) || prixNum < 0) {
        erreurs.push('Le prix doit être un nombre positif.');
    }
    if (prixNum > 100000000) {
        erreurs.push('Le prix semble trop élevé.');
    }

    if (erreurs.length > 0) {
        return res.status(400).json({ success: false, message: erreurs.join(' ') });
    }

    // Nettoyer les données
    req.body.nom = nom.trim();
    req.body.prix = prixNum;
    if (req.body.description) req.body.description = req.body.description.trim();
    if (req.body.dimensions) req.body.dimensions = req.body.dimensions.trim();
    if (req.body.materiau) req.body.materiau = req.body.materiau.trim();
    if (req.body.couleur) req.body.couleur = req.body.couleur.trim();

    next();
}

/**
 * Valide les données d'une commande
 */
function validerCommande(req, res, next) {
    const { client_nom, client_telephone, articles } = req.body;

    const erreurs = [];

    if (!client_nom || client_nom.trim().length < 2) {
        erreurs.push('Le nom du client est requis.');
    }
    if (!client_telephone || client_telephone.trim().length < 8) {
        erreurs.push('Le numéro de téléphone est requis.');
    }
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
        erreurs.push('La commande doit contenir au moins un article.');
    }

    if (erreurs.length > 0) {
        return res.status(400).json({ success: false, message: erreurs.join(' ') });
    }

    req.body.client_nom = client_nom.trim();
    req.body.client_telephone = client_telephone.trim();
    if (req.body.client_adresse) req.body.client_adresse = req.body.client_adresse.trim();
    if (req.body.client_commune) req.body.client_commune = req.body.client_commune.trim();
    if (req.body.notes) req.body.notes = req.body.notes.trim();

    next();
}

/**
 * Valide les données d'une catégorie
 */
function validerCategorie(req, res, next) {
    const { nom } = req.body;

    if (!nom || typeof nom !== 'string' || nom.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Le nom de la catégorie est requis (minimum 2 caractères).'
        });
    }
    if (nom.trim().length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Le nom de la catégorie ne peut pas dépasser 100 caractères.'
        });
    }

    req.body.nom = nom.trim();
    if (req.body.description) req.body.description = req.body.description.trim();

    next();
}

module.exports = { validerProduit, validerCommande, validerCategorie };
