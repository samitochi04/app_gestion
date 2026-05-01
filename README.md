# Gestion - Diego Distribution SARL

Application web de gestion de distribution de bière pour **Diego Distribution SARL**.  
Frontend Angular connecté au backend Spring Boot à `http://51.75.248.25:8084/api`.

## Stack technique

- **Frontend** : Angular 21, TypeScript, Tailwind CSS
- **Backend** : Spring Boot (Java) — API REST avec wrapper `ApiResponse<T>`
- **Auth** : JWT (accessToken + refreshToken)

## Démarrage

```bash
npm install
ng serve
```

Ouvrir `http://localhost:4200/`. L'application redirige vers `/login`.

## Modules réalisés (✅)

### Authentification
- [x] Inscription (`/register`)
- [x] Connexion (`/login`)
- [x] Mot de passe oublié (`/forgot-password`)
- [x] Vérification OTP + réinitialisation (`/verify-otp`)
- [x] Changement de mot de passe (`/change-password`)
- [x] Intercepteur JWT avec refresh automatique
- [x] Guards (authGuard / guestGuard)

### Gestion des rôles (`/roles`)
- [x] Liste des rôles
- [x] Création / modification / suppression
- [x] Assignation des permissions

### Gestion des utilisateurs (`/users`)
- [x] Liste des utilisateurs (paginée)
- [x] Assignation de rôle à un utilisateur

### Tableau de bord (`/dashboard`)
- [x] Page d'accueil avec navigation vers les modules

---

## Modules à implémenter (📋)

Les endpoints backend sont disponibles. Voici les modules restants à développer côté frontend :

### 1. Gestion des catégories
- CRUD catégories (`GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`)
- Interface : liste + formulaire création/édition

### 2. Gestion des produits
- CRUD produits (`GET/POST /api/products`, `PUT/DELETE /api/products/{id}`)
- Filtres : recherche, catégorie, actif/inactif
- Pagination
- Consultation stock par produit (`GET /api/products/{id}/stock`)

### 3. Gestion des entrepôts
- CRUD entrepôts (`GET/POST /api/warehouses`, `PUT/DELETE /api/warehouses/{id}`)
- Filtre actif uniquement

### 4. Gestion du stock
- **Mouvements** : réception, sortie, transfert, ajustement
  - `POST /api/stock/movements/receive`
  - `POST /api/stock/movements/issue`
  - `POST /api/stock/movements/transfer`
  - `POST /api/stock/movements/adjust`
- **Stock actuel** : `GET /api/stock/current` (paginé)
- **Lots** : `GET /api/stock/lots/product/{productId}`
- **Réservations** : `POST /api/stock/reservations`, `DELETE /api/stock/reservations/{id}`
- **Historique mouvements** : `GET /api/stock/movements` (paginé, filtres type/entrepôt)

### 5. Gestion des clients
- CRUD clients (`GET/POST /api/customers`, `PUT/DELETE /api/customers/{id}`)
- Types : INDIVIDUAL / COMPANY
- Filtres : recherche, actif
- Pagination

### Gestion des devis (Quotes)
- CRUD devis (`GET/POST /api/quotes`, `PUT /api/quotes/{id}`)
- Statuts : `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`
- Envoi : `POST /api/quotes/{id}/send`
- Conversion en commande : `POST /api/quotes/{id}/convert`
- Lignes avec produit, quantité, prix, remise et TVA

### Gestion des commandes (Orders)
- CRUD commandes (`GET/POST /api/orders`, `PUT /api/orders/{id}`)
- Workflow : `confirm`, `prepare`, `ship`, `deliver`, `cancel`
- Adresse de livraison et lignes avec entrepôt source

### Gestion des pro-formas
- CRUD pro-formas (`GET/POST /api/pro-formas`, `PUT /api/pro-formas/{id}`)
- Téléchargement PDF : `GET /api/pro-formas/{id}/pdf`
- Envoi email : `POST /api/pro-formas/{id}/send?email=...`
- Conversion en facture : `POST /api/pro-formas/{id}/convert`

### Gestion des factures (Invoices)
- CRUD factures (`GET/POST /api/invoices`, `PUT /api/invoices/{id}`)
- Validation, envoi, annulation, détail, téléchargement PDF
- Paiements : `POST /api/invoices/payments`, `GET /api/invoices/{id}/payments`
- Échéanciers : création, consultation, règlement d'échéance

