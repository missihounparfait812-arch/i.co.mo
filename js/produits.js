/*
 * ==============================================
 * I.CO.MO — MODULE PRODUITS
 * ==============================================
 *
 * VERSION FRONTEND
 * Les données sont stockées dans localStorage.
 *
 * Pour une version production :
 * remplacer localStorage par une véritable
 * base de données et une API backend sécurisée.
 */

// ============================================
// DONNÉES INITIALES DES PRODUITS
// ============================================
const produitsInitiaux = [
    {
        id: 1,
        nom: "Armoire Moderne",
        categorie: "Armoire",
        prix: 150000,
        image: "images/armoire-moderne.jpg",
        description: "Armoire moderne fabriquée sur mesure en bois massif de qualité supérieure. Design épuré avec des finitions soignées pour un rangement optimal et élégant.",
        disponible: true,
        dimensions: "200 x 120 x 60 cm",
        materiau: "Bois massif d'iroko",
        couleur: "Marron naturel"
    },
    {
        id: 2,
        nom: "Lit King Size Luxe",
        categorie: "Lit",
        prix: 250000,
        image: "images/lit-king-size.jpg",
        description: "Lit king size luxueux avec tête de lit sculptée. Structure robuste en bois massif avec des détails artisanaux qui apportent une touche d'élégance à votre chambre.",
        disponible: true,
        dimensions: "220 x 200 x 130 cm",
        materiau: "Bois massif de teck",
        couleur: "Marron foncé"
    },
    {
        id: 3,
        nom: "Table à Manger Familiale",
        categorie: "Table",
        prix: 180000,
        image: "images/table-manger.jpg",
        description: "Grande table à manger pour 8 personnes, idéale pour les repas en famille. Fabriquée en bois massif avec un plateau épais et des pieds sculptés.",
        disponible: true,
        dimensions: "200 x 100 x 76 cm",
        materiau: "Bois massif de fraké",
        couleur: "Beige naturel"
    },
    {
        id: 4,
        nom: "Chaise Design Confort",
        categorie: "Chaise",
        prix: 35000,
        image: "images/chaise-design.jpg",
        description: "Chaise design alliant confort et esthétique. Assise ergonomique avec dossier incurvé pour un confort optimal au quotidien.",
        disponible: true,
        dimensions: "90 x 45 x 50 cm",
        materiau: "Bois massif et tissu",
        couleur: "Beige et marron"
    },
    {
        id: 5,
        nom: "Dressing Complet",
        categorie: "Dressing",
        prix: 350000,
        image: "images/dressing-complet.jpg",
        description: "Dressing complet avec portes coulissantes, miroir intégré et éclairage LED. Organisation optimale avec étagères, tiroirs et penderies.",
        disponible: true,
        dimensions: "300 x 250 x 65 cm",
        materiau: "MDF plaqué et bois massif",
        couleur: "Blanc et chêne"
    },
    {
        id: 6,
        nom: "Meuble TV Contemporain",
        categorie: "Meuble TV",
        prix: 120000,
        image: "images/meuble-tv.jpg",
        description: "Meuble TV contemporain avec rangements intégrés et passage de câbles discret. Design moderne pour sublimer votre salon.",
        disponible: true,
        dimensions: "180 x 45 x 55 cm",
        materiau: "Bois massif et métal",
        couleur: "Noyer et noir"
    },
    {
        id: 7,
        nom: "Porte Principale Sculptée",
        categorie: "Porte",
        prix: 200000,
        image: "images/porte-sculptee.jpg",
        description: "Porte principale en bois massif avec sculptures artisanales. Imposante et sécurisée, elle donne un caractère unique à l'entrée de votre maison.",
        disponible: true,
        dimensions: "220 x 100 x 8 cm",
        materiau: "Bois massif d'acajou",
        couleur: "Acajou foncé"
    },
    {
        id: 8,
        nom: "Bureau Directorial",
        categorie: "Bureau",
        prix: 280000,
        image: "images/bureau-directorial.jpg",
        description: "Bureau directorial spacieux avec tiroirs verrouillables et plateau en cuir. Parfait pour un espace de travail professionnel et prestigieux.",
        disponible: true,
        dimensions: "180 x 90 x 76 cm",
        materiau: "Bois massif et cuir",
        couleur: "Marron foncé et noir"
    },
    {
        id: 9,
        nom: "Cuisine Équipée Premium",
        categorie: "Cuisine",
        prix: 500000,
        image: "images/cuisine-equipee.jpg",
        description: "Cuisine équipée complète sur mesure. Meubles hauts et bas, plan de travail en granit, finitions laquées et accessoires de rangement intégrés.",
        disponible: false,
        dimensions: "Sur mesure",
        materiau: "Bois massif et granit",
        couleur: "Blanc laqué et bois"
    },
    {
        id: 10,
        nom: "Bibliothèque Murale",
        categorie: "Bibliothèque",
        prix: 160000,
        image: "images/bibliotheque-murale.jpg",
        description: "Bibliothèque murale avec étagères réglables en hauteur. Design moderne et épuré pour organiser vos livres et objets décoratifs.",
        disponible: true,
        dimensions: "240 x 180 x 35 cm",
        materiau: "Bois massif de samba",
        couleur: "Chêne clair"
    }
];

