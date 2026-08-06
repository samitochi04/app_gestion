"""erp-supplier — fournisseurs, commandes d'achat, factures et avoirs d'achat.

Not surfaced by the Angular sidebar today, but the endpoints exist and the
purchase flow feeds the accounting entries, so the suite covers them.
"""

from __future__ import annotations

import uuid

from ..runner import Context, suite
from ._shared import RUN_TAG, days_ahead, tag, today


@suite("suppliers", "Fournisseurs (/api/suppliers)", order=80)
def suppliers(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/suppliers", "liste paginée", lambda: c.get("/api/suppliers", {"page": 0, "size": 20}))
    if res and res.ok:
        first = ctx.first(res.data)
        if first:
            ctx.remember("supplierId", first.get("id"))

    created = ctx.check(
        "POST /api/suppliers",
        "création",
        lambda: c.post(
            "/api/suppliers",
            {
                "name": tag("Fournisseur"),
                "email": f"apitest-{uuid.uuid4().hex[:8]}@example.test",
                "phone": "+237600000001",
                "city": "Douala",
                "country": "Cameroun",
                "paymentTermDays": 30,
            },
        ),
        write=True,
    )
    sid = (created.data or {}).get("id") if created and created.ok else None
    if sid:
        ctx.remember("supplierId", sid)
        ctx.check("GET /api/suppliers/{id}", "détail", lambda: c.get(f"/api/suppliers/{sid}"))
        ctx.check(
            "PUT /api/suppliers/{id}",
            "modification",
            lambda: c.put(f"/api/suppliers/{sid}", {"name": tag("Fournisseur"), "city": "Yaoundé", "paymentTermDays": 45}),
            write=True,
        )
        ctx.check(
            "POST /api/suppliers/{id}/deactivate",
            "désactivation (jamais de suppression)",
            lambda: c.post(f"/api/suppliers/{sid}/deactivate"),
            write=True,
        )
    else:
        existing = ctx.recall("supplierId")
        if existing:
            ctx.check("GET /api/suppliers/{id}", "détail", lambda: c.get(f"/api/suppliers/{existing}"))
        else:
            ctx.skip("GET /api/suppliers/{id}", "détail", "aucun fournisseur en base")
        ctx.skip("PUT /api/suppliers/{id}", "modification", "aucun fournisseur de test créé", write=True)
        ctx.skip("POST /api/suppliers/{id}/deactivate", "désactivation", "aucun fournisseur de test créé", write=True)


@suite("purchase-orders", "Commandes d'achat (/api/purchase-orders)", order=81)
def purchase_orders(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/purchase-orders", "liste paginée", lambda: c.get("/api/purchase-orders", {"page": 0, "size": 20}))

    sid, pid, wid = ctx.recall("supplierId"), ctx.recall("productId"), ctx.recall("warehouseId")
    if not (sid and pid):
        for ep, label in (
            ("POST /api/purchase-orders", "création"),
            ("GET /api/purchase-orders/{id}", "détail"),
            ("POST /api/purchase-orders/{id}/confirm", "confirmation"),
            ("POST /api/purchase-orders/{id}/invoice", "facturation depuis la commande"),
            ("POST /api/purchase-orders/{id}/cancel", "annulation"),
        ):
            ctx.skip(ep, label, "fournisseur ou produit indisponible", write=True)
        return

    created = ctx.check(
        "POST /api/purchase-orders",
        "création",
        lambda: c.post(
            "/api/purchase-orders",
            {
                "supplierId": sid,
                "orderDate": today(),
                "expectedDate": days_ahead(15),
                "warehouseId": wid,
                "notes": f"Commande d'achat {RUN_TAG}",
                "lines": [
                    {
                        "nature": "GOODS",
                        "productId": pid,
                        "designation": ctx.recall("productName") or "Produit",
                        "quantity": 10,
                        "unitPrice": 1000,
                        "discount": 0,
                        "vatRate": 19.25,
                    }
                ],
            },
        ),
        write=True,
    )
    po_id = (created.data or {}).get("id") if created and created.ok else None
    if not po_id:
        for ep, label in (
            ("GET /api/purchase-orders/{id}", "détail"),
            ("POST /api/purchase-orders/{id}/confirm", "confirmation"),
            ("POST /api/purchase-orders/{id}/invoice", "facturation depuis la commande"),
            ("POST /api/purchase-orders/{id}/cancel", "annulation"),
        ):
            ctx.skip(ep, label, "aucune commande d'achat de test créée", write=True)
        return

    ctx.check("GET /api/purchase-orders/{id}", "détail", lambda: c.get(f"/api/purchase-orders/{po_id}"))
    ctx.check("POST /api/purchase-orders/{id}/confirm", "confirmation", lambda: c.post(f"/api/purchase-orders/{po_id}/confirm"), write=True)
    invoiced = ctx.check(
        "POST /api/purchase-orders/{id}/invoice",
        "facturation depuis la commande",
        lambda: c.post(
            f"/api/purchase-orders/{po_id}/invoice",
            params={"supplierInvoiceNumber": f"FA-{RUN_TAG}", "issueDate": today()},
        ),
        accept=("NOTHING_RECEIVED", "PURCHASE_ORDER_NOT_RECEIVED", 400),
        write=True,
    )
    if invoiced and invoiced.ok and isinstance(invoiced.data, dict):
        ctx.remember("supplierInvoiceId", invoiced.data.get("id"))
    ctx.check(
        "POST /api/purchase-orders/{id}/cancel",
        "annulation",
        lambda: c.post(f"/api/purchase-orders/{po_id}/cancel"),
        accept=("PURCHASE_ORDER_NOT_CANCELLABLE", 400),
        write=True,
    )


@suite("supplier-invoices", "Factures fournisseur (/api/supplier-invoices)", order=82)
def supplier_invoices(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/supplier-invoices", "liste paginée", lambda: c.get("/api/supplier-invoices", {"page": 0, "size": 20}))
    if res and res.ok and not ctx.recall("supplierInvoiceId"):
        first = ctx.first(res.data)
        if first:
            ctx.remember("supplierInvoiceId", first.get("id"))

    sid, pid = ctx.recall("supplierId"), ctx.recall("productId")
    if sid and pid:
        created = ctx.check(
            "POST /api/supplier-invoices",
            "saisie directe",
            lambda: c.post(
                "/api/supplier-invoices",
                {
                    "supplierId": sid,
                    "supplierInvoiceNumber": f"DIR-{RUN_TAG}",
                    "issueDate": today(),
                    "dueDate": days_ahead(30),
                    "notes": "Facture fournisseur de test",
                    "lines": [
                        {
                            "nature": "GOODS",
                            "productId": pid,
                            "designation": ctx.recall("productName") or "Produit",
                            "quantity": 5,
                            "unitPrice": 1000,
                            "discount": 0,
                            "vatRate": 19.25,
                        }
                    ],
                },
            ),
            write=True,
        )
        if created and created.ok and isinstance(created.data, dict):
            ctx.remember("supplierInvoiceId", created.data.get("id"))
    else:
        ctx.skip("POST /api/supplier-invoices", "saisie directe", "fournisseur ou produit indisponible", write=True)

    inv_id = ctx.recall("supplierInvoiceId")
    if not inv_id:
        for ep, label in (
            ("GET /api/supplier-invoices/{id}", "détail"),
            ("GET /api/supplier-invoices/{id}/payments", "règlements"),
        ):
            ctx.skip(ep, label, "aucune facture fournisseur en base")
        for ep, label in (
            ("POST /api/supplier-invoices/{id}/validate", "validation"),
            ("POST /api/supplier-invoices/{id}/cancel", "annulation"),
            ("POST /api/supplier-invoices/payments", "règlement"),
            ("POST /api/supplier-invoices/payments/refund", "remboursement"),
        ):
            ctx.skip(ep, label, "aucune facture fournisseur en base", write=True)
        return

    ctx.check("GET /api/supplier-invoices/{id}", "détail", lambda: c.get(f"/api/supplier-invoices/{inv_id}"))
    ctx.check("GET /api/supplier-invoices/{id}/payments", "règlements", lambda: c.get(f"/api/supplier-invoices/{inv_id}/payments"))
    ctx.check(
        "POST /api/supplier-invoices/{id}/validate",
        "validation",
        lambda: c.post(f"/api/supplier-invoices/{inv_id}/validate"),
        accept=("SUPPLIER_INVOICE_NOT_DRAFT", 400),
        write=True,
    )
    ctx.check(
        "POST /api/supplier-invoices/{id}/cancel",
        "annulation d'une facture validée → refus attendu",
        lambda: c.post(f"/api/supplier-invoices/{inv_id}/cancel", params={"reason": "test"}),
        accept=("SUPPLIER_INVOICE_NOT_DRAFT", "SUPPLIER_INVOICE_NOT_CANCELLABLE", 400),
        write=True,
    )

    paid = ctx.check(
        "POST /api/supplier-invoices/payments",
        "règlement",
        lambda: c.post(
            "/api/supplier-invoices/payments",
            {"invoiceId": inv_id, "amount": 100, "method": "BANK_TRANSFER", "reference": f"RGL-{RUN_TAG}"},
        ),
        accept=("SUPPLIER_INVOICE_NOT_VALIDATED", 400),
        write=True,
    )
    pay_id = (paid.data or {}).get("id") if paid and paid.ok and isinstance(paid.data, dict) else None
    if pay_id:
        ctx.check(
            "POST /api/supplier-invoices/payments/refund",
            "remboursement",
            lambda: c.post(
                "/api/supplier-invoices/payments/refund",
                {"paymentId": pay_id, "amount": 50, "method": "BANK_TRANSFER", "reason": "Test API"},
            ),
            write=True,
        )
    else:
        ctx.skip("POST /api/supplier-invoices/payments/refund", "remboursement", "aucun règlement enregistré", write=True)


@suite("supplier-credit-notes", "Avoirs fournisseur (/api/supplier-credit-notes)", order=83)
def supplier_credit_notes(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/supplier-credit-notes", "liste paginée", lambda: c.get("/api/supplier-credit-notes", {"page": 0, "size": 20}))

    inv_id, pid = ctx.recall("supplierInvoiceId"), ctx.recall("productId")
    if not (inv_id and pid):
        ctx.skip("POST /api/supplier-credit-notes", "création", "aucune facture fournisseur validée", write=True)
        ctx.skip("POST /api/supplier-credit-notes/{id}/validate", "validation", "aucune facture fournisseur validée", write=True)
        return

    created = ctx.check(
        "POST /api/supplier-credit-notes",
        "création (nature FINANCIAL)",
        lambda: c.post(
            "/api/supplier-credit-notes",
            {
                "invoiceId": inv_id,
                "supplierCreditNoteNumber": f"AVF-{RUN_TAG}",
                "kind": "FINANCIAL",
                "reason": "Remise commerciale de test",
                "lines": [
                    {
                        "nature": "GOODS",
                        "productId": pid,
                        "designation": ctx.recall("productName") or "Produit",
                        "quantity": 1,
                        "unitPrice": 1000,
                        "discount": 0,
                        "vatRate": 19.25,
                    }
                ],
            },
        ),
        accept=("SUPPLIER_INVOICE_NOT_VALIDATED", 400),
        write=True,
    )
    cn_id = (created.data or {}).get("id") if created and created.ok and isinstance(created.data, dict) else None
    if cn_id:
        ctx.check(
            "POST /api/supplier-credit-notes/{id}/validate",
            "validation",
            lambda: c.post(f"/api/supplier-credit-notes/{cn_id}/validate"),
            write=True,
        )
    else:
        ctx.skip("POST /api/supplier-credit-notes/{id}/validate", "validation", "aucun avoir de test créé", write=True)
