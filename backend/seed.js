/*
 * ==============================================
 * I.CO.MO — SCRIPT DE SEED (INITIALISATION DB)
 * ==============================================
 * Initialise la base SQLite avec :
 * 1. L'administrateur sécurisé (bcrypt)
 * 2. Les catégories de menuiserie
 * 3. Les 10 produits initiaux du catalogue
 * 4. Les images associées
 * 5. Les paramètres du site (WhatsApp, etc.)
 *
 * Exécution : npm run seed
 */

const bcrypt = require('bcryptjs');
const db = require('./models/database');
const config = require('./config');

console.log('🌱 Initialisation de la base de données I.CO.MO...');

// 1. Administrateur
const adminExistant = db.prepare('SELECT id FROM admins WHERE username = ?').get(config.adminUsername);
if (!adminExistant) {
    const hash = bcrypt.hashSync(config.adminPassword, 10);
    db.prepare(`
        INSERT INTO admins (username, password_hash, nom)
        VALUES (?, ?, ?)
    `).run(config.adminUsername, hash, 'Administrateur I.CO.MO');
    console.log(`✅ Compte admin créé : "${config.adminUsername}" (mot de passe configuré dans .env)`);
} else {
    console.log(`ℹ️ Compte admin déjà existant : "${config.adminUsername}"`);
}

// 2. Catégories
const categoriesInitiales = [
    { nom: 'Armoire', description: 'Armoires modernes et traditionnelles en bois massif' },
    { nom: 'Lit', description: 'Lits king size, lits simples et têtes de lit travaillées' },
    { nom: 'Table', description: 'Tables à manger, tables basses et consoles' },
    { nom: 'Chaise', description: 'Chaises design et fauteuils confortables' },
    { nom: 'Dressing', description: 'Dressings complets sur mesure et aménagements' },
    { nom: 'Meuble TV', description: 'Meubles TV contemporains avec rangements' },
    { nom: 'Porte', description: 'Portes sculptées, portes intérieures et extérieures' },
    { nom: 'Bureau', description: 'Bureaux directorials et tables de travail' },
    { nom: 'Cuisine', description: 'Cuisines équipées et plans de travail' },
    { nom: 'Bibliothèque', description: 'Bibliothèques murales et rayonnages design' }
];

const insertCat = db.prepare(`
    INSERT INTO categories (nom, description)
    VALUES (?, ?)
    ON CONFLICT(nom) DO UPDATE SET description = excluded.description
`);

categoriesInitiales.forEach(cat => {
    insertCat.run(cat.nom, cat.description);
});
console.log(`✅ ${categoriesInitiales.length} catégories insérées / synchronisées.`);

// Récupérer la map des catégories pour les IDs
const categoriesMap = {};
db.prepare('SELECT id, nom FROM categories').all().forEach(c => {
    categoriesMap[c.nom] = c.id;
});