// ============================================
// GESTION DES PRODUITS (localStorage)
// ============================================

/**
 * Initialise les produits dans localStorage si non existants
 */
function initProduits() {
    const stored = localStorage.getItem('icomo_produits');
    if (!stored) {
        localStorage.setItem('icomo_produits', JSON.stringify(produitsInitiaux));
    } else {
        try {
            const produits = JSON.parse(stored);
            let misAJour = false;
            produits.forEach(p => {
                if (!p.image) {
                    const original = produitsInitiaux.find(item => item.id === p.id);
                    if (original && original.image) {
                        p.image = original.image;
                        misAJour = true;
                    }
                }
            });
            if (misAJour) {
                localStorage.setItem('icomo_produits', JSON.stringify(produits));
            }
        } catch (e) {
            localStorage.setItem('icomo_produits', JSON.stringify(produitsInitiaux));
        }
    }

    // Déclencher la synchronisation en arrière-plan avec l'API
    if (typeof API !== 'undefined') {
        synchroniserProduitsAvecAPI();
    }
}

/**
 * Synchronise la liste des produits avec le backend SQLite
 */
async function synchroniserProduitsAvecAPI() {
    try {
        const res = await API.getProduits();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
            const produitsFormat = res.data.map(p => ({
                id: p.id,
                nom: p.nom,
                categorie: p.categorie_nom || p.categorie || 'Autre',
                prix: p.prix,
                image: p.image,
                images: p.images || [],
                description: p.description || '',
                disponible: Boolean(p.disponible),
                dimensions: p.dimensions || '',
                materiau: p.materiau || '',
                couleur: p.couleur || '',
                sur_mesure: Boolean(p.sur_mesure),
                quantite: p.quantite || 0
            }));
            localStorage.setItem('icomo_produits', JSON.stringify(produitsFormat));
        }
    } catch (e) {
        // Mode hors ligne : continue avec le cache
    }
}

/**
 * Récupère tous les produits depuis localStorage
 * @returns {Array} Liste des produits
 */
function getProduits() {
    initProduits();
    return JSON.parse(localStorage.getItem('icomo_produits')) || [];
}

/**
 * Récupère un produit par son ID
 * @param {number} id - ID du produit
 * @returns {Object|null} Le produit ou null
 */
function getProduitById(id) {
    const produits = getProduits();
    return produits.find(p => p.id === parseInt(id)) || null;
}

/**
 * Ajoute un nouveau produit
 * @param {Object} produit - Données du produit
 * @returns {Object} Le produit ajouté
 */
function ajouterProduit(produit) {
    const produits = getProduits();
    
    // Générer un ID unique
    const maxId = produits.length > 0 ? Math.max(...produits.map(p => p.id)) : 0;
    produit.id = maxId + 1;
    produit.dateAjout = new Date().toISOString();
    
    produits.push(produit);
    localStorage.setItem('icomo_produits', JSON.stringify(produits));
    
    return produit;
}

/**
 * Modifie un produit existant
 * @param {number} id - ID du produit à modifier
 * @param {Object} modifications - Données modifiées
 * @returns {Object|null} Le produit modifié ou null
 */
