/*
 * ==============================================
 * I.CO.MO — MODULE PANIER
 * ==============================================
 *
 * VERSION FRONTEND
 * Les données du panier sont stockées dans localStorage.
 *
 * Pour une version production :
 * remplacer localStorage par une véritable
 * base de données et une API backend sécurisée.
 */

// ============================================
// NUMÉRO WHATSAPP (facilement modifiable)
// ============================================
const NUMERO_WHATSAPP = "225XXXXXXXXXX";

// ============================================
// GESTION DU PANIER (localStorage)
// ============================================

/**
 * Récupère le panier depuis localStorage
 * @returns {Array} Articles du panier
 */
function getPanier() {
    return JSON.parse(localStorage.getItem('icomo_panier')) || [];
}

/**
 * Sauvegarde le panier dans localStorage
 * @param {Array} panier - Articles du panier
 */
function savePanier(panier) {
    localStorage.setItem('icomo_panier', JSON.stringify(panier));
    mettreAJourBadgePanier();
}

/**
 * Ajoute un produit au panier
 * @param {number} produitId - ID du produit à ajouter
 */
function ajouterAuPanier(produitId) {
    const produit = getProduitById(produitId);
    if (!produit || !produit.disponible) {
        afficherNotification('Ce produit n\'est pas disponible.', 'error');
        return;
    }
    
    const panier = getPanier();
    const index = panier.findIndex(item => item.id === produitId);
    
    if (index !== -1) {
        panier[index].quantite += 1;
    } else {
        panier.push({
            id: produit.id,
            nom: produit.nom,
            prix: produit.prix,
            image: produit.image,
            categorie: produit.categorie,
            quantite: 1
        });
    }
    
    savePanier(panier);
    afficherNotification('✓ Produit ajouté au panier', 'success');
}

/**
 * Retire un produit du panier
 * @param {number} produitId - ID du produit
 */
function retirerDuPanier(produitId) {
    let panier = getPanier();
    panier = panier.filter(item => item.id !== produitId);
    savePanier(panier);
    afficherNotification('✓ Produit supprimé du panier', 'success');
    
    // Rafraîchir l'affichage si on est sur la page panier
    if (typeof afficherPagePanier === 'function') {
        afficherPagePanier();
    }
}

/**
 * Modifie la quantité d'un produit dans le panier
 * @param {number} produitId - ID du produit
 * @param {number} delta - Changement (+1 ou -1)
 */
function modifierQuantite(produitId, delta) {
    const panier = getPanier();
    const index = panier.findIndex(item => item.id === produitId);
    
    if (index === -1) return;
    
    panier[index].quantite += delta;
    
    if (panier[index].quantite <= 0) {
        panier.splice(index, 1);
    }
    
    savePanier(panier);
    
    // Rafraîchir l'affichage si on est sur la page panier
    if (typeof afficherPagePanier === 'function') {
        afficherPagePanier();
    }
}

/**
 * Vide tout le panier
 */
function viderPanier() {
    savePanier([]);
    afficherNotification('✓ Panier vidé', 'success');
    
    if (typeof afficherPagePanier === 'function') {
        afficherPagePanier();
    }
}

/**
 * Calcule le total du panier
 * @returns {number} Total en FCFA
 */
function getTotalPanier() {
    const panier = getPanier();
    return panier.reduce((total, item) => total + (item.prix * item.quantite), 0);
}

/**
 * Récupère le nombre total d'articles dans le panier
 * @returns {number} Nombre d'articles
 */
function getNombreArticles() {
    const panier = getPanier();
    return panier.reduce((total, item) => total + item.quantite, 0);
}

/**
 * Met à jour le badge du panier dans le header
 */
function mettreAJourBadgePanier() {
    const badges = document.querySelectorAll('.header__cart-badge');
    const nombre = getNombreArticles();
    
    badges.forEach(badge => {
        badge.textContent = nombre;
        badge.classList.toggle('visible', nombre > 0);
    });
}

// ============================================
// AFFICHAGE DU PANIER
// ============================================

/**
 * Affiche la page du panier
 */
