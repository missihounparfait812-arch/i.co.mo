/*
 * ==============================================
 * I.CO.MO — MODULE APPLICATION GÉNÉRALE
 * ==============================================
 *
 * Contient :
 * - Menu mobile
 * - Navigation
 * - WhatsApp
 * - Thème sombre
 * - Notifications
 * - Animations de défilement
 * - Fonctions générales
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    entreprise: 'I.CO.MO',
    slogan: "L'art de transformer le bois en qualité.",
    telephone: '+225 XX XX XX XX XX',
    email: 'contact@icomo.ci',
    whatsapp: NUMERO_WHATSAPP,
    adresse: 'Abidjan, Côte d\'Ivoire',
    horaires: 'Lun - Sam : 08h00 - 18h00'
};

const localisation = {
    adresse: "Abidjan, Côte d'Ivoire",
    latitude: 5.3600,
    longitude: -4.0083
};

// ============================================
// INITIALISATION GÉNÉRALE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les produits
    initProduits();
    
    // Initialiser le thème
    initTheme();
    
    // Initialiser le menu mobile
    initMenuMobile();
    
    // Initialiser le badge panier
    mettreAJourBadgePanier();
    
    // Initialiser les animations de défilement
    initScrollAnimations();
    
    // Initialiser le scroll header
    initHeaderScroll();
    
    // Initialiser le bouton scroll top
    initScrollTop();
    
    // Marquer le lien actif
    marquerLienActif();
});

// ============================================
// MENU MOBILE
// ============================================

/**
 * Initialise le menu mobile hamburger
 */
function initMenuMobile() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');
    const overlay = document.getElementById('mobile-overlay');
    
    if (!hamburger || !nav) return;
    
    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        nav.classList.toggle('open');
        if (overlay) overlay.classList.toggle('visible');
        document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    
    // Fermer le menu quand on clique sur un lien
    const navLinks = nav.querySelectorAll('.header__nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            nav.classList.remove('open');
            if (overlay) overlay.classList.remove('visible');
            document.body.style.overflow = '';
        });
    });
    
    // Fermer le menu quand on clique sur l'overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            hamburger.classList.remove('active');
            nav.classList.remove('open');
            this.classList.remove('visible');
            document.body.style.overflow = '';
        });
    }
}

// ============================================
// THÈME SOMBRE / CLAIR
// ============================================

/**
 * Initialise le thème depuis localStorage
 */
