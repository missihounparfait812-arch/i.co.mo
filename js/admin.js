/*
 * ==============================================
 * I.CO.MO — MODULE ADMINISTRATION (PRODUCTION)
 * ==============================================
 * Connecté au backend Node.js / Express / SQLite
 * Sécurisé par JWT & bcrypt.
 */

// ============================================
// AUTHENTIFICATION SÉCURISÉE VIA API
// ============================================

/**
 * Vérifie si l'administrateur est authentifié
 */
function isAdminConnecte() {
    return typeof API !== 'undefined' && API.isAuthenticated();
}

/**
 * Tente la connexion sécurisée
 */
async function connexionAdmin(username, password) {
    try {
        const res = await API.login(username, password);
        return res.success;
    } catch (err) {
        throw err;
    }
}

/**
 * Déconnexion de l'administrateur
 */
async function deconnexionAdmin() {
    try {
        if (typeof API !== 'undefined') {
            await API.logout();
        }
    } catch (e) {
        // Ignorer
    }
    afficherLoginAdmin();
    afficherNotification('Déconnexion réussie.', 'info');
}

// ============================================
// INITIALISATION DE LA PAGE ADMIN
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    if (!document.getElementById('admin-page')) return;

    initThemeAdmin();

    // Vérifier la session auprès du backend
    if (typeof API !== 'undefined' && API.isAuthenticated()) {
        try {
            const check = await API.checkAuth();
            if (check.authenticated) {
                afficherDashboard();
                return;
            }
        } catch (e) {
            console.warn('Session non valide');
        }
    }

    afficherLoginAdmin();
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

function afficherLoginAdmin() {
    const loginSection = document.getElementById('admin-login');
    const layoutSection = document.getElementById('admin-layout');

    if (loginSection) loginSection.style.display = 'flex';
    if (layoutSection) layoutSection.classList.remove('visible');
}

/**
 * Gère la soumission du formulaire de connexion
 */
async function handleLogin(e) {
    e.preventDefault();

    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');
    const errorEl = document.getElementById('login-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
    }

    const btnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connexion en cours...';
    }

    try {
        await connexionAdmin(username, password);
        afficherDashboard();
        afficherNotification('✓ Connexion réussie', 'success');
    } catch (err) {
        if (errorEl) {
            errorEl.textContent = err.message || 'Identifiants incorrects. Veuillez réessayer.';
            errorEl.classList.add('visible');
        }
        const card = document.querySelector('.admin-login__card');
        if (card) {
            card.style.animation = 'none';
            card.offsetHeight; // Force reflow
            card.style.animation = 'shake 0.5s ease';
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = btnText;
        }
    }
}

// ============================================
// DASHBOARD & NAVIGATION
// ============================================

let sectionActive = 'dashboard';
let editingProductId = null;
let categoriesCache = [];
let produitsCache = [];

function afficherDashboard() {
    const loginSection = document.getElementById('admin-login');
    const layoutSection = document.getElementById('admin-layout');

    if (loginSection) loginSection.style.display = 'none';
    if (layoutSection) layoutSection.classList.add('visible');

    // Charger les catégories en cache pour les formulaires
    chargerCategoriesPourFormulaire();

    // Naviguer vers la section par défaut
    naviguerVers('dashboard');
}

async function naviguerVers(section) {
    sectionActive = section;

    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    const activeSection = document.getElementById(`section-${section}`);
    if (activeSection) activeSection.classList.add('active');

    document.querySelectorAll('.admin-sidebar__link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === section);
    });

    switch (section) {
        case 'dashboard':
            await chargerStatistiques();
            break;
        case 'produits':
            await chargerListeProduits();
            break;
        case 'ajouter':
            resetFormulaireProduit();
            break;
        case 'commandes':
            await chargerCommandes();
            break;
        case 'parametres':
            await chargerParametres();
            break;
    }

    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
    }
}

// ============================================
// CATÉGORIES POUR LE SELECT
// ============================================

async function chargerCategoriesPourFormulaire() {
    try {
        const res = await API.getCategories();
        if (res.success && res.data) {
            categoriesCache = res.data;
            remplirSelectCategories();
        }
    } catch (e) {
        console.warn('Impossible de charger les catégories :', e.message);
    }
}

