/*
 * ==============================================
 * I.CO.MO — MODULE ADMINISTRATION
 * ==============================================
 *
 * ATTENTION : SIMULATION FRONTEND
 * L'authentification ci-dessous est uniquement
 * une simulation pour la démonstration.
 * Elle ne constitue PAS une sécurité réelle.
 *
 * Pour une version production :
 * - Utiliser un système d'authentification backend (JWT, sessions)
 * - Hacher les mots de passe (bcrypt)
 * - Utiliser HTTPS
 * - Implémenter une API REST sécurisée
 */

// ============================================
// AUTHENTIFICATION (SIMULATION FRONTEND UNIQUEMENT)
// ============================================
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

/**
 * Vérifie si l'admin est connecté
 * @returns {boolean}
 */
function isAdminConnecte() {
    return sessionStorage.getItem('icomo_admin_logged') === 'true';
}

/**
 * Tente la connexion admin
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
function connexionAdmin(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('icomo_admin_logged', 'true');
        return true;
    }
    return false;
}

/**
 * Déconnexion admin
 */
function deconnexionAdmin() {
    sessionStorage.removeItem('icomo_admin_logged');
    afficherLoginAdmin();
}

// ============================================
// INITIALISATION DE LA PAGE ADMIN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si on est sur la page admin
    if (!document.getElementById('admin-page')) return;
    
    initProduits();
    initThemeAdmin();
    
    if (isAdminConnecte()) {
        afficherDashboard();
    } else {
        afficherLoginAdmin();
    }
});

/**
 * Initialise le thème sur la page admin
 */
function initThemeAdmin() {
    const savedTheme = localStorage.getItem('icomo_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ============================================
// AFFICHAGE LOGIN
// ============================================

/**
 * Affiche le formulaire de connexion
 */
function afficherLoginAdmin() {
    const loginSection = document.getElementById('admin-login');
    const layoutSection = document.getElementById('admin-layout');
    
    if (loginSection) loginSection.style.display = 'flex';
    if (layoutSection) layoutSection.classList.remove('visible');
}

/**
 * Gère la soumission du formulaire de connexion
 * @param {Event} e
 */
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    const errorEl = document.getElementById('login-error');
    
    if (connexionAdmin(username, password)) {
        afficherDashboard();
    } else {
        if (errorEl) {
            errorEl.textContent = 'Identifiants incorrects. Veuillez réessayer.';
            errorEl.classList.add('visible');
        }
        // Secouer le formulaire
        const card = document.querySelector('.admin-login__card');
        if (card) {
            card.style.animation = 'none';
            card.offsetHeight; // Force reflow
            card.style.animation = 'shake 0.5s ease';
        }
    }
}

// ============================================
// DASHBOARD
// ============================================

let sectionActive = 'dashboard';
let editingProductId = null;

/**
 * Affiche le dashboard admin
 */
function afficherDashboard() {
    const loginSection = document.getElementById('admin-login');
    const layoutSection = document.getElementById('admin-layout');
    
    if (loginSection) loginSection.style.display = 'none';
    if (layoutSection) layoutSection.classList.add('visible');
    
    // Charger la section par défaut
    naviguerVers('dashboard');
}

/**
 * Navigation entre les sections admin
 * @param {string} section - Nom de la section
 */
function naviguerVers(section) {
    sectionActive = section;
    
    // Masquer toutes les sections
    document.querySelectorAll('.admin-section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Afficher la section active
    const activeSection = document.getElementById(`section-${section}`);
    if (activeSection) activeSection.classList.add('active');
    
    // Mettre à jour la navigation
    document.querySelectorAll('.admin-sidebar__link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === section);
    });
    
    // Charger le contenu
    switch(section) {
        case 'dashboard':
            chargerStatistiques();
            break;
        case 'produits':
            chargerListeProduits();
            break;
        case 'ajouter':
            resetFormulaireProduit();
            break;
        case 'commandes':
            chargerCommandes();
            break;
        case 'parametres':
            chargerParametres();
            break;
    }
    
    // Fermer la sidebar mobile
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
    }
}

// ============================================
// STATISTIQUES
// ============================================