// 3. Produits initiaux
const produitsInitiaux = [
    {
        id: 1,
        nom: "Armoire Moderne",
        categorie: "Armoire",
        prix: 150000,
        image: "images/armoire-moderne.jpg",
        description: "Armoire moderne fabriquée sur mesure en bois massif de qualité supérieure. Design épuré avec des finitions soignées pour un rangement optimal et élégant.",
        disponible: 1,
        publie: 1,
        dimensions: "200 x 120 x 60 cm",
        materiau: "Bois massif d'iroko",
        couleur: "Marron naturel",
        sur_mesure: 1,
        quantite: 5
    },
    {
        id: 2,
        nom: "Lit King Size Luxe",
        categorie: "Lit",
        prix: 250000,
        image: "images/lit-king-size.jpg",
        description: "Lit king size luxueux avec tête de lit sculptée. Structure robuste en bois massif avec des détails artisanaux qui apportent une touche d'élégance à votre chambre.",
        disponible: 1,
        publie: 1,
        dimensions: "220 x 200 x 130 cm",
        materiau: "Bois massif de teck",
        couleur: "Marron foncé",
        sur_mesure: 1,
        quantite: 3
    },
    {
        id: 3,
        nom: "Table à Manger Familiale",
        categorie: "Table",
        prix: 180000,
        image: "images/table-manger.jpg",
        description: "Grande table à manger pour 8 personnes, idéale pour les repas en famille. Fabriquée en bois massif avec un plateau épais et des pieds sculptés.",
        disponible: 1,
        publie: 1,
        dimensions: "200 x 100 x 76 cm",
        materiau: "Bois massif de fraké",
        couleur: "Beige naturel",
        sur_mesure: 1,
        quantite: 4
    },
    {
        id: 4,
        nom: "Chaise Design Confort",
        categorie: "Chaise",
        prix: 35000,
        image: "images/chaise-design.jpg",
        description: "Chaise design alliant confort et esthétique. Assise ergonomique avec dossier incurvé pour un confort optimal au quotidien.",
        disponible: 1,
        publie: 1,
        dimensions: "90 x 45 x 50 cm",
        materiau: "Bois massif et tissu",
        couleur: "Beige et marron",
        sur_mesure: 0,
        quantite: 16
    },
    {
        id: 5,
        nom: "Dressing Complet",
        categorie: "Dressing",
        prix: 350000,
        image: "images/dressing-complet.jpg",
        description: "Dressing complet avec portes coulissantes, miroir intégré et éclairage LED. Organisation optimale avec étagères, tiroirs et penderies.",
        disponible: 1,
        publie: 1,
        dimensions: "300 x 250 x 65 cm",
        materiau: "MDF plaqué et bois massif",
        couleur: "Blanc et chêne",
        sur_mesure: 1,
        quantite: 2
    },
    {
        id: 6,
        nom: "Meuble TV Contemporain",
        categorie: "Meuble TV",
        prix: 120000,
        image: "images/meuble-tv.jpg",
        description: "Meuble TV contemporain avec rangements intégrés et passage de câbles discret. Design moderne pour sublimer votre salon.",
        disponible: 1,
        publie: 1,
        dimensions: "180 x 45 x 55 cm",
        materiau: "Bois massif et métal",
        couleur: "Noyer et noir",
        sur_mesure: 1,
        quantite: 6
    },
    {
        id: 7,
        nom: "Porte Principale Sculptée",
        categorie: "Porte",
        prix: 200000,
        image: "images/porte-sculptee.jpg",
        description: "Porte principale en bois massif avec sculptures artisanales. Imposante et sécurisée, elle donne un caractère unique à l'entrée de votre maison.",
        disponible: 1,
        publie: 1,
        dimensions: "220 x 100 x 8 cm",
        materiau: "Bois massif d'acajou",
        couleur: "Acajou foncé",
        sur_mesure: 1,
        quantite: 2
    },
    {
        id: 8,
        nom: "Bureau Directorial",
        categorie: "Bureau",
        prix: 280000,
        image: "images/bureau-directorial.jpg",
        description: "Bureau directorial spacieux avec tiroirs verrouillables et plateau en cuir. Parfait pour un espace de travail professionnel et prestigieux.",
        disponible: 1,
        publie: 1,
        dimensions: "180 x 90 x 76 cm",
        materiau: "Bois massif et cuir",
        couleur: "Marron foncé et noir",
        sur_mesure: 1,
        quantite: 3
    },
    {
        id: 9,
        nom: "Cuisine Équipée Premium",
        categorie: "Cuisine",
        prix: 500000,
        image: "images/cuisine-equipee.jpg",
        description: "Cuisine équipée complète sur mesure. Meubles hauts et bas, plan de travail en granit, finitions laquées et accessoires de rangement intégrés.",
        disponible: 0,
        publie: 1,
        dimensions: "Sur mesure",
        materiau: "Bois massif et granit",
        couleur: "Blanc laqué et bois",
        sur_mesure: 1,
        quantite: 1
    },
    {
        id: 10,
        nom: "Bibliothèque Murale",
        categorie: "Bibliothèque",
        prix: 160000,
        image: "images/bibliotheque-murale.jpg",
        description: "Bibliothèque murale avec étagères réglables en hauteur. Design moderne et épuré pour organiser vos livres et objets décoratifs.",
        disponible: 1,
        publie: 1,
        dimensions: "240 x 180 x 35 cm",
        materiau: "Bois massif de samba",
        couleur: "Chêne clair",
        sur_mesure: 1,
        quantite: 5
    }
];

const insertProduit = db.prepare(`
    INSERT INTO produits (
        id, nom, categorie_id, prix, description, disponible, publie,
        dimensions, materiau, couleur, sur_mesure, quantite
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        nom = excluded.nom,
        categorie_id = excluded.categorie_id,
        prix = excluded.prix,
        description = excluded.description,
        disponible = excluded.disponible,
        publie = excluded.publie,
        dimensions = excluded.dimensions,
        materiau = excluded.materiau,
        couleur = excluded.couleur,
        sur_mesure = excluded.sur_mesure,
        quantite = excluded.quantite
`);

const insertImage = db.prepare(`
    INSERT INTO images_produit (produit_id, chemin, principale)
    VALUES (?, ?, 1)
`);

produitsInitiaux.forEach(p => {
    const catId = categoriesMap[p.categorie] || null;
    insertProduit.run(
        p.id,
        p.nom,
        catId,
        p.prix,
        p.description,
        p.disponible,
        p.publie,
        p.dimensions,
        p.materiau,
        p.couleur,
        p.sur_mesure,
        p.quantite
    );

    // Vérifier si l'image existe déjà
    const imgExiste = db.prepare('SELECT id FROM images_produit WHERE produit_id = ? AND chemin = ?').get(p.id, p.image);
    if (!imgExiste) {
        insertImage.run(p.id, p.image);
    }
});
console.log(`✅ ${produitsInitiaux.length} produits et leurs images initialisés.`);

// 4. Paramètres du site
const parametresInitiaux = [
    { cle: 'whatsapp_number', valeur: config.whatsappNumber || '+225 07 00 00 00 00' },
    { cle: 'telephone', valeur: '+225 07 00 00 00 00' },
    { cle: 'email', valeur: 'contact@icomo-menuiserie.ci' },
    { cle: 'adresse', valeur: 'Abidjan, Côte d\'Ivoire' },
    { cle: 'horaires', valeur: 'Lundi - Samedi : 08h00 - 18h00' },
    { cle: 'nom_entreprise', valeur: 'I.CO.MO — Menuiserie Moderne & Ebénisterie' }
];

const insertParam = db.prepare(`
    INSERT INTO parametres (cle, valeur)
    VALUES (?, ?)
    ON CONFLICT(cle) DO NOTHING
`);

parametresInitiaux.forEach(param => {
    insertParam.run(param.cle, param.valeur);
});
console.log(`✅ Paramètres du site enregistrés.`);

console.log('🎉 Seed terminé avec succès ! Base de données prête.');