function afficherPagePanier() {
    const container = document.getElementById('cart-container');
    if (!container) return;
    
    const panier = getPanier();
    
    if (panier.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty__icon">🛒</div>
                <h2 class="cart-empty__title">Votre panier est vide</h2>
                <p class="cart-empty__text">Parcourez notre catalogue et ajoutez des produits à votre panier.</p>
                <a href="produits.html" class="btn btn--primary btn--lg">Découvrir nos produits</a>
            </div>
        `;
        return;
    }
    
    let itemsHTML = '';
    panier.forEach(item => {
        const imageSrc = item.image || '';
        const imageHTML = imageSrc
            ? `<img src="${imageSrc}" alt="${item.nom}">`
            : `<div class="image-placeholder" style="font-size:2rem;">🪵</div>`;
        
        itemsHTML += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item__image">
                    ${imageHTML}
                </div>
                <div class="cart-item__info">
                    <h3 class="cart-item__name">${item.nom}</h3>
                    <span class="cart-item__category">${item.categorie}</span>
                    <div class="cart-item__price">${formaterPrix(item.prix)}</div>
                </div>
                <div class="cart-item__actions">
                    <button class="cart-item__remove" onclick="retirerDuPanier(${item.id})" title="Supprimer">✕</button>
                    <div class="cart-item__quantity">
                        <button class="cart-item__qty-btn" onclick="modifierQuantite(${item.id}, -1)">−</button>
                        <span class="cart-item__qty-value">${item.quantite}</span>
                        <button class="cart-item__qty-btn" onclick="modifierQuantite(${item.id}, +1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    const sousTotal = getTotalPanier();
    
    container.innerHTML = `
        <div class="cart-page__grid">
            <div class="cart-items">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-4);">
                    <h2 style="font-family: var(--font-heading); font-size: var(--fs-xl);">
                        Articles (${getNombreArticles()})
                    </h2>
                    <button class="btn btn--ghost btn--sm" onclick="viderPanier()">🗑 Vider le panier</button>
                </div>
                ${itemsHTML}
            </div>
            <div class="cart-summary">
                <h3 class="cart-summary__title">Récapitulatif</h3>
                <div class="cart-summary__row">
                    <span>Sous-total</span>
                    <span>${formaterPrix(sousTotal)}</span>
                </div>
                <div class="cart-summary__row">
                    <span>Livraison</span>
                    <span>À déterminer</span>
                </div>
                <div class="cart-summary__total">
                    <span>Total</span>
                    <span>${formaterPrix(sousTotal)}</span>
                </div>
                <div class="cart-summary__buttons">
                    <button class="btn btn--whatsapp btn--block btn--lg" onclick="ouvrirFormulaireCommande()">
                        💬 Commander via WhatsApp
                    </button>
                    <a href="produits.html" class="btn btn--ghost btn--block">
                        ← Continuer les achats
                    </a>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// FORMULAIRE DE COMMANDE
// ============================================

/**
 * Ouvre le formulaire de commande (modal)
 */
function ouvrirFormulaireCommande() {
    const panier = getPanier();
    if (panier.length === 0) {
        afficherNotification('Votre panier est vide.', 'error');
        return;
    }
    
    // Créer le modal s'il n'existe pas
    let modal = document.getElementById('order-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'order-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal__backdrop" onclick="fermerFormulaireCommande()"></div>
        <div class="modal__content">
            <button class="modal__close" onclick="fermerFormulaireCommande()">✕</button>
            <h2 class="modal__title">📋 Informations de livraison</h2>
            <form id="order-form" onsubmit="envoyerCommandeWhatsApp(event)">
                <div class="form-group">
                    <label class="form-label" for="client-nom">Nom complet *</label>
                    <input type="text" id="client-nom" class="form-input" placeholder="Votre nom complet" required>
                    <span class="form-error" id="error-nom">Veuillez entrer votre nom complet.</span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="client-telephone">Numéro de téléphone *</label>
                    <input type="tel" id="client-telephone" class="form-input" placeholder="Ex: 07 XX XX XX XX" required>
                    <span class="form-error" id="error-telephone">Veuillez entrer un numéro de téléphone valide.</span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="client-adresse">Adresse de livraison *</label>
                    <input type="text" id="client-adresse" class="form-input" placeholder="Votre adresse complète" required>
                    <span class="form-error" id="error-adresse">Veuillez entrer votre adresse.</span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="client-ville">Ville *</label>
                    <input type="text" id="client-ville" class="form-input" placeholder="Ex: Abidjan" required>
                    <span class="form-error" id="error-ville">Veuillez entrer votre ville.</span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="client-message">Message particulier</label>
                    <textarea id="client-message" class="form-textarea" placeholder="Informations supplémentaires (dimensions, couleur, etc.)" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn--whatsapp btn--block btn--lg">
                    💬 Envoyer la commande via WhatsApp
                </button>
            </form>
        </div>
    `;
    
    requestAnimationFrame(() => {
        modal.classList.add('open');
    });
    
    document.body.style.overflow = 'hidden';
}

/**
 * Ferme le formulaire de commande
 */
function fermerFormulaireCommande() {
    const modal = document.getElementById('order-modal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => {
            document.body.style.overflow = '';
        }, 300);
    }
}

/**
 * Valide et envoie la commande via WhatsApp
 * @param {Event} e - Événement du formulaire
 */
function envoyerCommandeWhatsApp(e) {
    e.preventDefault();
    
    // Récupération des données
    const nom = document.getElementById('client-nom').value.trim();
    const telephone = document.getElementById('client-telephone').value.trim();
    const adresse = document.getElementById('client-adresse').value.trim();
    const ville = document.getElementById('client-ville').value.trim();
    const messageClient = document.getElementById('client-message').value.trim();
    
    // Validation
    let valide = true;
    
    if (!nom) {
        document.getElementById('error-nom').classList.add('visible');
        document.getElementById('client-nom').classList.add('error');
        valide = false;
    } else {
        document.getElementById('error-nom').classList.remove('visible');
        document.getElementById('client-nom').classList.remove('error');
    }
    
    if (!telephone) {
        document.getElementById('error-telephone').classList.add('visible');
        document.getElementById('client-telephone').classList.add('error');
        valide = false;
    } else {
        document.getElementById('error-telephone').classList.remove('visible');
        document.getElementById('client-telephone').classList.remove('error');
    }
    
    if (!adresse) {
        document.getElementById('error-adresse').classList.add('visible');
        document.getElementById('client-adresse').classList.add('error');
        valide = false;
    } else {
        document.getElementById('error-adresse').classList.remove('visible');
        document.getElementById('client-adresse').classList.remove('error');
    }
    
    if (!ville) {
        document.getElementById('error-ville').classList.add('visible');
        document.getElementById('client-ville').classList.add('error');
        valide = false;
    } else {
        document.getElementById('error-ville').classList.remove('visible');
        document.getElementById('client-ville').classList.remove('error');
    }
    
    if (!valide) return;
    
    // Construction du message WhatsApp
    const panier = getPanier();
    let message = `Bonjour I.CO.MO,\n\nJe souhaite passer une commande.\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n`;
    message += `📦 DÉTAIL DE LA COMMANDE\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n\n`;
    
    panier.forEach((item, index) => {
        message += `${index + 1}. ${item.nom}\n`;
        message += `   Quantité : ${item.quantite}\n`;
        message += `   Prix unitaire : ${formaterPrix(item.prix)}\n`;
        message += `   Sous-total : ${formaterPrix(item.prix * item.quantite)}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 TOTAL : ${formaterPrix(getTotalPanier())}\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `👤 INFORMATIONS CLIENT\n\n`;
    message += `Nom : ${nom}\n`;
    message += `Téléphone : ${telephone}\n`;
    message += `Adresse : ${adresse}\n`;
    message += `Ville : ${ville}\n`;
    
    if (messageClient) {
        message += `\n📝 Informations supplémentaires :\n${messageClient}\n`;
    }
    
    message += `\nMerci.`;
    
    // Sauvegarder la commande localement
    sauvegarderCommandeLocale({
        date: new Date().toISOString(),
        client: { nom, telephone, adresse, ville },
        articles: panier,
        total: getTotalPanier(),
        message: messageClient
    });
    
    // Ouvrir WhatsApp
    window.open(
        `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(message)}`,
        "_blank"
    );
    
    // Fermer le modal et vider le panier
    fermerFormulaireCommande();
    afficherNotification('✓ Commande envoyée via WhatsApp !', 'success');
}

/**
 * Sauvegarde une commande locale dans localStorage
 * @param {Object} commande - Données de la commande
 */
function sauvegarderCommandeLocale(commande) {
    const commandes = JSON.parse(localStorage.getItem('icomo_commandes')) || [];
    commande.id = commandes.length + 1;
    commandes.push(commande);
    localStorage.setItem('icomo_commandes', JSON.stringify(commandes));
}

/**
 * Récupère les commandes locales
 * @returns {Array} Liste des commandes
 */
function getCommandesLocales() {
    return JSON.parse(localStorage.getItem('icomo_commandes')) || [];
}