/**
 * Charge et affiche les statistiques
 */
function chargerStatistiques() {
    const stats = getStatistiques();
    const commandes = getCommandesLocales();
    
    const container = document.getElementById('stats-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--products">📦</div>
            <div class="stat-card__value">${stats.total}</div>
            <div class="stat-card__label">Total produits</div>
        </div>
        <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--available">✓</div>
            <div class="stat-card__value">${stats.disponibles}</div>
            <div class="stat-card__label">Disponibles</div>
        </div>
        <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--unavailable">✕</div>
            <div class="stat-card__value">${stats.indisponibles}</div>
            <div class="stat-card__label">Indisponibles</div>
        </div>
        <div class="stat-card">
            <div class="stat-card__icon stat-card__icon--orders">📋</div>
            <div class="stat-card__value">${commandes.length}</div>
            <div class="stat-card__label">Commandes locales</div>
        </div>
    `;
    
    // Charger les derniers produits
    chargerDerniersProduits();
}

/**
 * Affiche les derniers produits ajoutés
 */
function chargerDerniersProduits() {
    const container = document.getElementById('recent-products');
    if (!container) return;
    
    const produits = getProduits().slice(-5).reverse();
    
    if (produits.length === 0) {
        container.innerHTML = '<p style="padding: 2rem; color: var(--text-muted); text-align:center;">Aucun produit</p>';
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    produits.forEach(p => {
        const imageSrc = p.image || '';
        html += `
            <tr>
                <td>
                    <div class="admin-table__product">
                        ${imageSrc 
                            ? `<img src="${imageSrc}" alt="${p.nom}" class="admin-table__product-image">` 
                            : `<div class="admin-table__product-image image-placeholder" style="font-size:1.2rem;">🪵</div>`
                        }
                        <span class="admin-table__product-name">${p.nom}</span>
                    </div>
                </td>
                <td>${p.categorie}</td>
                <td>${formaterPrix(p.prix)}</td>
                <td>
                    <span class="admin-table__badge admin-table__badge--${p.disponible ? 'available' : 'unavailable'}">
                        ${p.disponible ? 'Disponible' : 'Indisponible'}
                    </span>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================
// LISTE DES PRODUITS (ADMIN)
// ============================================

/**
 * Charge la liste complète des produits
 */
function chargerListeProduits() {
    const container = document.getElementById('products-list');
    if (!container) return;
    
    const produits = getProduits();
    
    if (produits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">📦</div>
                <h3 class="empty-state__title">Aucun produit</h3>
                <p class="empty-state__text">Commencez par ajouter votre premier produit.</p>
                <button class="btn btn--primary" onclick="naviguerVers('ajouter')">+ Ajouter un produit</button>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    produits.forEach(p => {
        const imageSrc = p.image || '';
        html += `
            <tr>
                <td>
                    <div class="admin-table__product">
                        ${imageSrc 
                            ? `<img src="${imageSrc}" alt="${p.nom}" class="admin-table__product-image">` 
                            : `<div class="admin-table__product-image image-placeholder" style="font-size:1.2rem;">🪵</div>`
                        }
                        <span class="admin-table__product-name">${p.nom}</span>
                    </div>
                </td>
                <td>${p.categorie}</td>
                <td>${formaterPrix(p.prix)}</td>
                <td>
                    <span class="admin-table__badge admin-table__badge--${p.disponible ? 'available' : 'unavailable'}">
                        ${p.disponible ? 'Disponible' : 'Indisponible'}
                    </span>
                </td>
                <td>
                    <div class="admin-table__actions">
                        <button class="btn btn--sm btn--ghost" onclick="modifierProduitAdmin(${p.id})" title="Modifier">✏️</button>
                        <button class="btn btn--sm btn--ghost" onclick="toggleDisponibilite(${p.id})" title="Changer disponibilité">
                            ${p.disponible ? '🔴' : '🟢'}
                        </button>
                        <button class="btn btn--sm btn--ghost" onclick="confirmerSuppressionProduit(${p.id})" title="Supprimer" style="color:var(--color-error);">🗑</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================
// AJOUTER / MODIFIER UN PRODUIT
// ============================================

/**
 * Réinitialise le formulaire de produit
 */
function resetFormulaireProduit() {
    editingProductId = null;
    
    const title = document.getElementById('form-title');
    if (title) title.textContent = 'Ajouter un produit';
    
    const form = document.getElementById('product-form');
    if (form) form.reset();
    
    const preview = document.getElementById('image-preview');
    if (preview) preview.innerHTML = '';
    
    const submitBtn = document.getElementById('form-submit-btn');
    if (submitBtn) submitBtn.textContent = '+ Ajouter le produit';
}

/**
 * Charge les données d'un produit dans le formulaire pour modification
 * @param {number} id - ID du produit
 */
function modifierProduitAdmin(id) {
    const produit = getProduitById(id);
    if (!produit) return;
    
    editingProductId = id;
    naviguerVers('ajouter');
    
    const title = document.getElementById('form-title');
    if (title) title.textContent = 'Modifier le produit';
    
    const submitBtn = document.getElementById('form-submit-btn');
    if (submitBtn) submitBtn.textContent = '✓ Enregistrer les modifications';
    
    // Remplir le formulaire
    document.getElementById('product-nom').value = produit.nom || '';
    document.getElementById('product-categorie').value = produit.categorie || '';
    document.getElementById('product-prix').value = produit.prix || '';
    document.getElementById('product-description').value = produit.description || '';
    document.getElementById('product-dimensions').value = produit.dimensions || '';
    document.getElementById('product-materiau').value = produit.materiau || '';
    document.getElementById('product-couleur').value = produit.couleur || '';
    document.getElementById('product-disponible').checked = produit.disponible;
    
    // Aperçu image
    const preview = document.getElementById('image-preview');
    if (preview && produit.image) {
        preview.innerHTML = `<img src="${produit.image}" alt="Aperçu" style="max-width:200px; border-radius:8px;">`;
    }
}

/**
 * Gère la soumission du formulaire produit
 * @param {Event} e
 */
function handleProductForm(e) {
    e.preventDefault();
    
    const nom = document.getElementById('product-nom').value.trim();
    const categorie = document.getElementById('product-categorie').value;
    const prix = parseInt(document.getElementById('product-prix').value);
    const description = document.getElementById('product-description').value.trim();
    const dimensions = document.getElementById('product-dimensions').value.trim();
    const materiau = document.getElementById('product-materiau').value.trim();
    const couleur = document.getElementById('product-couleur').value.trim();
    const disponible = document.getElementById('product-disponible').checked;
    
    // Validation de base
    if (!nom || !categorie || !prix) {
        afficherNotification('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }
    
    // Récupérer l'image (si une nouvelle a été sélectionnée)
    const imageInput = document.getElementById('product-image');
    const existingProduct = editingProductId ? getProduitById(editingProductId) : null;
    let imageData = existingProduct ? existingProduct.image : '';
    
    // Vérifier si une nouvelle image a été chargée via FileReader
    const previewImg = document.querySelector('#image-preview img');
    if (previewImg && previewImg.src.startsWith('data:')) {
        imageData = previewImg.src;
    }
    
    const produitData = {
        nom,
        categorie,
        prix,
        description,
        image: imageData,
        dimensions,
        materiau,
        couleur,
        disponible
    };
    
    if (editingProductId) {
        // Modifier
        modifierProduit(editingProductId, produitData);
        afficherNotification('✓ Produit modifié avec succès', 'success');
    } else {
        // Ajouter
        ajouterProduit(produitData);
        afficherNotification('✓ Produit ajouté avec succès', 'success');
    }
    
    // Retour à la liste
    setTimeout(() => {
        naviguerVers('produits');
    }, 800);
}

/**
 * Gère l'aperçu de l'image sélectionnée
 * @param {Event} e
 */
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
        afficherNotification('Veuillez sélectionner une image valide.', 'error');
        return;
    }
    
    /*
     * Note : L'utilisation de FileReader pour stocker des images en base64
     * dans localStorage est uniquement adaptée à une démonstration.
     * Pour une version production, utiliser un serveur de stockage
     * (AWS S3, Cloudinary, Firebase Storage, etc.)
     */
    const reader = new FileReader();
    reader.onload = function(event) {
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.innerHTML = `<img src="${event.target.result}" alt="Aperçu" style="max-width:200px; border-radius:8px;">`;
        }
    };
    reader.readAsDataURL(file);
}

// ============================================
// SUPPRIMER UN PRODUIT
// ============================================

/**
 * Affiche la confirmation de suppression
 * @param {number} id - ID du produit
 */
function confirmerSuppressionProduit(id) {
    const produit = getProduitById(id);
    if (!produit) return;
    
    afficherConfirmation(
        'Supprimer ce produit ?',
        `Êtes-vous sûr de vouloir supprimer "${produit.nom}" ? Cette action est irréversible.`,
        function() {
            supprimerProduit(id);
            afficherNotification('✓ Produit supprimé', 'success');
            chargerListeProduits();
            chargerStatistiques();
        },
        'Supprimer'
    );
}

// ============================================
// TOGGLE DISPONIBILITÉ
// ============================================

/**
 * Change la disponibilité d'un produit
 * @param {number} id - ID du produit
 */
function toggleDisponibilite(id) {
    const produit = getProduitById(id);
    if (!produit) return;
    
    modifierProduit(id, { disponible: !produit.disponible });
    
    const status = !produit.disponible ? 'disponible' : 'indisponible';
    afficherNotification(`✓ Produit marqué comme ${status}`, 'success');
    
    chargerListeProduits();
}

// ============================================
// COMMANDES
// ============================================

/**
 * Charge et affiche les commandes locales
 */
function chargerCommandes() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    const commandes = getCommandesLocales();
    
    if (commandes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">📋</div>
                <h3 class="empty-state__title">Aucune commande</h3>
                <p class="empty-state__text">Les commandes passées via WhatsApp apparaîtront ici.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>Articles</th>
                    <th>Total</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    commandes.reverse().forEach(c => {
        const date = new Date(c.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <tr>
                <td>#${c.id}</td>
                <td>${c.client.nom}</td>
                <td>${c.client.telephone}</td>
                <td>${c.articles.length} article(s)</td>
                <td><strong>${formaterPrix(c.total)}</strong></td>
                <td>${date}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============================================
// PARAMÈTRES
// ============================================

/**
 * Charge les paramètres
 */
function chargerParametres() {
    const settings = JSON.parse(localStorage.getItem('icomo_settings')) || {
        adresse: localisation.adresse,
        telephone: CONFIG.telephone,
        email: CONFIG.email,
        whatsapp: NUMERO_WHATSAPP,
        horaires: CONFIG.horaires,
        latitude: localisation.latitude,
        longitude: localisation.longitude
    };
    
    const adresseInput = document.getElementById('setting-adresse');
    const telInput = document.getElementById('setting-telephone');
    const emailInput = document.getElementById('setting-email');
    const whatsappInput = document.getElementById('setting-whatsapp');
    const horairesInput = document.getElementById('setting-horaires');
    
    if (adresseInput) adresseInput.value = settings.adresse || '';
    if (telInput) telInput.value = settings.telephone || '';
    if (emailInput) emailInput.value = settings.email || '';
    if (whatsappInput) whatsappInput.value = settings.whatsapp || '';
    if (horairesInput) horairesInput.value = settings.horaires || '';
}

/**
 * Sauvegarde les paramètres
 * @param {Event} e
 */
function sauvegarderParametres(e) {
    e.preventDefault();
    
    const settings = {
        adresse: document.getElementById('setting-adresse').value.trim(),
        telephone: document.getElementById('setting-telephone').value.trim(),
        email: document.getElementById('setting-email').value.trim(),
        whatsapp: document.getElementById('setting-whatsapp').value.trim(),
        horaires: document.getElementById('setting-horaires').value.trim()
    };
    
    localStorage.setItem('icomo_settings', JSON.stringify(settings));
    afficherNotification('✓ Paramètres enregistrés', 'success');
}

// ============================================
// SIDEBAR MOBILE
// ============================================

/**
 * Toggle la sidebar admin sur mobile
 */
function toggleAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// ============================================
// CSS ANIMATION : SHAKE (pour login error)
// ============================================
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);