function modifierProduit(id, modifications) {
    const produits = getProduits();
    const index = produits.findIndex(p => p.id === parseInt(id));
    
    if (index === -1) return null;
    
    produits[index] = { ...produits[index], ...modifications };
    localStorage.setItem('icomo_produits', JSON.stringify(produits));
    
    return produits[index];
}

/**
 * Supprime un produit
 * @param {number} id - ID du produit à supprimer
 * @returns {boolean} true si supprimé
 */
function supprimerProduit(id) {
    const produits = getProduits();
    const index = produits.findIndex(p => p.id === parseInt(id));
    
    if (index === -1) return false;
    
    produits.splice(index, 1);
    localStorage.setItem('icomo_produits', JSON.stringify(produits));
    
    return true;
}

/**
 * Recherche des produits par texte
 * @param {string} query - Texte de recherche
 * @returns {Array} Produits correspondants
 */
function rechercherProduits(query) {
    const produits = getProduits();
    const q = query.toLowerCase().trim();
    
    if (!q) return produits;
    
    return produits.filter(p =>
        p.nom.toLowerCase().includes(q) ||
        p.categorie.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.materiau && p.materiau.toLowerCase().includes(q))
    );
}

/**
 * Filtre les produits par catégorie
 * @param {string} categorie - Catégorie à filtrer
 * @param {Array} [produits] - Liste de produits (ou tous si omis)
 * @returns {Array} Produits filtrés
 */
function filtrerParCategorie(categorie, produits) {
    const liste = produits || getProduits();
    
    if (!categorie || categorie === 'Toutes' || categorie === 'all') {
        return liste;
    }
    
    return liste.filter(p => p.categorie === categorie);
}

/**
 * Filtre les produits par prix
 * @param {number} prixMin - Prix minimum
 * @param {number} prixMax - Prix maximum
 * @param {Array} [produits] - Liste de produits
 * @returns {Array} Produits filtrés
 */
function filtrerParPrix(prixMin, prixMax, produits) {
    const liste = produits || getProduits();
    
    return liste.filter(p => {
        if (prixMin && p.prix < prixMin) return false;
        if (prixMax && p.prix > prixMax) return false;
        return true;
    });
}

/**
 * Obtient les catégories uniques
 * @returns {Array} Liste des catégories
 */
function getCategories() {
    const produits = getProduits();
    const categories = [...new Set(produits.map(p => p.categorie))];
    return categories.sort();
}

/**
 * Obtient les statistiques des produits
 * @returns {Object} Statistiques
 */
function getStatistiques() {
    const produits = getProduits();
    return {
        total: produits.length,
        disponibles: produits.filter(p => p.disponible).length,
        indisponibles: produits.filter(p => !p.disponible).length,
        categories: getCategories().length
    };
}

// ============================================
// FORMATAGE
// ============================================

/**
 * Formate un prix en FCFA
 * @param {number} prix - Le prix à formater
 * @returns {string} Prix formaté
 */
function formaterPrix(prix) {
    return new Intl.NumberFormat('fr-FR').format(prix) + ' FCFA';
}

// ============================================
// RENDU HTML DES PRODUITS
// ============================================

/**
 * Génère le HTML d'une carte produit
 * @param {Object} produit - Données du produit
 * @returns {string} HTML de la carte
 */
function genererCarteProduit(produit) {
    const disponibilite = produit.disponible 
        ? '<span class="product-card__badge product-card__badge--available">Disponible</span>'
        : '<span class="product-card__badge product-card__badge--unavailable">Indisponible</span>';
    
    const imageSrc = produit.image || '';
    const imageHTML = imageSrc 
        ? `<img src="${imageSrc}" alt="${produit.nom}" class="product-card__image" loading="lazy">`
        : `<div class="image-placeholder">🪵</div>`;

    return `
        <article class="product-card animate-on-scroll" data-id="${produit.id}">
            <div class="product-card__image-wrapper">
                ${imageHTML}
                ${disponibilite}
                <div class="product-card__overlay">
                    <a href="produit.html?id=${produit.id}" class="btn btn--sm btn--primary">👁 Voir</a>
                    ${produit.disponible ? `<button class="btn btn--sm btn--accent" onclick="ajouterAuPanier(${produit.id})">🛒 Ajouter</button>` : ''}
                </div>
            </div>
            <div class="product-card__body">
                <span class="product-card__category">${produit.categorie}</span>
                <h3 class="product-card__name">${produit.nom}</h3>
                <p class="product-card__description">${produit.description}</p>
                <div class="product-card__footer">
                    <div class="product-card__price">
                        ${formaterPrix(produit.prix)}
                    </div>
                    <div class="product-card__actions">
                        <a href="produit.html?id=${produit.id}" class="btn btn--sm btn--ghost" title="Voir le détail">👁</a>
                        ${produit.disponible ? `<button class="btn btn--sm btn--accent" onclick="ajouterAuPanier(${produit.id})" title="Ajouter au panier">🛒</button>` : ''}
                    </div>
                </div>
            </div>
        </article>
    `;
}

