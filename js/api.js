/*
 * ==============================================
 * I.CO.MO — CLIENT D'API (FRONTEND)
 * ==============================================
 * Centralise tous les appels HTTP vers le backend.
 * Gère automatiquement le token d'authentification JWT
 * et fournit un mécanisme de secours si le backend est hors ligne.
 */

const API = (function() {
    // Détection dynamique de l'URL du backend Express :
    // Si la page est servie par un serveur statique de dev (VS Code Live Server :5500, Vite :5173, etc.)
    // ou file://, on redirige automatiquement vers le serveur Node.js sur le port 3000.
    function detecterBaseUrl() {
        if (typeof window !== 'undefined' && window.location) {
            // Si on navigue directement sur l'application Express (port 3000)
            if (window.location.port === '3000') {
                return `${window.location.origin}/api`;
            }
            // En environnement local avec serveur de dev (ex: Live Server 127.0.0.1:5500)
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname) {
                return 'http://localhost:3000/api';
            }
            return `${window.location.origin}/api`;
        }
        return 'http://localhost:3000/api';
    }

    let BASE_URL = detecterBaseUrl();

    const TOKEN_KEY = 'icomo_token';
    const USER_KEY = 'icomo_user';

    // ============================================
    // GESTION DU TOKEN
    // ============================================

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    function getUser() {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
    }

    function setUser(user) {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_KEY);
        }
    }

    function isAuthenticated() {
        return Boolean(getToken());
    }

    // ============================================
    // HELPER FETCH AVEC AUTO-REPLI ANTI-405
    // ============================================

    async function requete(endpoint, options = {}, dejaRetente = false) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = options.headers || {};

        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Si le corps est du FormData, ne pas forcer Content-Type
        const isFormData = options.body instanceof FormData;
        if (!isFormData && options.body && typeof options.body === 'object') {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        const config = {
            ...options,
            headers,
            credentials: 'include'
        };

        try {
            let reponse;
            try {
                reponse = await fetch(url, config);
            } catch (networkErr) {
                // Si l'appel a échoué (ex: CORS ou offline sur le port actuel), tenter localhost:3000
                if (!dejaRetente && BASE_URL !== 'http://localhost:3000/api') {
                    console.info('[API] Échec réseau, tentative sur http://localhost:3000/api...');
                    BASE_URL = 'http://localhost:3000/api';
                    return requete(endpoint, options, true);
                }
                throw networkErr;
            }

            // Si un serveur statique (ex: Live Server) renvoie 405 Method Not Allowed ou 404,
            // basculer immédiatement vers le backend Express sur http://localhost:3000/api
            if ((reponse.status === 405 || reponse.status === 404) && !dejaRetente && BASE_URL !== 'http://localhost:3000/api') {
                console.info('[API] Réponse HTTP 405/404 du serveur statique. Basculement sur http://localhost:3000/api...');
                BASE_URL = 'http://localhost:3000/api';
                return requete(endpoint, options, true);
            }

            const data = await reponse.json().catch(() => ({}));

            if (!reponse.ok) {
                if (reponse.status === 401 && endpoint.startsWith('/admin')) {
                    setToken(null);
                    setUser(null);
                }
                const error = new Error(data.message || `Erreur HTTP ${reponse.status}`);
                error.status = reponse.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (err) {
            console.warn(`[API] Erreur sur ${endpoint} :`, err.message);
            throw err;
        }
    }

    // ============================================
    // AUTHENTIFICATION
    // ============================================

    async function login(username, password) {
        const data = await requete('/auth/login', {
            method: 'POST',
            body: { username, password }
        });

        if (data.success && data.token) {
            setToken(data.token);
            setUser(data.admin);
        }

        return data;
    }

    async function logout() {
        try {
            await requete('/auth/logout', { method: 'POST' });
        } catch (e) {
            // Ignorer si échec réseau
        } finally {
            setToken(null);
            setUser(null);
        }
        return { success: true };
    }

    async function checkAuth() {
        if (!getToken()) return { success: false, authenticated: false };
        try {
            const data = await requete('/auth/check');
            return { success: true, authenticated: true, admin: data.admin };
        } catch (e) {
            setToken(null);
            setUser(null);
            return { success: false, authenticated: false };
        }
    }

    async function updateProfil(profilData) {
        return requete('/auth/profil', {
            method: 'PUT',
            body: profilData
        });
    }

    // ============================================
    // PRODUITS (PUBLIC)
    // ============================================

    async function getProduits(params = {}) {
        const query = new URLSearchParams();
        if (params.categorie) query.append('categorie', params.categorie);
        if (params.recherche) query.append('recherche', params.recherche);
        if (params.tri) query.append('tri', params.tri);
        if (params.disponible !== undefined) query.append('disponible', params.disponible);

        const qs = query.toString();
        return requete(`/produits${qs ? `?${qs}` : ''}`);
    }

    async function getProduit(id) {
        return requete(`/produits/${id}`);
    }

    // ============================================
    // PRODUITS (ADMIN)
    // ============================================

    async function getProduitsAdmin() {
        return requete('/admin/produits');
    }

    async function createProduit(dataOrFormData) {
        return requete('/admin/produits', {
            method: 'POST',
            body: dataOrFormData
        });
    }

    async function updateProduit(id, dataOrFormData) {
        return requete(`/admin/produits/${id}`, {
            method: 'PUT',
            body: dataOrFormData
        });
    }

    async function deleteProduit(id) {
        return requete(`/admin/produits/${id}`, {
            method: 'DELETE'
        });
    }

    async function toggleDisponibilite(id) {
        return requete(`/admin/produits/${id}/disponibilite`, {
            method: 'PATCH'
        });
    }

    async function togglePublication(id) {
        return requete(`/admin/produits/${id}/publication`, {
            method: 'PATCH'
        });
    }

    async function uploadImages(produitId, formData) {
        return requete(`/admin/produits/${produitId}/images`, {
            method: 'POST',
            body: formData
        });
    }

    async function deleteImage(imageId) {
        return requete(`/admin/images/${imageId}`, {
            method: 'DELETE'
        });
    }

    async function setMainImage(imageId) {
        return requete(`/admin/images/${imageId}/principale`, {
            method: 'PATCH'
        });
    }

    // ============================================
    // CATÉGORIES
    // ============================================

    async function getCategories() {
        return requete('/categories');
    }

    async function createCategorie(data) {
        return requete('/admin/categories', {
            method: 'POST',
            body: data
        });
    }

    async function updateCategorie(id, data) {
        return requete(`/admin/categories/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    async function deleteCategorie(id) {
        return requete(`/admin/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // COMMANDES
    // ============================================

    async function createCommande(data) {
        return requete('/commandes', {
            method: 'POST',
            body: data
        });
    }

    async function getCommandes(statut = '') {
        const query = statut ? `?statut=${encodeURIComponent(statut)}` : '';
        return requete(`/admin/commandes${query}`);
    }

    async function getCommande(id) {
        return requete(`/admin/commandes/${id}`);
    }

    async function updateStatutCommande(id, statut) {
        return requete(`/admin/commandes/${id}/statut`, {
            method: 'PATCH',
            body: { statut }
        });
    }

    async function deleteCommande(id) {
        return requete(`/admin/commandes/${id}`, {
            method: 'DELETE'
        });
    }

    // ============================================
    // PARAMÈTRES & STATS
    // ============================================

    async function getParametresPublics() {
        return requete('/parametres/public');
    }

    async function getParametresAdmin() {
        return requete('/admin/parametres');
    }

    async function updateParametres(data) {
        return requete('/admin/parametres', {
            method: 'PUT',
            body: data
        });
    }

    async function getStatistiques() {
        return requete('/admin/statistiques');
    }

    // ============================================
    // EXPORT DE L'INTERFACE
    // ============================================

    return {
        BASE_URL,
        getToken,
        getUser,
        isAuthenticated,
        login,
        logout,
        checkAuth,
        updateProfil,
        getProduits,
        getProduit,
        getProduitsAdmin,
        createProduit,
        updateProduit,
        deleteProduit,
        toggleDisponibilite,
        togglePublication,
        uploadImages,
        deleteImage,
        setMainImage,
        getCategories,
        createCategorie,
        updateCategorie,
        deleteCategorie,
        createCommande,
        getCommandes,
        getCommande,
        updateStatutCommande,
        deleteCommande,
        getParametresPublics,
        getParametresAdmin,
        updateParametres,
        getStatistiques
    };
})();

// Exposer globalement dans le navigateur
window.API = API;