function remplirSelectCategories() {
    const select = document.getElementById('product-categorie');
    if (!select) return;

    const valeurActuelle = select.value;
    select.innerHTML = '<option value="">Sélectionnez une catégorie</option>';

    categoriesCache.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.nom;
        select.appendChild(opt);
    });

    if (valeurActuelle) {
        select.value = valeurActuelle;
    }
}

// ============================================
// STATISTIQUES & DERNIERS PRODUITS
// ============================================

async function chargerStatistiques() {
    const container = document.getElementById('stats-container');
    if (!container) return;

    container.innerHTML = '<div style="padding: 2rem; color: var(--text-muted); text-align: center; grid-column: 1/-1;">Chargement des statistiques...</div>';

    try {
        const res = await API.getStatistiques();
        if (!res.success) throw new Error(res.message);

        const data = res.data;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-card__icon stat-card__icon--products">📦</div>
                <div class="stat-card__value">${data.produits.total}</div>
                <div class="stat-card__label">Total produits (${data.produits.publies} publiés)</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__icon stat-card__icon--available">✓</div>
                <div class="stat-card__value">${data.produits.disponibles}</div>
                <div class="stat-card__label">Disponibles en atelier</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__icon stat-card__icon--orders">📋</div>
                <div class="stat-card__value">${data.commandes.total}</div>
                <div class="stat-card__label">Commandes (${data.commandes.en_attente} en attente)</div>
            </div>
            <div class="stat-card">
                <div class="stat-card__icon" style="background: rgba(245, 158, 11, 0.15); color: #d97706;">💰</div>
                <div class="stat-card__value" style="font-size: 1.4rem;">${formaterPrix(data.chiffre_affaires)}</div>
                <div class="stat-card__label">Chiffre d'affaires total</div>
            </div>
        `;

        await chargerDerniersProduits();
    } catch (err) {
        console.error('Erreur chargement statistiques :', err);
        container.innerHTML = `<div style="padding: 2rem; color: var(--color-error); text-align: center; grid-column: 1/-1;">Erreur de chargement : ${err.message}</div>`;
    }
}

async function chargerDerniersProduits() {
    const container = document.getElementById('recent-products');
    if (!container) return;

    try {
        const res = await API.getProduitsAdmin();
        const produits = (res.data || []).slice(0, 5);

        if (produits.length === 0) {
            container.innerHTML = '<p style="padding: 2rem; color: var(--text-muted); text-align:center;">Aucun produit dans le catalogue.</p>';
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
                    <td>${p.categorie_nom || 'Non catégorisé'}</td>
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
    } catch (e) {
        container.innerHTML = '<p style="padding: 2rem; color: var(--color-error); text-align:center;">Erreur chargement récents</p>';
    }
}

// ============================================
// GESTION DU CATALOGUE (ADMIN)
// ============================================

async function chargerListeProduits() {
    const container = document.getElementById('products-list');
    if (!container) return;

    container.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted);">Chargement des produits...</div>';

    try {
        const res = await API.getProduitsAdmin();
        const produits = res.data || [];
        produitsCache = produits;

        if (produits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📦</div>
                    <h3 class="empty-state__title">Aucun produit</h3>
                    <p class="empty-state__text">Commencez par ajouter votre premier meuble.</p>
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
                        <th>Disponibilité</th>
                        <th>Publication</th>
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
                            <div>
                                <div class="admin-table__product-name">${p.nom}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${p.dimensions || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td>${p.categorie_nom || '-'}</td>
                    <td><strong>${formaterPrix(p.prix)}</strong></td>
                    <td>
                        <button class="btn btn--sm btn--ghost" onclick="toggleDisponibiliteAdmin(${p.id})" title="Cliquer pour changer">
                            <span class="admin-table__badge admin-table__badge--${p.disponible ? 'available' : 'unavailable'}">
                                ${p.disponible ? '✓ Disponible' : '✕ Indisponible'}
                            </span>
                        </button>
                    </td>
                    <td>
                        <button class="btn btn--sm btn--ghost" onclick="togglePublicationAdmin(${p.id})" title="Cliquer pour publier/dépublier">
                            <span class="admin-table__badge" style="background: ${p.publie ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)'}; color: ${p.publie ? '#065f46' : '#4b5563'};">
                                ${p.publie ? '🌐 En ligne' : '🔒 Brouillon'}
                            </span>
                        </button>
                    </td>
                    <td>
                        <div class="admin-table__actions">
                            <button class="btn btn--sm btn--ghost" onclick="modifierProduitAdmin(${p.id})" title="Modifier">✏️</button>
                            <button class="btn btn--sm btn--ghost" onclick="confirmerSuppressionProduit(${p.id})" title="Supprimer" style="color:var(--color-error);">🗑</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (err) {
        console.error('Erreur chargement produits admin :', err);
        container.innerHTML = `<div style="padding: 2rem; color: var(--color-error); text-align: center;">Erreur : ${err.message}</div>`;
    }
}

// ============================================
// FORMULAIRE PRODUIT (AJOUT / ÉDITION)
// ============================================

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

    remplirSelectCategories();
}

function modifierProduitAdmin(id) {
    const produit = produitsCache.find(p => p.id === id);
    if (!produit) {
        afficherNotification('Produit introuvable.', 'error');
        return;
    }

    editingProductId = id;
    naviguerVers('ajouter');

    const title = document.getElementById('form-title');
    if (title) title.textContent = `Modifier : ${produit.nom}`;

    const submitBtn = document.getElementById('form-submit-btn');
    if (submitBtn) submitBtn.textContent = '✓ Enregistrer les modifications';

    remplirSelectCategories();

    // Remplir les champs
    document.getElementById('product-nom').value = produit.nom || '';
    if (document.getElementById('product-categorie')) {
        document.getElementById('product-categorie').value = produit.categorie_id || '';
    }
    document.getElementById('product-prix').value = produit.prix || '';
    document.getElementById('product-description').value = produit.description || '';
    document.getElementById('product-dimensions').value = produit.dimensions || '';
    document.getElementById('product-materiau').value = produit.materiau || '';
    document.getElementById('product-couleur').value = produit.couleur || '';
    document.getElementById('product-disponible').checked = Boolean(produit.disponible);

    const preview = document.getElementById('image-preview');
    if (preview && produit.image) {
        preview.innerHTML = `
            <div style="margin-top: 10px;">
                <img src="${produit.image}" alt="Aperçu actuel" style="max-width: 220px; border-radius: 8px; border: 1px solid var(--border-light);">
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Image actuelle</div>
            </div>
        `;
    }
}

async function handleProductForm(e) {
    e.preventDefault();

    const nom = document.getElementById('product-nom').value.trim();
    const categorieId = document.getElementById('product-categorie').value;
    const prix = parseInt(document.getElementById('product-prix').value, 10);
    const description = document.getElementById('product-description').value.trim();
    const dimensions = document.getElementById('product-dimensions').value.trim();
    const materiau = document.getElementById('product-materiau').value.trim();
    const couleur = document.getElementById('product-couleur').value.trim();
    const disponible = document.getElementById('product-disponible').checked;
    const imageInput = document.getElementById('product-image');

    if (!nom || !prix) {
        afficherNotification('Nom et prix sont obligatoires.', 'error');
        return;
    }

    const submitBtn = document.getElementById('form-submit-btn');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enregistrement en cours...';
    }

    try {
        // Préparer un FormData pour supporter l'upload d'image vers le backend
        const formData = new FormData();
        formData.append('nom', nom);
        formData.append('prix', prix);
        if (categorieId) formData.append('categorie_id', categorieId);
        formData.append('description', description);
        formData.append('dimensions', dimensions);
        formData.append('materiau', materiau);
        formData.append('couleur', couleur);
        formData.append('disponible', disponible ? '1' : '0');
        formData.append('publie', '1');

        if (imageInput && imageInput.files && imageInput.files.length > 0) {
            for (let i = 0; i < imageInput.files.length; i++) {
                formData.append('images', imageInput.files[i]);
            }
        }

        if (editingProductId) {
            await API.updateProduit(editingProductId, formData);
            afficherNotification('✓ Produit modifié avec succès sur le serveur', 'success');
        } else {
            await API.createProduit(formData);
            afficherNotification('✓ Nouveau produit créé avec succès dans la base', 'success');
        }

        setTimeout(() => {
            naviguerVers('produits');
        }, 600);
    } catch (err) {
        console.error('Erreur sauvegarde produit :', err);
        afficherNotification(`Erreur : ${err.message}`, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        afficherNotification('Veuillez sélectionner un fichier image valide.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const preview = document.getElementById('image-preview');
        if (preview) {
            preview.innerHTML = `
                <div style="margin-top: 10px;">
                    <img src="${event.target.result}" alt="Nouvelle image" style="max-width: 220px; border-radius: 8px; border: 2px solid #10b981;">
                    <div style="font-size: 0.8rem; color: #065f46; margin-top: 4px;">Nouvelle image prête à téléverser</div>
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);
}