/**
 * Affiche les produits dans un conteneur
 * @param {string} containerId - ID du conteneur
 * @param {Array} [produits] - Produits à afficher (ou tous si omis)
 * @param {number} [limit] - Limite de produits à afficher
 */
function afficherProduits(containerId, produits, limit) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let liste = produits || getProduits();
    
    if (limit) {
        liste = liste.slice(0, limit);
    }
    
    if (liste.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state__icon">🔍</div>
                <h3 class="empty-state__title">Aucun produit trouvé</h3>
                <p class="empty-state__text">Essayez de modifier vos critères de recherche ou de filtre.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = liste.map(genererCarteProduit).join('');
    
    // Déclencher les animations d'apparition
    requestAnimationFrame(() => {
        const cards = container.querySelectorAll('.animate-on-scroll');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 80);
        });
    });
}

/**
 * Affiche le détail d'un produit
 * @param {string} containerId - ID du conteneur
 * @param {number} produitId - ID du produit
 */
function afficherDetailProduit(containerId, produitId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const produit = getProduitById(produitId);
    if (!produit) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">😕</div>
                <h3 class="empty-state__title">Produit introuvable</h3>
                <p class="empty-state__text">Ce produit n'existe plus ou l'URL est incorrecte.</p>
                <a href="produits.html" class="btn btn--primary">Voir tous les produits</a>
            </div>
        `;
        return;
    }
    
    const disponibiliteClass = produit.disponible ? 'available' : 'unavailable';
    const disponibiliteText = produit.disponible ? 'En stock' : 'Indisponible';
    
    const imageSrc = produit.image || '';
    const imageHTML = imageSrc 
        ? `<img src="${imageSrc}" alt="${produit.nom}">`
        : `<div class="image-placeholder" style="aspect-ratio:1;">🪵</div>`;
    
    container.innerHTML = `
        <div class="product-detail__grid">
            <div class="product-detail__gallery">
                <div class="product-detail__main-image">
                    ${imageHTML}
                </div>
            </div>
            <div class="product-detail__info">
                <span class="product-detail__category">${produit.categorie}</span>
                <h1 class="product-detail__name">${produit.nom}</h1>
                <div class="product-detail__price">${formaterPrix(produit.prix)}</div>
                
                <div class="product-detail__availability product-detail__availability--${disponibiliteClass}">
                    <span class="product-detail__availability-dot"></span>
                    ${disponibiliteText}
                </div>
                
                <p class="product-detail__description">${produit.description}</p>
                
                <div class="product-detail__specs">
                    ${produit.dimensions ? `
                    <div class="product-detail__spec">
                        <div class="product-detail__spec-label">Dimensions</div>
                        <div class="product-detail__spec-value">${produit.dimensions}</div>
                    </div>` : ''}
                    ${produit.materiau ? `
                    <div class="product-detail__spec">
                        <div class="product-detail__spec-label">Matériau</div>
                        <div class="product-detail__spec-value">${produit.materiau}</div>
                    </div>` : ''}
                    ${produit.couleur ? `
                    <div class="product-detail__spec">
                        <div class="product-detail__spec-label">Couleur</div>
                        <div class="product-detail__spec-value">${produit.couleur}</div>
                    </div>` : ''}
                    <div class="product-detail__spec">
                        <div class="product-detail__spec-label">Catégorie</div>
                        <div class="product-detail__spec-value">${produit.categorie}</div>
                    </div>
                </div>
                
                <div class="product-detail__buttons">
                    ${produit.disponible ? `
                    <button class="btn btn--primary btn--lg" onclick="ajouterAuPanier(${produit.id})">
                        🛒 Ajouter au panier
                    </button>` : `
                    <button class="btn btn--ghost btn--lg" disabled>
                        Indisponible
                    </button>`}
                    <button class="btn btn--whatsapp btn--lg" onclick="commanderProduitWhatsApp(${produit.id})">
                        💬 Commander sur WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Mise à jour du titre de la page
    document.title = `${produit.nom} — I.CO.MO`;
}

