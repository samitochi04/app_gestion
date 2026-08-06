"""erp-billing — pro formas, factures, avoirs, encaissements, échéanciers.

A sales invoice is never created directly: it is born from a shipped order
(`OrderShippedEvent`) or from a converted pro forma. The suite therefore picks
up the invoice the sales suite caused to exist, or falls back to the newest
draft already in the database.
"""

from __future__ import annotations

import time

from ..runner import Context, suite
from ._shared import RUN_TAG, days_ahead, tag


def _pick_invoice(ctx: Context, statuses: tuple[str, ...]) -> dict | None:
    """Newest invoice in one of `statuses`, or None."""
    res = ctx.client.get("/api/invoices", {"page": 0, "size": 50})
    if not res.ok:
        return None
    for item in (res.data or {}).get("content") or []:
        if item.get("status") in statuses:
            return item
    return None


@suite("proformas", "Pro formas (/api/pro-formas)", order=50)
def proformas(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/pro-formas", "liste paginée", lambda: c.get("/api/pro-formas", {"page": 0, "size": 20}))

    cid, pid = ctx.recall("customerId"), ctx.recall("productId")
    if not (cid and pid):
        for ep, label in (
            ("POST /api/pro-formas", "création"),
            ("PUT /api/pro-formas/{id}", "modification"),
            ("GET /api/pro-formas/{id}/pdf", "téléchargement PDF"),
            ("POST /api/pro-formas/{id}/send", "envoi par courriel"),
            ("POST /api/pro-formas/{id}/convert", "conversion en facture"),
        ):
            ctx.skip(ep, label, "client ou produit indisponible", write=True)
        return

    line = {
        "productId": pid,
        "productName": ctx.recall("productName") or "Produit",
        "quantity": 1,
        "unitPrice": float(ctx.recall("productSalePrice") or 1500),
        "discount": 0,
        "vatRate": 19.25,
    }
    created = ctx.check(
        "POST /api/pro-formas",
        "création",
        lambda: c.post(
            "/api/pro-formas",
            {
                "customerId": cid,
                "customerName": ctx.recall("customerName") or "Client",
                "validUntil": days_ahead(30),
                "notes": f"Pro forma {RUN_TAG}",
                "lines": [line],
            },
        ),
        write=True,
    )
    pf_id = (created.data or {}).get("id") if created and created.ok else None
    if not pf_id:
        for ep, label in (
            ("PUT /api/pro-formas/{id}", "modification"),
            ("GET /api/pro-formas/{id}/pdf", "téléchargement PDF"),
            ("POST /api/pro-formas/{id}/send", "envoi par courriel"),
            ("POST /api/pro-formas/{id}/convert", "conversion en facture"),
        ):
            ctx.skip(ep, label, "aucune pro forma de test créée", write=True)
        return

    ctx.check(
        "PUT /api/pro-formas/{id}",
        "modification",
        lambda: c.put(f"/api/pro-formas/{pf_id}", {"validUntil": days_ahead(60), "notes": "Modifiée", "lines": [line]}),
        write=True,
    )
    ctx.check("GET /api/pro-formas/{id}/pdf", "téléchargement PDF", lambda: c.get(f"/api/pro-formas/{pf_id}/pdf", expect_binary=True))
    ctx.skip("POST /api/pro-formas/{id}/send", "envoi par courriel", "enverrait un vrai courriel", write=True)
    converted = ctx.check(
        "POST /api/pro-formas/{id}/convert",
        "conversion en facture",
        lambda: c.post(f"/api/pro-formas/{pf_id}/convert", params={"dueDate": days_ahead(30)}),
        write=True,
    )
    if converted and converted.ok and isinstance(converted.data, dict):
        ctx.remember("invoiceId", converted.data.get("id"))


@suite("invoices", "Factures (/api/invoices)", order=51)
def invoices(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/invoices", "liste paginée", lambda: c.get("/api/invoices", {"page": 0, "size": 20}))
    if res and res.ok and not ctx.recall("invoiceId"):
        first = ctx.first(res.data)
        if first:
            ctx.remember("invoiceId", first.get("id"))
    ctx.check("GET /api/invoices", "filtre par statut", lambda: c.get("/api/invoices", {"page": 0, "size": 5, "status": "DRAFT"}))

    # The order suite ships an order; billing reacts asynchronously (@Async +
    # AFTER_COMMIT), so the draft invoice may not exist for a beat.
    if ctx.write_mode and ctx.recall("shippedOrderId"):
        for _ in range(6):
            draft = _pick_invoice(ctx, ("DRAFT",))
            if draft:
                ctx.remember("draftInvoiceId", draft.get("id"))
                ctx.remember("invoiceId", draft.get("id"))
                break
            time.sleep(1)

    inv_id = ctx.recall("invoiceId")
    if not inv_id:
        for ep, label in (
            ("GET /api/invoices/{id}", "détail"),
            ("GET /api/invoices/{id}/pdf", "téléchargement PDF"),
            ("GET /api/invoices/{id}/payments", "encaissements de la facture"),
            ("GET /api/invoices/{id}/schedule", "échéancier"),
        ):
            ctx.skip(ep, label, "aucune facture en base")
        for ep, label in (
            ("PUT /api/invoices/{id}", "modification d'un brouillon"),
            ("POST /api/invoices/{id}/validate", "validation"),
            ("POST /api/invoices/{id}/send", "envoi par courriel"),
            ("POST /api/invoices/{id}/cancel", "annulation"),
            ("POST /api/invoices/payments", "encaissement"),
            ("POST /api/invoices/payments/refund", "remboursement"),
            ("POST /api/invoices/schedules", "création d'un échéancier"),
            ("POST /api/invoices/schedules/installments", "règlement d'une échéance"),
        ):
            ctx.skip(ep, label, "aucune facture en base", write=True)
        return

    ctx.check("GET /api/invoices/{id}", "détail", lambda: c.get(f"/api/invoices/{inv_id}"))
    ctx.check("GET /api/invoices/{id}/pdf", "téléchargement PDF", lambda: c.get(f"/api/invoices/{inv_id}/pdf", expect_binary=True))
    ctx.check("GET /api/invoices/{id}/payments", "encaissements de la facture", lambda: c.get(f"/api/invoices/{inv_id}/payments"))
    ctx.check(
        "GET /api/invoices/{id}/schedule",
        "échéancier (absent si jamais créé)",
        lambda: c.get(f"/api/invoices/{inv_id}/schedule"),
        accept=("SCHEDULE_NOT_FOUND", "PAYMENT_SCHEDULE_NOT_FOUND", 404),
    )

    draft_id = ctx.recall("draftInvoiceId")
    if not draft_id:
        for ep, label in (
            ("PUT /api/invoices/{id}", "modification d'un brouillon"),
            ("POST /api/invoices/{id}/validate", "validation"),
            ("POST /api/invoices/{id}/send", "envoi par courriel"),
            ("POST /api/invoices/{id}/cancel", "annulation"),
            ("POST /api/invoices/payments", "encaissement"),
            ("POST /api/invoices/payments/refund", "remboursement"),
            ("POST /api/invoices/schedules", "création d'un échéancier"),
            ("POST /api/invoices/schedules/installments", "règlement d'une échéance"),
        ):
            ctx.skip(ep, label, "aucun brouillon issu d'une commande expédiée", write=True)
        return

    ctx.check(
        "PUT /api/invoices/{id}",
        "modification d'un brouillon",
        lambda: c.put(f"/api/invoices/{draft_id}", {"dueDate": days_ahead(30), "notes": f"Facture {RUN_TAG}"}),
        write=True,
    )
    ctx.check("POST /api/invoices/{id}/validate", "validation", lambda: c.post(f"/api/invoices/{draft_id}/validate"), write=True)
    ctx.skip("POST /api/invoices/{id}/send", "envoi par courriel", "enverrait un vrai courriel", write=True)
    ctx.check(
        "POST /api/invoices/{id}/cancel",
        "annulation d'une facture validée → refus attendu",
        lambda: c.post(f"/api/invoices/{draft_id}/cancel", params={"reason": "test"}),
        accept=("INVOICE_NOT_DRAFT", "INVOICE_NOT_CANCELLABLE", 400),
        write=True,
    )

    detail = c.get(f"/api/invoices/{draft_id}")
    total = float((detail.data or {}).get("totalAmountTTC") or 0) if detail.ok else 0.0
    part = round(total / 2, 2) if total else 1000.0

    paid = ctx.check(
        "POST /api/invoices/payments",
        "encaissement partiel",
        lambda: c.post(
            "/api/invoices/payments",
            {"invoiceId": draft_id, "amount": part, "method": "CASH", "reference": f"PAY-{RUN_TAG}", "notes": "Test API"},
        ),
        write=True,
    )
    pay_id = (paid.data or {}).get("id") if paid and paid.ok else None
    if pay_id:
        ctx.remember("paymentId", pay_id)
        ctx.check(
            "POST /api/invoices/payments/refund",
            "remboursement",
            lambda: c.post(
                "/api/invoices/payments/refund",
                {"paymentId": pay_id, "amount": min(part, 100.0), "method": "CASH", "reference": f"REF-{RUN_TAG}", "reason": "Test API"},
            ),
            write=True,
        )
    else:
        ctx.skip("POST /api/invoices/payments/refund", "remboursement", "aucun encaissement enregistré", write=True)

    schedule = ctx.check(
        "POST /api/invoices/schedules",
        "création d'un échéancier",
        lambda: c.post(
            "/api/invoices/schedules",
            {
                "invoiceId": draft_id,
                "installments": [
                    {"dueDate": days_ahead(30), "amount": max(part, 1.0)},
                    {"dueDate": days_ahead(60), "amount": max(part, 1.0)},
                ],
            },
        ),
        accept=("SCHEDULE_ALREADY_EXISTS", "PAYMENT_SCHEDULE_EXISTS", "SCHEDULE_AMOUNT_MISMATCH", 400),
        write=True,
    )
    installments = ((schedule.data or {}) if schedule and schedule.ok else {}).get("installments") or []
    if installments:
        first = installments[0]
        ctx.check(
            "POST /api/invoices/schedules/installments",
            "règlement d'une échéance",
            lambda: c.post(
                "/api/invoices/schedules/installments",
                {
                    "invoiceId": draft_id,
                    "installmentId": first.get("id"),
                    "amount": float(first.get("amount") or 1),
                    "method": "BANK_TRANSFER",
                    "reference": f"ECH-{RUN_TAG}",
                },
            ),
            write=True,
        )
    else:
        ctx.skip("POST /api/invoices/schedules/installments", "règlement d'une échéance", "aucun échéancier créé", write=True)


@suite("credit-notes", "Avoirs clients (/api/credit-notes)", order=52)
def credit_notes(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/credit-notes", "liste paginée", lambda: c.get("/api/credit-notes", {"page": 0, "size": 20}))

    target = _pick_invoice(ctx, ("VALIDATED", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE"))
    pid = ctx.recall("productId")
    if not (target and pid):
        for ep, label in (
            ("POST /api/credit-notes", "création"),
            ("POST /api/credit-notes/{id}/validate", "validation"),
            ("POST /api/credit-notes/{id}/send", "envoi par courriel"),
        ):
            ctx.skip(ep, label, "aucune facture validée à créditer", write=True)
        return

    inv_id = target.get("id")
    lines = target.get("lines") or []
    line = {
        "productId": (lines[0].get("productId") if lines else pid),
        "productName": (lines[0].get("productName") if lines else ctx.recall("productName")) or "Produit",
        "quantity": 1,
        "unitPrice": float((lines[0].get("unitPrice") if lines else ctx.recall("productSalePrice")) or 1000),
        "discount": 0,
        "vatRate": float((lines[0].get("vatRate") if lines else 19.25) or 0),
    }

    created = ctx.check(
        "POST /api/credit-notes",
        "création (type PARTIAL, kind FINANCIAL)",
        lambda: c.post(
            "/api/credit-notes",
            {"invoiceId": inv_id, "type": "PARTIAL", "kind": "FINANCIAL", "reason": tag("Avoir"), "lines": [line]},
        ),
        write=True,
    )
    cn_id = (created.data or {}).get("id") if created and created.ok else None
    if cn_id:
        ctx.check(
            "POST /api/credit-notes/{id}/validate",
            "validation",
            lambda: c.post(f"/api/credit-notes/{cn_id}/validate"),
            write=True,
        )
    else:
        ctx.skip("POST /api/credit-notes/{id}/validate", "validation", "aucun avoir de test créé", write=True)
    ctx.skip("POST /api/credit-notes/{id}/send", "envoi par courriel", "enverrait un vrai courriel", write=True)