// ============================================
// ACTIONS PRODUITS : TOGGLE & SUPPRESSION
// ============================================

async function toggleDisponibiliteAdmin(id) {
    try {
        const res = await API.toggleDisponibilite(id);
        afficherNotification(res.message, 'success');
        await chargerListeProduits();
    } catch (err) {
        afficherNotification(`Erreur : ${err.message}`, 'error');
    }
}

async function togglePublicationAdmin(id) {
    try {
        const res = await API.togglePublication(id);
        afficherNotification(res.message, 'success');
        await chargerListeProduits();
    } catch (err) {
        afficherNotification(`Erreur : ${err.message}`, 'error');
    }
}

function confirmerSuppressionProduit(id) {
    const produit = produitsCache.find(p => p.id === id);
    const nom = produit ? produit.nom : 'ce produit';

    afficherConfirmation(
        'Supprimer ce produit ?',
        `Êtes-vous sûr de vouloir supprimer définitivement "${nom}" ? Les images associées seront également effacées.`,
        async function() {
            try {
                await API.deleteProduit(id);
                afficherNotification('✓ Produit supprimé de la base de données', 'success');
                await chargerListeProduits();
            } catch (err) {
                afficherNotification(`Erreur : ${err.message}`, 'error');
            }
        },
        'Supprimer'
    );
}

