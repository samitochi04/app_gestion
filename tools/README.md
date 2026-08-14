# Vérification des API backend

`tools/test_api.py` exerce **tous** les points d'entrée REST du backend KIT ERP
et produit un rapport console + HTML.

Bibliothèque standard Python uniquement — rien à installer.

## Lancer

```bash
python tools/test_api.py --email <adresse> --password <mot de passe>
```

Par défaut l'outil **teste tout** (mode complet) : lectures **et** écritures
(création → validation → règlement…). Il produit trois choses :

1. un **résumé texte des pannes** prêt à copier-coller (`pannes-backend.txt`),
   aussi affiché dans le terminal entre deux repères « À COPIER-COLLER » ;
2. un rapport **HTML** détaillé (`rapport-api.html`), servi sur
   <http://localhost:5173> — le navigateur s'ouvre tout seul, `Ctrl+C` arrête ;
3. le détail **console** ligne par ligne.

C'est le fichier `pannes-backend.txt` qu'on envoie au dev backend : une ligne
par endpoint qui échoue, groupé par module, sans détail superflu.

Les identifiants peuvent aussi venir de l'environnement :

```bash
ERP_EMAIL=... ERP_PASSWORD=... python tools/test_api.py
```

## Les deux modes

| Mode | Ce qu'il fait |
|---|---|
| `--mode write` (**défaut**) | Teste **tous** les endpoints : ajoute le cycle complet catégorie → entrepôt → produit → réception → ajustement → transfert → sortie → réservation, client → devis → commande → expédition, pro forma → facture → encaissement → avoir, compte → OD → contre-passation → lettrage, fournisseur → commande d'achat → facture → règlement, messagerie, etc. |
| `--mode read` | N'exécute que des lectures. Aucune donnée créée. |

En mode complet, tout ce qui est créé porte le suffixe `APITEST-<horodatage>`
pour rester identifiable en base, et une suite de **nettoyage** finale supprime
les fixtures créées quand c'est possible. Les opérations réellement destructrices
ou visibles de l'extérieur (envoi de courriels, remplacement du logo, import de
masse, réécriture du plan comptable) restent volontairement `SKIP`.

## Options utiles

| Option | Rôle |
|---|---|
| `--list` | Affiche les suites disponibles |
| `--only products,orders` | Ne lance que certaines suites |
| `--mode read` | Lectures seules (le défaut teste tout) |
| `--base-url` | Cible un autre backend (défaut : `http://51.75.248.25:8084`) |
| `--origin` | En-tête `Origin` envoyé (défaut : `http://localhost:4200`) |
| `--no-origin` | N'envoie aucun `Origin` — appel serveur à serveur |
| `--whatsapp chemin.txt` | Chemin du résumé des pannes (défaut : `pannes-backend.txt`) |
| `--json out.json` | Rapport JSON, pour une intégration CI |
| `--html chemin.html` | Chemin du rapport HTML |
| `--port 5173` | Port du serveur de rapport |
| `--no-serve` | Écrit les rapports et quitte |
| `-v` | Trace chaque appel HTTP |

Code de sortie `0` si tout passe, `1` s'il reste un échec — utilisable tel quel
dans une chaîne d'intégration.

## À propos du CORS et du port 5173

Le CORS est une protection **du navigateur** : un script Python n'y est pas
soumis, la suite fonctionne quelle que soit l'origine déclarée.

Cela dit, l'origine est envoyée pour vérifier aussi la configuration du serveur.
Or, vérification faite par pré-requête sur les deux déploiements :

```
OPTIONS /api/auth/login   Origin: http://localhost:4200   → 200
OPTIONS /api/auth/login   Origin: http://localhost:5173   → 403 « Invalid CORS request »
```

**Le backend n'autorise que `http://localhost:4200`**, pas `5173` — sur
`51.75.248.25:8084` comme sur `api.kairosinnovationtechnologies.online/erp`.
C'est aussi le port qu'utilise `ng serve`, donc l'application Angular tourne
correctement en l'état.

Le défaut de l'outil est donc `--origin http://localhost:4200`. Le port `5173`
sert ici à **servir le rapport**. Pour faire accepter `5173` par un navigateur,
il faut l'ajouter côté backend à `allowedOrigins` dans la configuration CORS
Spring — aucune modification frontend ne peut y suppléer.

## Organisation

```
tools/api_test/
  http.py          client HTTP conscient de l'enveloppe ApiResponse
  runner.py        registre des suites, collecte, rendu console/JSON/HTML
  __main__.py      interface en ligne de commande
  suites/
    iam.py         auth, utilisateurs, rôles, réglages SMTP
    stock.py       catégories, entrepôts, produits, mouvements, imports
    sales.py       clients, devis, commandes
    billing.py     pro formas, factures, avoirs, encaissements, échéanciers
    accounting.py  plan, périodes, journal, lettrage, mappings, inbox
    reporting.py   tableaux de bord, exports, société
    supplier.py    fournisseurs, commandes d'achat, factures et avoirs d'achat
    messaging.py   conversations, messages, flux SSE
    audit.py       journal d'audit
    cleanup.py     suppression des fixtures créées (DELETE), en dernier
```

Ajouter une suite = déposer un fichier dans `suites/`, le décorer avec
`@suite("clé", "Libellé")` et l'importer dans `suites/__init__.py`. Le reste de
l'outil ne change pas.