// ============================================
// GESTION DE LA PAGE PRODUITS
// ============================================

let filtreActuel = {
    recherche: '',
    categorie: 'all',
    prixMin: 0,
    prixMax: Infinity
};

/**
 * Applique les filtres et affiche les résultats
 */
function appliquerFiltres() {
    let produits = getProduits();
    
    // Recherche
    if (filtreActuel.recherche) {
        produits = rechercherProduits(filtreActuel.recherche);
    }
    
    // Catégorie
    if (filtreActuel.categorie && filtreActuel.categorie !== 'all') {
        produits = filtrerParCategorie(filtreActuel.categorie, produits);
    }
    
    // Prix
    produits = filtrerParPrix(filtreActuel.prixMin, filtreActuel.prixMax, produits);
    
    // Affichage
    afficherProduits('products-container', produits);
    
    // Mise à jour du compteur
    const counter = document.getElementById('products-count');
    if (counter) {
        counter.textContent = `${produits.length} produit${produits.length > 1 ? 's' : ''} trouvé${produits.length > 1 ? 's' : ''}`;
    }
}

/**
 * Initialise la page produits avec les filtres
 */
function initPageProduits() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const filterTags = document.querySelectorAll('.filter-tag');
    
    // Recherche en temps réel
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filtreActuel.recherche = e.target.value;
            appliquerFiltres();
        });
    }
    
    // Filtre par catégorie (select)
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function(e) {
            filtreActuel.categorie = e.target.value;
            // Mettre à jour les tags
            filterTags.forEach(tag => {
                tag.classList.toggle('active', tag.dataset.category === e.target.value);
            });
            appliquerFiltres();
        });
    }
    
    // Filtre par prix
    if (priceFilter) {
        priceFilter.addEventListener('change', function(e) {
            const val = e.target.value;
            switch(val) {
                case 'all':
                    filtreActuel.prixMin = 0;
                    filtreActuel.prixMax = Infinity;
                    break;
                case '0-50000':
                    filtreActuel.prixMin = 0;
                    filtreActuel.prixMax = 50000;
                    break;
                case '50000-150000':
                    filtreActuel.prixMin = 50000;
                    filtreActuel.prixMax = 150000;
                    break;
                case '150000-300000':
                    filtreActuel.prixMin = 150000;
                    filtreActuel.prixMax = 300000;
                    break;
                case '300000+':
                    filtreActuel.prixMin = 300000;
                    filtreActuel.prixMax = Infinity;
                    break;
            }
            appliquerFiltres();
        });
    }
    
    // Tags de filtre
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            filterTags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filtreActuel.categorie = this.dataset.category;
            if (categoryFilter) {
                categoryFilter.value = this.dataset.category;
            }
            appliquerFiltres();
        });
    });
    
    // Affichage initial
    appliquerFiltres();
}

// ============================================
// COMMANDE WHATSAPP POUR UN PRODUIT
// ============================================

/**
 * Commander un produit unique via WhatsApp
 * @param {number} produitId - ID du produit
 */
function commanderProduitWhatsApp(produitId) {
    const produit = getProduitById(produitId);
    if (!produit) return;
    
    const message = `Bonjour I.CO.MO,\n\nJe suis intéressé(e) par le produit suivant :\n\n` +
        `📦 Produit : ${produit.nom}\n` +
        `💰 Prix : ${formaterPrix(produit.prix)}\n` +
        `📏 Dimensions : ${produit.dimensions || 'Non spécifié'}\n\n` +
        `Pouvez-vous me donner plus d'informations ?\n\nMerci.`;
    
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
}