// ============================================
// GESTION DES COMMANDES (ADMIN)
// ============================================

async function chargerCommandes() {
    const container = document.getElementById('orders-list');
    if (!container) return;

    container.innerHTML = '<div style="padding: 3rem; text-align: center; color: var(--text-muted);">Chargement des commandes...</div>';

    try {
        const res = await API.getCommandes();
        const commandes = res.data || [];

        if (commandes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📋</div>
                    <h3 class="empty-state__title">Aucune commande</h3>
                    <p class="empty-state__text">Les commandes passées par les clients apparaîtront ici en temps réel.</p>
                </div>
            `;
            return;
        }

        const statutsLabels = {
            'en_attente': { label: 'En attente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
            'confirmee': { label: 'Confirmée', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
            'en_fabrication': { label: 'En fabrication', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
            'livree': { label: 'Livrée', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
            'annulee': { label: 'Annulée', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
        };

        let html = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Réf.</th>
                        <th>Client</th>
                        <th>Contact</th>
                        <th>Articles</th>
                        <th>Total</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        commandes.forEach(c => {
            const dateStr = new Date(c.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const articlesSummary = (c.articles || []).map(a => `${a.quantite}x ${a.nom_produit}`).join(', ') || '-';
            const statutInfo = statutsLabels[c.statut] || { label: c.statut, color: '#6b7280', bg: '#f3f4f6' };

            html += `
                <tr>
                    <td><strong>${c.reference}</strong></td>
                    <td>
                        <div>${c.client_nom}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${c.client_commune || ''}</div>
                    </td>
                    <td>
                        <a href="tel:${c.client_telephone}" style="color: inherit; text-decoration: none;">📞 ${c.client_telephone}</a>
                    </td>
                    <td style="max-width: 250px; font-size: 0.85rem;">${articlesSummary}</td>
                    <td><strong>${formaterPrix(c.total)}</strong></td>
                    <td>
                        <select onchange="changerStatutCommande(${c.id}, this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-light); background: ${statutInfo.bg}; color: ${statutInfo.color}; font-weight: 600; cursor: pointer;">
                            <option value="en_attente" ${c.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
                            <option value="confirmee" ${c.statut === 'confirmee' ? 'selected' : ''}>Confirmée</option>
                            <option value="en_fabrication" ${c.statut === 'en_fabrication' ? 'selected' : ''}>En fabrication</option>
                            <option value="livree" ${c.statut === 'livree' ? 'selected' : ''}>Livrée</option>
                            <option value="annulee" ${c.statut === 'annulee' ? 'selected' : ''}>Annulée</option>
                        </select>
                    </td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
                    <td>
                        <button class="btn btn--sm btn--ghost" onclick="confirmerSuppressionCommande(${c.id})" title="Supprimer" style="color: var(--color-error);">🗑</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (err) {
        console.error('Erreur chargement commandes :', err);
        container.innerHTML = `<div style="padding: 2rem; color: var(--color-error); text-align: center;">Erreur : ${err.message}</div>`;
    }
}

async function changerStatutCommande(id, nouveauStatut) {
    try {
        await API.updateStatutCommande(id, nouveauStatut);
        afficherNotification('✓ Statut de la commande mis à jour', 'success');
    } catch (err) {
        afficherNotification(`Erreur : ${err.message}`, 'error');
        await chargerCommandes();
    }
}

function confirmerSuppressionCommande(id) {
    afficherConfirmation(
        'Supprimer la commande ?',
        'Cette commande sera définitivement effacée de la base de données.',
        async function() {
            try {
                await API.deleteCommande(id);
                afficherNotification('✓ Commande supprimée', 'success');
                await chargerCommandes();
            } catch (err) {
                afficherNotification(`Erreur : ${err.message}`, 'error');
            }
        },
        'Supprimer'
    );
}

// ============================================
// PARAMÈTRES DU SITE
// ============================================

async function chargerParametres() {
    try {
        const res = await API.getParametresAdmin();
        const p = res.data || {};

        if (document.getElementById('setting-adresse')) document.getElementById('setting-adresse').value = p.adresse || '';
        if (document.getElementById('setting-telephone')) document.getElementById('setting-telephone').value = p.telephone || '';
        if (document.getElementById('setting-email')) document.getElementById('setting-email').value = p.email || '';
        if (document.getElementById('setting-whatsapp')) document.getElementById('setting-whatsapp').value = p.whatsapp_number || '';
        if (document.getElementById('setting-horaires')) document.getElementById('setting-horaires').value = p.horaires || '';
    } catch (err) {
        console.warn('Erreur chargement paramètres :', err.message);
    }
}

async function sauvegarderParametres(e) {
    e.preventDefault();

    const adresse = document.getElementById('setting-adresse').value.trim();
    const telephone = document.getElementById('setting-telephone').value.trim();
    const email = document.getElementById('setting-email').value.trim();
    const whatsapp = document.getElementById('setting-whatsapp').value.trim();
    const horaires = document.getElementById('setting-horaires').value.trim();

    try {
        await API.updateParametres({
            adresse,
            telephone,
            email,
            whatsapp_number: whatsapp,
            horaires
        });

        afficherNotification('✓ Paramètres enregistrés avec succès dans la base', 'success');
    } catch (err) {
        afficherNotification(`Erreur : ${err.message}`, 'error');
    }
}

// ============================================
// CONFIRMATION MODALE & UTILITAIRES
// ============================================

function afficherConfirmation(titre, message, onConfirm, confirmText = 'Confirmer') {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    overlay.innerHTML = `
        <div class="confirm-modal">
            <h3 class="confirm-modal__title">${titre}</h3>
            <p class="confirm-modal__message">${message}</p>
            <div class="confirm-modal__actions">
                <button class="btn btn--ghost" id="confirm-cancel">Annuler</button>
                <button class="btn btn--danger" id="confirm-ok">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
        overlay.remove();
    });

    overlay.querySelector('#confirm-ok').addEventListener('click', () => {
        overlay.remove();
        if (typeof onConfirm === 'function') onConfirm();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function toggleAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}
