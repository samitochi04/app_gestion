"""erp-stock — catégories, entrepôts, produits, mouvements, lots, imports."""

from __future__ import annotations

import uuid

from ..runner import Context, suite
from ._shared import RUN_TAG, tag, today


@suite("categories", "Catégories (/api/categories)", order=30)
def categories(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/categories", "liste complète", lambda: c.get("/api/categories"))
    if res and res.ok:
        first = ctx.first(res.data)
        if first:
            ctx.remember("categoryId", first.get("id"))

    created = ctx.check(
        "POST /api/categories",
        "création",
        lambda: c.post("/api/categories", {"name": tag("Catégorie"), "description": "Créée par la suite de test API"}),
        write=True,
    )
    cat_id = (created.data or {}).get("id") if created and created.ok else None
    if cat_id:
        ctx.remember("categoryId", cat_id)
        ctx.remember("tempCategoryId", cat_id)
        ctx.check(
            "PUT /api/categories/{id}",
            "modification",
            lambda: c.put(f"/api/categories/{cat_id}", {"name": tag("Catégorie"), "description": "Modifiée"}),
            write=True,
        )
    else:
        ctx.skip("PUT /api/categories/{id}", "modification", "aucune catégorie de test créée", write=True)


@suite("warehouses", "Entrepôts (/api/warehouses)", order=31)
def warehouses(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/warehouses", "liste complète", lambda: c.get("/api/warehouses"))
    if res and res.ok:
        items = res.data if isinstance(res.data, list) else (res.data or {}).get("content") or []
        if items:
            ctx.remember("warehouseId", items[0].get("id"))
        if len(items) > 1:
            ctx.remember("warehouseId2", items[1].get("id"))
    ctx.check("GET /api/warehouses", "filtre actifs seulement", lambda: c.get("/api/warehouses", {"activeOnly": "true"}))

    created = ctx.check(
        "POST /api/warehouses",
        "création",
        lambda: c.post(
            "/api/warehouses",
            {"name": tag("Entrepôt"), "code": f"WT{uuid.uuid4().hex[:6].upper()}", "address": "Zone de test"},
        ),
        write=True,
    )
    wh_id = (created.data or {}).get("id") if created and created.ok else None
    if wh_id:
        ctx.remember("warehouseId2", wh_id)
        ctx.check(
            "PUT /api/warehouses/{id}",
            "modification",
            lambda: c.put(f"/api/warehouses/{wh_id}", {"name": tag("Entrepôt"), "address": "Zone de test (modifiée)"}),
            write=True,
        )
        ctx.check(
            "POST /api/warehouses/{id}/purchase-default",
            "désigner comme entrepôt d'achat",
            lambda: c.post(f"/api/warehouses/{wh_id}/purchase-default"),
            write=True,
        )
        ctx.check(
            "POST /api/warehouses/{id}/damaged-default",
            "désigner comme entrepôt d'avariés",
            lambda: c.post(f"/api/warehouses/{wh_id}/damaged-default"),
            accept=("WAREHOUSE_FLAG_CONFLICT", "WAREHOUSE_ALREADY_PURCHASE_DEFAULT", 400),
            write=True,
        )
    else:
        for ep, label in (
            ("PUT /api/warehouses/{id}", "modification"),
            ("POST /api/warehouses/{id}/purchase-default", "désigner comme entrepôt d'achat"),
            ("POST /api/warehouses/{id}/damaged-default", "désigner comme entrepôt d'avariés"),
        ):
            ctx.skip(ep, label, "aucun entrepôt de test créé", write=True)


@suite("products", "Produits (/api/products)", order=32)
def products(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/products", "liste paginée", lambda: c.get("/api/products", {"page": 0, "size": 20}))
    if res and res.ok:
        first = ctx.first(res.data)
        if first:
            ctx.remember("productId", first.get("id"))
            ctx.remember("productName", first.get("name"))
            ctx.remember("productSalePrice", first.get("unitSalePrice") or 1000)
    ctx.check("GET /api/products", "recherche plein texte", lambda: c.get("/api/products", {"page": 0, "size": 5, "query": "a"}))
    ctx.check("GET /api/products", "filtre actif", lambda: c.get("/api/products", {"page": 0, "size": 5, "active": "true"}))

    created = ctx.check(
        "POST /api/products",
        "création",
        lambda: c.post(
            "/api/products",
            {
                "name": tag("Produit"),
                "sku": f"SKU-{uuid.uuid4().hex[:8].upper()}",
                "description": "Créé par la suite de test API",
                "type": "STOCKABLE",
                "categoryId": ctx.recall("categoryId"),
                "unitPurchasePrice": 1000,
                "unit": "PIECE",
            },
        ),
        write=True,
    )
    pid = (created.data or {}).get("id") if created and created.ok else None
    if pid:
        ctx.remember("productId", pid)
        ctx.remember("productName", tag("Produit"))
        ctx.remember("productSalePrice", 1500)
        ctx.check(
            "PUT /api/products/{id}",
            "modification (marge → prix de vente)",
            lambda: c.put(
                f"/api/products/{pid}",
                {"name": tag("Produit"), "unitPurchasePrice": 1000, "unitSalePrice": 1500, "unit": "PIECE"},
            ),
            write=True,
        )
    else:
        ctx.skip("PUT /api/products/{id}", "modification", "aucun produit de test créé", write=True)

    pid = ctx.recall("productId")
    if pid:
        ctx.check("GET /api/products/{id}/stock", "stock du produit", lambda: c.get(f"/api/products/{pid}/stock"))
    else:
        ctx.skip("GET /api/products/{id}/stock", "stock du produit", "aucun produit disponible")


@suite("stock", "Mouvements de stock (/api/stock)", order=33)
def stock_movements(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/stock/movements", "historique paginé", lambda: c.get("/api/stock/movements", {"page": 0, "size": 20}))
    ctx.check("GET /api/stock/movements", "filtre par type", lambda: c.get("/api/stock/movements", {"page": 0, "size": 5, "type": "IN"}))
    ctx.check("GET /api/stock/current", "état courant paginé", lambda: c.get("/api/stock/current", {"page": 0, "size": 20}))
    ctx.check("GET /api/stock/valuation", "valorisation à date", lambda: c.get("/api/stock/valuation", {"date": today()}))

    pid, wid = ctx.recall("productId"), ctx.recall("warehouseId")
    if pid:
        ctx.check(
            "GET /api/stock/lots/product/{productId}",
            "lots d'un produit",
            lambda: c.get(f"/api/stock/lots/product/{pid}"),
        )
    else:
        ctx.skip("GET /api/stock/lots/product/{productId}", "lots d'un produit", "aucun produit disponible")

    if not (pid and wid):
        for ep, label in (
            ("POST /api/stock/movements/receive", "réception"),
            ("POST /api/stock/movements/adjust", "ajustement d'inventaire"),
            ("POST /api/stock/movements/transfer", "transfert entre entrepôts"),
            ("POST /api/stock/movements/issue", "sortie"),
            ("POST /api/stock/reservations", "réservation"),
            ("DELETE /api/stock/reservations/{reservationId}", "libération d'une réservation"),
        ):
            ctx.skip(ep, label, "produit ou entrepôt indisponible", write=True)
        return

    ctx.check(
        "POST /api/stock/movements/receive",
        "réception (saine + avariée + manquante)",
        lambda: c.post(
            "/api/stock/movements/receive",
            {
                "warehouseId": wid,
                "reference": f"RCP-{RUN_TAG}",
                "notes": "Réception de test API",
                "operationDate": today(),
                "lines": [{"productId": pid, "quantity": 50, "unitCost": 1000, "damagedQuantity": 0, "missingQuantity": 0}],
            },
        ),
        write=True,
    )
    ctx.check(
        "POST /api/stock/movements/adjust",
        "ajustement (newQuantity, pas quantity)",
        lambda: c.post(
            "/api/stock/movements/adjust",
            {
                "warehouseId": wid,
                "reference": f"ADJ-{RUN_TAG}",
                "operationDate": today(),
                "lines": [{"productId": pid, "newQuantity": 48, "unitCost": 1000}],
            },
        ),
        write=True,
    )

    wid2 = ctx.recall("warehouseId2")
    if wid2 and wid2 != wid:
        ctx.check(
            "POST /api/stock/movements/transfer",
            "transfert entre entrepôts",
            lambda: c.post(
                "/api/stock/movements/transfer",
                {
                    "sourceWarehouseId": wid,
                    "destWarehouseId": wid2,
                    "reference": f"TRF-{RUN_TAG}",
                    "operationDate": today(),
                    "lines": [{"productId": pid, "quantity": 5}],
                },
            ),
            write=True,
        )
    else:
        ctx.skip("POST /api/stock/movements/transfer", "transfert entre entrepôts", "un seul entrepôt disponible", write=True)

    ctx.check(
        "POST /api/stock/movements/issue",
        "sortie",
        lambda: c.post(
            "/api/stock/movements/issue",
            {
                "warehouseId": wid,
                "reference": f"ISS-{RUN_TAG}",
                "operationDate": today(),
                "lines": [{"productId": pid, "quantity": 2}],
            },
        ),
        write=True,
    )

    reserved = ctx.check(
        "POST /api/stock/reservations",
        "réservation pour une commande",
        lambda: c.post(
            "/api/stock/reservations",
            {"productId": pid, "warehouseId": wid, "quantity": 1, "reference": f"RES-{RUN_TAG}"},
        ),
        write=True,
    )
    res_id = (reserved.data or {}).get("id") if reserved and reserved.ok else None
    if res_id:
        ctx.check(
            "DELETE /api/stock/reservations/{reservationId}",
            "libération de la réservation",
            lambda: c.delete(f"/api/stock/reservations/{res_id}"),
            write=True,
        )
    else:
        ctx.skip("DELETE /api/stock/reservations/{reservationId}", "libération de la réservation", "aucune réservation créée", write=True)


@suite("stock-import", "Imports de stock (/api/stock/import)", order=34)
def stock_imports(ctx: Context) -> None:
    c = ctx.client

    templates = {
        "categories": "modèle de catégories",
        "warehouses": "modèle d'entrepôts",
        "products": "modèle de produits",
    }
    for kind, label in templates.items():
        ctx.check(
            f"GET /api/stock/import/{kind}/template",
            label,
            lambda k=kind: c.get(f"/api/stock/import/{k}/template", expect_binary=True),
        )

    # Preview writes nothing, so it is safe outside write mode.
    csv = b"name,description\nCategorie test import,ligne generee par la suite\n"
    ctx.check(
        "POST /api/stock/import/categories/preview",
        "prévisualisation d'un import (aucune écriture)",
        lambda: c.post("/api/stock/import/categories/preview", multipart=("file", "categories.csv", csv)),
    )
    for kind in ("categories", "warehouses", "products"):
        ctx.skip(f"POST /api/stock/import/{kind}", "import réel", "écrirait des lignes en masse", write=True)
    for kind in ("warehouses", "products"):
        ctx.skip(f"POST /api/stock/import/{kind}/preview", "prévisualisation", "couverte par l'import de catégories")


@suite("customer-import", "Import de clients (/api/customers/import)", order=41)
def customer_imports(ctx: Context) -> None:
    c = ctx.client
    ctx.check(
        "GET /api/customers/import/template",
        "modèle de clients",
        lambda: c.get("/api/customers/import/template", expect_binary=True),
    )
    csv = b"name,type,email\nClient test import,COMPANY,import@example.test\n"
    ctx.check(
        "POST /api/customers/import/preview",
        "prévisualisation (aucune écriture)",
        lambda: c.post("/api/customers/import/preview", multipart=("file", "customers.csv", csv)),
    )
    ctx.skip("POST /api/customers/import", "import réel", "écrirait des clients en masse", write=True)
