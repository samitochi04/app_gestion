"""erp-sales — clients, devis, commandes.

The order suite walks the whole order-to-cash chain up to shipping, because
that is what makes a sales invoice exist: there is no `POST /api/invoices`.
"""

from __future__ import annotations

import uuid

from ..runner import Context, suite
from ._shared import RUN_TAG, days_ahead, tag


@suite("customers", "Clients (/api/customers)", order=40)
def customers(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/customers", "liste paginée", lambda: c.get("/api/customers", {"page": 0, "size": 20}))
    if res and res.ok:
        first = ctx.first(res.data)
        if first:
            ctx.remember("customerId", first.get("id"))
            ctx.remember("customerName", first.get("name"))
    ctx.check("GET /api/customers", "recherche plein texte", lambda: c.get("/api/customers", {"page": 0, "size": 5, "query": "a"}))

    created = ctx.check(
        "POST /api/customers",
        "création",
        lambda: c.post(
            "/api/customers",
            {
                "name": tag("Client"),
                "type": "COMPANY",
                "email": f"apitest-{uuid.uuid4().hex[:8]}@example.test",
                "phone": "+237600000000",
                "street": "Rue de test",
                "city": "Douala",
                "country": "Cameroun",
            },
        ),
        write=True,
    )
    cid = (created.data or {}).get("id") if created and created.ok else None
    if cid:
        ctx.remember("customerId", cid)
        ctx.remember("customerName", tag("Client"))
        ctx.check(
            "PUT /api/customers/{id}",
            "modification",
            lambda: c.put(f"/api/customers/{cid}", {"name": tag("Client"), "city": "Yaoundé"}),
            write=True,
        )
    else:
        ctx.skip("PUT /api/customers/{id}", "modification", "aucun client de test créé", write=True)

    # DELETE is deliberately not exercised: a customer is referenced by orders
    # and journal lines, and the backend refuses (or soft-deletes) accordingly.
    ctx.skip("DELETE /api/customers/{id}", "suppression", "laisserait des documents orphelins", write=True)


@suite("quotes", "Devis (/api/quotes)", order=42)
def quotes(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/quotes", "liste paginée", lambda: c.get("/api/quotes", {"page": 0, "size": 20}))
    ctx.check("GET /api/quotes", "filtre par statut", lambda: c.get("/api/quotes", {"page": 0, "size": 5, "status": "DRAFT"}))

    cid, pid = ctx.recall("customerId"), ctx.recall("productId")
    if not (cid and pid):
        for ep, label in (
            ("POST /api/quotes", "création"),
            ("PUT /api/quotes/{id}", "modification"),
            ("POST /api/quotes/{id}/send", "envoi"),
            ("POST /api/quotes/{id}/convert", "conversion en commande"),
        ):
            ctx.skip(ep, label, "client ou produit indisponible", write=True)
        return

    line = {
        "productId": pid,
        "productName": ctx.recall("productName") or "Produit",
        "quantity": 2,
        "unitSalePrice": float(ctx.recall("productSalePrice") or 1500),
        "discount": 0,
        "vatRate": 19.25,
    }
    created = ctx.check(
        "POST /api/quotes",
        "création",
        lambda: c.post(
            "/api/quotes",
            {"customerId": cid, "validUntil": days_ahead(30), "notes": f"Devis {RUN_TAG}", "lines": [line]},
        ),
        write=True,
    )
    qid = (created.data or {}).get("id") if created and created.ok else None
    if not qid:
        for ep, label in (
            ("PUT /api/quotes/{id}", "modification"),
            ("POST /api/quotes/{id}/send", "envoi"),
            ("POST /api/quotes/{id}/convert", "conversion en commande"),
        ):
            ctx.skip(ep, label, "aucun devis de test créé", write=True)
        return

    ctx.check(
        "PUT /api/quotes/{id}",
        "modification des lignes",
        lambda: c.put(f"/api/quotes/{qid}", {"validUntil": days_ahead(45), "notes": "Devis modifié", "lines": [line]}),
        write=True,
    )
    ctx.check("POST /api/quotes/{id}/send", "passage à SENT", lambda: c.post(f"/api/quotes/{qid}/send"), write=True)
    converted = ctx.check(
        "POST /api/quotes/{id}/convert",
        "conversion en commande",
        lambda: c.post(
            f"/api/quotes/{qid}/convert",
            {"street": "Rue de test", "city": "Douala", "postalCode": "00000", "country": "Cameroun"},
        ),
        write=True,
    )
    if converted and converted.ok and isinstance(converted.data, dict):
        ctx.remember("orderId", converted.data.get("id"))


@suite("orders", "Commandes (/api/orders)", order=43)
def orders(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/orders", "liste paginée", lambda: c.get("/api/orders", {"page": 0, "size": 20}))
    ctx.check("GET /api/orders", "filtre par statut", lambda: c.get("/api/orders", {"page": 0, "size": 5, "status": "DRAFT"}))

    cid, pid, wid = ctx.recall("customerId"), ctx.recall("productId"), ctx.recall("warehouseId")
    if not (cid and pid):
        for ep, label in (
            ("POST /api/orders", "création"),
            ("PUT /api/orders/{id}", "modification"),
            ("POST /api/orders/{id}/confirm", "confirmation (réserve le stock)"),
            ("POST /api/orders/{id}/prepare", "préparation"),
            ("POST /api/orders/{id}/ship", "expédition (crée la facture)"),
            ("POST /api/orders/{id}/deliver", "livraison"),
            ("POST /api/orders/{id}/cancel", "annulation"),
        ):
            ctx.skip(ep, label, "client ou produit indisponible", write=True)
        return

    line = {
        "productId": pid,
        "productName": ctx.recall("productName") or "Produit",
        "quantity": 2,
        "unitSalePrice": float(ctx.recall("productSalePrice") or 1500),
        "discount": 0,
        "vatRate": 19.25,
        "warehouseId": wid,
    }
    created = ctx.check(
        "POST /api/orders",
        "création",
        lambda: c.post(
            "/api/orders",
            {
                "customerId": cid,
                "street": "Rue de test",
                "city": "Douala",
                "postalCode": "00000",
                "country": "Cameroun",
                "notes": f"Commande {RUN_TAG}",
                "lines": [line],
            },
        ),
        write=True,
    )
    oid = (created.data or {}).get("id") if created and created.ok else ctx.recall("orderId")
    if not oid:
        for ep, label in (
            ("PUT /api/orders/{id}", "modification"),
            ("POST /api/orders/{id}/confirm", "confirmation (réserve le stock)"),
            ("POST /api/orders/{id}/prepare", "préparation"),
            ("POST /api/orders/{id}/ship", "expédition (crée la facture)"),
            ("POST /api/orders/{id}/deliver", "livraison"),
            ("POST /api/orders/{id}/cancel", "annulation"),
        ):
            ctx.skip(ep, label, "aucune commande de test créée", write=True)
        return

    ctx.remember("orderId", oid)
    ctx.check(
        "PUT /api/orders/{id}",
        "modification",
        lambda: c.put(f"/api/orders/{oid}", {"notes": "Commande modifiée", "lines": [line]}),
        write=True,
    )
    ctx.check("POST /api/orders/{id}/confirm", "confirmation (réserve le stock)", lambda: c.post(f"/api/orders/{oid}/confirm"), write=True)
    ctx.check("POST /api/orders/{id}/prepare", "préparation", lambda: c.post(f"/api/orders/{oid}/prepare"), write=True)
    shipped = ctx.check("POST /api/orders/{id}/ship", "expédition (crée la facture)", lambda: c.post(f"/api/orders/{oid}/ship"), write=True)
    if shipped and shipped.ok:
        ctx.remember("shippedOrderId", oid)
    ctx.check("POST /api/orders/{id}/deliver", "livraison", lambda: c.post(f"/api/orders/{oid}/deliver"), write=True)
    ctx.check(
        "POST /api/orders/{id}/cancel",
        "annulation d'une commande livrée → refus attendu",
        lambda: c.post(f"/api/orders/{oid}/cancel"),
        accept=("CANNOT_CANCEL_DELIVERED_ORDER", "ORDER_NOT_CANCELLABLE", 400),
        write=True,
    )
