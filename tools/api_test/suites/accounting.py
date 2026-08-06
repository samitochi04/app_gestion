"""erp-accounting — plan OHADA, journal, lettrage, périodes, mappings, inbox.

Several endpoints here take their arguments as query parameters rather than a
JSON body (`POST /chart`, `PUT /chart/{id}`, `POST /periods`, letter/auto):
that asymmetry is the single most common source of 400s against this module.
"""

from __future__ import annotations

import uuid
from datetime import date

from ..runner import Context, suite
from ._shared import RUN_TAG, month_bounds, today, year_start


@suite("chart", "Plan comptable (/api/accounting/chart)", order=60)
def chart(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/accounting/chart", "liste paginée", lambda: c.get("/api/accounting/chart", {"page": 0, "size": 20}))
    if res and res.ok:
        first = ctx.first(res.data)
        if first:
            ctx.remember("accountId", first.get("id"))
            ctx.remember("accountCode", first.get("code"))
    ctx.check(
        "GET /api/accounting/chart",
        "filtre par classe",
        lambda: c.get("/api/accounting/chart", {"page": 0, "size": 5, "accountClass": "CLASSE_4"}),
        accept=(400,),
    )

    acc_id = ctx.recall("accountId")
    if acc_id:
        ctx.check("GET /api/accounting/chart/{id}", "détail d'un compte", lambda: c.get(f"/api/accounting/chart/{acc_id}"))
    else:
        ctx.skip("GET /api/accounting/chart/{id}", "détail d'un compte", "plan comptable vide")

    code = f"9{uuid.uuid4().int % 100000:05d}"[:6]
    created = ctx.check(
        "POST /api/accounting/chart",
        "création (paramètres de requête, pas de corps)",
        lambda: c.post("/api/accounting/chart", params={"code": code, "label": f"Compte {RUN_TAG}", "isParent": "false"}),
        write=True,
    )
    new_id = (created.data or {}).get("id") if created and created.ok else None
    if new_id:
        ctx.check(
            "PUT /api/accounting/chart/{id}",
            "renommage (label en paramètre)",
            lambda: c.put(f"/api/accounting/chart/{new_id}", params={"label": f"Compte {RUN_TAG} (modifié)"}),
            write=True,
        )
        ctx.check(
            "POST /api/accounting/chart/{id}/deactivate",
            "désactivation",
            lambda: c.post(f"/api/accounting/chart/{new_id}/deactivate"),
            write=True,
        )
        ctx.check(
            "POST /api/accounting/chart/{id}/activate",
            "réactivation",
            lambda: c.post(f"/api/accounting/chart/{new_id}/activate"),
            write=True,
        )
    else:
        for ep, label in (
            ("PUT /api/accounting/chart/{id}", "renommage"),
            ("POST /api/accounting/chart/{id}/deactivate", "désactivation"),
            ("POST /api/accounting/chart/{id}/activate", "réactivation"),
        ):
            ctx.skip(ep, label, "aucun compte de test créé", write=True)

    ctx.skip("POST /api/accounting/chart/import", "import du plan comptable", "réécrirait le plan complet", write=True)


@suite("periods", "Périodes comptables (/api/accounting/periods)", order=61)
def periods(ctx: Context) -> None:
    c = ctx.client
    year = date.today().year

    res = ctx.check(
        "GET /api/accounting/periods",
        "périodes de l'exercice (année obligatoire)",
        lambda: c.get("/api/accounting/periods", {"year": year}),
    )
    if res and res.ok and isinstance(res.data, list):
        opened = [p for p in res.data if p.get("status") == "OPEN"]
        if opened:
            ctx.remember("periodId", opened[0].get("id"))
        elif res.data:
            ctx.remember("periodId", res.data[0].get("id"))
        ctx.remember("existingPeriodMonths", {p.get("month") for p in res.data})

    # December of the year after next is safe: no document can land there.
    spare_year, spare_month = year + 2, 12
    start, end = month_bounds(spare_year, spare_month)
    created = ctx.check(
        "POST /api/accounting/periods",
        "création (paramètres de requête)",
        lambda: c.post(
            "/api/accounting/periods",
            params={"year": spare_year, "month": spare_month, "startDate": start, "endDate": end},
        ),
        accept=("PERIOD_ALREADY_EXISTS", "ACCOUNTING_PERIOD_EXISTS", 409),
        write=True,
    )
    pid = (created.data or {}).get("id") if created and created.ok else None
    if pid:
        ctx.check("POST /api/accounting/periods/{id}/close", "clôture", lambda: c.post(f"/api/accounting/periods/{pid}/close"), write=True)
        ctx.check("POST /api/accounting/periods/{id}/reopen", "réouverture", lambda: c.post(f"/api/accounting/periods/{pid}/reopen"), write=True)
    else:
        ctx.skip("POST /api/accounting/periods/{id}/close", "clôture", "aucune période de test créée", write=True)
        ctx.skip("POST /api/accounting/periods/{id}/reopen", "réouverture", "aucune période de test créée", write=True)


@suite("journal", "Journal et lettrage (/api/accounting/journal)", order=62)
def journal(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/accounting/journal", "liste paginée", lambda: c.get("/api/accounting/journal", {"page": 0, "size": 20}))
    entry_id = None
    if res and res.ok:
        first = ctx.first(res.data)
        if first:
            entry_id = first.get("id")
            ctx.remember("journalEntryId", entry_id)
    ctx.check(
        "GET /api/accounting/journal",
        "filtre par type de journal",
        lambda: c.get("/api/accounting/journal", {"page": 0, "size": 5, "journalType": "VENTES"}),
    )

    if entry_id:
        ctx.check("GET /api/accounting/journal/{id}", "détail d'une écriture", lambda: c.get(f"/api/accounting/journal/{entry_id}"))
    else:
        ctx.skip("GET /api/accounting/journal/{id}", "détail d'une écriture", "aucune écriture en base")

    period_id, code = ctx.recall("periodId"), ctx.recall("accountCode") or "471"
    if period_id:
        od = ctx.check(
            "POST /api/accounting/journal/od",
            "saisie d'une opération diverse équilibrée",
            lambda: c.post(
                "/api/accounting/journal/od",
                {
                    "periodId": period_id,
                    "entryDate": today(),
                    "description": f"OD {RUN_TAG}",
                    "lines": [
                        {"accountCode": code, "label": "Débit de test", "debit": 1000, "credit": 0},
                        {"accountCode": code, "label": "Crédit de test", "debit": 0, "credit": 1000},
                    ],
                },
            ),
            write=True,
        )
        od_id = (od.data or {}).get("id") if od and od.ok else None
        if od_id:
            ctx.check(
                "POST /api/accounting/journal/{id}/reverse",
                "contre-passation",
                lambda: c.post(f"/api/accounting/journal/{od_id}/reverse"),
                write=True,
            )
        else:
            ctx.skip("POST /api/accounting/journal/{id}/reverse", "contre-passation", "aucune OD de test créée", write=True)
    else:
        ctx.skip("POST /api/accounting/journal/od", "saisie d'une opération diverse", "aucune période ouverte", write=True)
        ctx.skip("POST /api/accounting/journal/{id}/reverse", "contre-passation", "aucune période ouverte", write=True)

    ctx.check(
        "GET /api/accounting/journal/letterings",
        "lettrages d'un compte",
        lambda: c.get("/api/accounting/journal/letterings", {"accountCode": "411"}),
    )
    ctx.check(
        "POST /api/accounting/journal/letter/auto",
        "lettrage automatique du 411",
        lambda: c.post("/api/accounting/journal/letter/auto", params={"accountCode": "411", "from": year_start(), "to": today()}),
        write=True,
    )
    ctx.skip("POST /api/accounting/journal/letter/manual", "lettrage manuel", "exige des lignes non lettrées choisies à la main", write=True)
    ctx.skip("DELETE /api/accounting/journal/letter/{id}", "délettrage", "dépend d'un lettrage manuel", write=True)


@suite("accounting-reports", "États comptables", order=63)
def reports(ctx: Context) -> None:
    c = ctx.client
    ctx.check(
        "GET /api/accounting/balance",
        "balance générale",
        lambda: c.get("/api/accounting/balance", {"from": year_start(), "to": today()}),
    )
    ctx.check(
        "GET /api/accounting/grand-livre",
        "grand livre",
        lambda: c.get("/api/accounting/grand-livre", {"from": year_start(), "to": today()}),
    )
    ctx.check(
        "GET /api/accounting/grand-livre",
        "grand livre filtré sur un compte",
        lambda: c.get("/api/accounting/grand-livre", {"from": year_start(), "to": today(), "accountCode": "411"}),
    )


@suite("mappings", "Correspondances de comptes (/api/accounting/mappings)", order=64)
def mappings(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/accounting/mappings", "liste complète", lambda: c.get("/api/accounting/mappings"))
    ctx.check(
        "GET /api/accounting/mappings",
        "filtre par type d'entité",
        lambda: c.get("/api/accounting/mappings", {"entityType": "PRODUCT"}),
    )
    ctx.check(
        "GET /api/accounting/mappings/resolve",
        "résolution (défaut → 701)",
        lambda: c.get("/api/accounting/mappings/resolve", {"entityType": "PRODUCT", "accountType": "REVENUE"}),
    )

    created = ctx.check(
        "PUT /api/accounting/mappings",
        "création/mise à jour d'une correspondance",
        lambda: c.put(
            "/api/accounting/mappings",
            {
                "entityType": "PRODUCT",
                "entityId": str(ctx.recall("productId") or 0),
                "accountType": "REVENUE",
                "accountCode": "701",
                "label": f"Mapping {RUN_TAG}",
            },
        ),
        write=True,
    )
    map_id = (created.data or {}).get("id") if created and created.ok else None
    if map_id:
        ctx.check(
            "DELETE /api/accounting/mappings/{id}",
            "suppression",
            lambda: c.delete(f"/api/accounting/mappings/{map_id}"),
            write=True,
        )
    else:
        ctx.skip("DELETE /api/accounting/mappings/{id}", "suppression", "aucune correspondance de test créée", write=True)


@suite("inbox", "Inbox comptable (/api/accounting/inbox)", order=65)
def inbox(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/accounting/inbox", "liste paginée", lambda: c.get("/api/accounting/inbox", {"page": 0, "size": 20}))
    ctx.check("GET /api/accounting/inbox/summary", "compteurs par état", lambda: c.get("/api/accounting/inbox/summary"))
    ctx.check(
        "GET /api/accounting/inbox",
        "filtre sur les événements en échec",
        lambda: c.get("/api/accounting/inbox", {"page": 0, "size": 5, "status": "FAILED"}),
    )

    failed_id = None
    if res and res.ok:
        for item in (res.data or {}).get("content") or []:
            if item.get("status") == "FAILED":
                failed_id = item.get("id")
                break
    if failed_id:
        ctx.check(
            "POST /api/accounting/inbox/{id}/retry",
            "rejeu d'un événement en échec",
            lambda: c.post(f"/api/accounting/inbox/{failed_id}/retry"),
            write=True,
        )
    else:
        ctx.skip("POST /api/accounting/inbox/{id}/retry", "rejeu d'un événement", "aucun événement en échec", write=True)
    ctx.check("POST /api/accounting/inbox/retry-failed", "rejeu global", lambda: c.post("/api/accounting/inbox/retry-failed"), write=True)