### Gestion des avoirs (Credit Notes)
- CRUD avoirs (`GET/POST /api/credit-notes`)
- Types `PARTIAL` / `FULL`
- Envoi par email : `POST /api/credit-notes/{id}/send?email=...`

### Journal d'audit
- Consultation des logs via `GET /api/audit`
- Filtres : module, entityType, entityId, userId, action
- Pagination et affichage des anciennes/nouvelles valeurs

### 6. Gestion des devis (Quotes)
- CRUD devis (`GET/POST /api/quotes`, `PUT /api/quotes/{id}`)
- Statuts : DRAFT → SENT → ACCEPTED/REJECTED/EXPIRED
- Envoi : `POST /api/quotes/{id}/send`
- Conversion en commande : `POST /api/quotes/{id}/convert`
- Lignes de devis avec produit, quantité, prix, remise, TVA

### 7. Gestion des commandes (Orders)
- CRUD commandes (`GET/POST /api/orders`, `PUT /api/orders/{id}`)
- Workflow de statuts : DRAFT → CONFIRMED → PREPARING → SHIPPED → DELIVERED / CANCELLED
  - `POST /api/orders/{id}/confirm`
  - `POST /api/orders/{id}/prepare`
  - `POST /api/orders/{id}/ship`
  - `POST /api/orders/{id}/deliver`
  - `POST /api/orders/{id}/cancel`
- Adresse de livraison
- Lignes avec entrepôt source

### 8. Gestion des pro-formas
- CRUD pro-formas (`GET/POST /api/pro-formas`, `PUT /api/pro-formas/{id}`)
- Téléchargement PDF : `GET /api/pro-formas/{id}/pdf`
- Envoi par email : `POST /api/pro-formas/{id}/send?email=...`
- Conversion en facture : `POST /api/pro-formas/{id}/convert`

### 9. Gestion des factures (Invoices)
- CRUD factures (`GET/POST /api/invoices`, `PUT /api/invoices/{id}`)
- Statuts : DRAFT → VALIDATED → SENT → PARTIALLY_PAID → PAID / OVERDUE / CANCELLED
  - `POST /api/invoices/{id}/validate`
  - `POST /api/invoices/{id}/send?email=...`
  - `POST /api/invoices/{id}/cancel?reason=...`
- Détail facture : `GET /api/invoices/{id}`
- Téléchargement PDF : `GET /api/invoices/{id}/pdf`
- **Paiements** :
  - Enregistrement : `POST /api/invoices/payments`
  - Liste par facture : `GET /api/invoices/{id}/payments`
  - Méthodes : CASH, BANK_TRANSFER, MOBILE_MONEY, CHECK
- **Échéanciers** :
  - Création : `POST /api/invoices/schedules`
  - Consultation : `GET /api/invoices/{id}/schedule`
  - Paiement échéance : `POST /api/invoices/schedules/installments`

### 10. Gestion des avoirs (Credit Notes)
- CRUD avoirs (`GET/POST /api/credit-notes`)
- Types : PARTIAL / FULL
- Envoi par email : `POST /api/credit-notes/{id}/send?email=...`

### 11. Journal d'audit
- Consultation logs : `GET /api/audit`
- Filtres : module, entityType, entityId, userId, action
- Pagination
- Actions : CREATE, UPDATE, DELETE, LOGIN, PASSWORD_CHANGE, STOCK_MOVEMENT, PAYMENT_RECORDED, etc.

### 12. Améliorations transversales
- [ ] Tableau de bord enrichi avec statistiques (nombre commandes, CA, stock bas)
- [ ] Composant de pagination réutilisable
- [ ] Notifications toast (succès/erreur)
- [ ] Sidebar de navigation permanente
- [ ] Gestion des permissions dans le menu (masquer modules non autorisés)
- [ ] Export des données (CSV/PDF)
- [ ] Mode responsive mobile complet

## Notes d'intégration backend

- Le frontend couvre désormais les surfaces Angular pour catégories, produits, entrepôts, stock, clients, devis, commandes, pro-formas, factures, avoirs et audit.
- Les endpoints `GET /api/products` et `GET /api/customers` remontent encore des `500` côté backend dans l'environnement actuel, ce qui peut aussi impacter les listes de produits utilisées comme référentiels dans les nouveaux modules commerciaux.
- L'assignation de rôle utilisateur renvoie toujours `403` avec le token admin observé, ce qui pointe vers une permission backend plus spécifique que celles présentes dans le JWT actuel.

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