function initTheme() {
    const savedTheme = localStorage.getItem('icomo_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

/**
 * Bascule entre le thème clair et sombre
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('icomo_theme', newTheme);
    updateThemeIcon(newTheme);
}

/**
 * Met à jour l'icône du thème
 * @param {string} theme - Le thème actuel
 */
function updateThemeIcon(theme) {
    const toggleBtns = document.querySelectorAll('.theme-toggle');
    toggleBtns.forEach(btn => {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('title', theme === 'dark' ? 'Mode clair' : 'Mode sombre');
    });
}

// ============================================
// HEADER SCROLL
// ============================================

/**
 * Ajoute l'effet de scroll au header
 */
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ============================================
// SCROLL TOP BUTTON
// ============================================

/**
 * Initialise le bouton de retour en haut
 */
function initScrollTop() {
    const scrollTopBtn = document.getElementById('scroll-top');
    if (!scrollTopBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// ANIMATIONS DE DÉFILEMENT
// ============================================

/**
 * Initialise les animations au scroll (IntersectionObserver)
 */
function initScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Affiche une notification temporaire
 * @param {string} message - Texte de la notification
 * @param {string} [type='success'] - Type : success, error, info
 */
function afficherNotification(message, type = 'success') {
    // Supprimer l'ancienne notification si elle existe
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <span class="notification__icon">${icons[type] || '✓'}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Auto-fermeture
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// ============================================
// CONFIRMATION DIALOG
// ============================================

/**
 * Affiche une boîte de dialogue de confirmation
 * @param {string} titre - Titre
 * @param {string} message - Message
 * @param {Function} onConfirm - Callback de confirmation
 * @param {string} [confirmText='Supprimer'] - Texte du bouton confirmer
 */
function afficherConfirmation(titre, message, onConfirm, confirmText = 'Supprimer') {
    let dialog = document.getElementById('confirm-dialog');
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'confirm-dialog';
        dialog.className = 'confirm-dialog';
        document.body.appendChild(dialog);
    }
    
    dialog.innerHTML = `
        <div class="confirm-dialog__backdrop"></div>
        <div class="confirm-dialog__content">
            <div class="confirm-dialog__icon">⚠️</div>
            <h3 class="confirm-dialog__title">${titre}</h3>
            <p class="confirm-dialog__text">${message}</p>
            <div class="confirm-dialog__buttons">
                <button class="btn btn--ghost" id="confirm-cancel">Annuler</button>
                <button class="btn btn--danger" id="confirm-action">${confirmText}</button>
            </div>
        </div>
    `;
    
    requestAnimationFrame(() => {
        dialog.classList.add('open');
    });
    
    document.getElementById('confirm-cancel').addEventListener('click', () => {
        dialog.classList.remove('open');
    });
    
    dialog.querySelector('.confirm-dialog__backdrop').addEventListener('click', () => {
        dialog.classList.remove('open');
    });
    
    document.getElementById('confirm-action').addEventListener('click', () => {
        dialog.classList.remove('open');
        if (onConfirm) onConfirm();
    });
}

// ============================================
// NAVIGATION
// ============================================

/**
 * Marque le lien de navigation actif
 */
function marquerLienActif() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.header__nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ============================================
// WHATSAPP
// ============================================

/**
 * Ouvre WhatsApp avec un message par défaut
 */
function ouvrirWhatsApp() {
    const message = encodeURIComponent(
        `Bonjour I.CO.MO,\n\nJe souhaite avoir plus d'informations sur vos produits et services.\n\nMerci.`
    );
    window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${message}`, '_blank');
}

/**
 * Ouvre le lien WhatsApp pour commander depuis le header
 */
function commanderWhatsApp() {
    ouvrirWhatsApp();
}

// ============================================
// GALERIE / RÉALISATIONS
// ============================================
const realisations = [
    { titre: "Cuisine sur mesure", categorie: "Cuisine", description: "Cuisine équipée complète avec finitions haut de gamme" },
    { titre: "Dressing luxueux", categorie: "Dressing", description: "Dressing complet avec portes coulissantes" },
    { titre: "Lit en bois massif", categorie: "Lit", description: "Lit king size en teck massif sculpté" },
    { titre: "Porte d'entrée sculptée", categorie: "Porte", description: "Porte principale en acajou avec sculptures artisanales" },
    { titre: "Meuble TV design", categorie: "Meuble TV", description: "Meuble TV contemporain en bois et métal" },
    { titre: "Table familiale", categorie: "Table", description: "Grande table en bois massif pour 10 personnes" },
    { titre: "Bureau présidentiel", categorie: "Bureau", description: "Bureau directorial en bois noble avec détails en cuir" }
];

/**
 * Affiche la galerie des réalisations
 * @param {string} containerId - ID du conteneur
 */
function afficherRealisations(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = realisations.map((r, index) => `
        <div class="gallery-item animate-on-scroll delay-${(index % 4) + 1}">
            <div class="image-placeholder" style="font-size:3rem; background: linear-gradient(135deg, #5D4037 0%, #3E2723 100%);">
                🪵
            </div>
            <div class="gallery-item__overlay">
                <h3 class="gallery-item__title">${r.titre}</h3>
                <p class="gallery-item__subtitle">${r.description}</p>
            </div>
        </div>
    `).join('');
    
    // Réinitialiser les animations
    initScrollAnimations();
}

// ============================================
// SMOOTH SCROLL
// ============================================

/**
 * Fait défiler la page vers une section
 * @param {string} sectionId - ID de la section
 */
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
        const top = element.offsetTop - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}
