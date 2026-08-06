"""erp-reporting — tableaux de bord, exports documentaires, société."""

from __future__ import annotations

from ..runner import Context, suite
from ._shared import today, year_start

#: Every export takes the same window; only the extra parameters differ.
EXPORTS: tuple[tuple[str, str, dict], ...] = (
    ("grand-livre", "grand livre", {}),
    ("balance", "balance générale", {}),
    ("balance-6-colonnes", "balance 6 colonnes", {}),
    ("balance-tiers", "balance des tiers", {}),
    ("balance-agee", "balance âgée", {}),
    ("journal", "journal", {}),
    ("bilan", "bilan", {}),
    ("compte-resultat", "compte de résultat", {}),
    ("livre-tresorerie", "livre de trésorerie", {}),
)


@suite("dashboards", "Tableaux de bord (/api/reporting/dashboard)", order=70)
def dashboards(ctx: Context) -> None:
    c = ctx.client
    ctx.check("GET /api/reporting/dashboard/sales", "indicateurs de vente", lambda: c.get("/api/reporting/dashboard/sales"))
    ctx.check("GET /api/reporting/dashboard/stock", "alertes et valorisation", lambda: c.get("/api/reporting/dashboard/stock"))
    ctx.check("GET /api/reporting/dashboard/financial", "indicateurs financiers", lambda: c.get("/api/reporting/dashboard/financial"))
    ctx.check("GET /api/reporting/dashboard/cache/status", "état du cache", lambda: c.get("/api/reporting/dashboard/cache/status"))
    ctx.check(
        "POST /api/reporting/dashboard/cache/evict",
        "vidage du cache",
        lambda: c.post("/api/reporting/dashboard/cache/evict"),
        write=True,
    )


@suite("exports", "Exports documentaires (/api/reporting/export)", order=71)
def exports(ctx: Context) -> None:
    c = ctx.client
    window = {"from": year_start(), "to": today()}

    for path, label, extra in EXPORTS:
        ctx.check(
            f"GET /api/reporting/export/{path}",
            f"{label} (PDF)",
            lambda p=path, e=extra: c.get(f"/api/reporting/export/{p}", {**window, **e, "format": "PDF"}, expect_binary=True),
        )

    ctx.check(
        "GET /api/reporting/export/balance",
        "balance générale (EXCEL)",
        lambda: c.get("/api/reporting/export/balance", {**window, "format": "EXCEL"}, expect_binary=True),
    )
    ctx.check(
        "GET /api/reporting/export/stock",
        "état de stock",
        lambda: c.get("/api/reporting/export/stock", {**window, "format": "PDF"}, expect_binary=True),
    )

    pid = ctx.recall("productId")
    if pid:
        ctx.check(
            "GET /api/reporting/export/produit",
            "fiche produit",
            lambda: c.get("/api/reporting/export/produit", {**window, "productId": pid, "format": "PDF"}, expect_binary=True),
        )
    else:
        ctx.skip("GET /api/reporting/export/produit", "fiche produit", "aucun produit disponible")


@suite("company", "Paramètres de société (/api/company)", order=72)
def company(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/company", "lecture des paramètres", lambda: c.get("/api/company"))
    current = res.data if res and res.ok and isinstance(res.data, dict) else {}

    ctx.check(
        "GET /api/company/logo",
        "logo (public, 404 si absent)",
        lambda: c.get("/api/company/logo", expect_binary=True),
        accept=(404,),
    )

    # Writes echo the values already stored, so a run never alters the company
    # identity printed on real invoices.
    ctx.check(
        "PUT /api/company/identity",
        "identité (valeurs inchangées)",
        lambda: c.put(
            "/api/company/identity",
            {
                "name": current.get("name") or "KIT",
                "legalForm": current.get("legalForm"),
                "slogan": current.get("slogan"),
            },
        ),
        write=True,
    )
    ctx.check(
        "PUT /api/company/contact",
        "coordonnées (valeurs inchangées)",
        lambda: c.put(
            "/api/company/contact",
            {k: current.get(k) for k in ("address", "city", "postalCode", "country", "phone", "phone2", "email", "website")},
        ),
        write=True,
    )
    ctx.check(
        "PUT /api/company/legal",
        "mentions légales (valeurs inchangées)",
        lambda: c.put(
            "/api/company/legal",
            {k: current.get(k) for k in ("nui", "rccm", "niu", "taxRegime", "authorizedCapital")},
        ),
        write=True,
    )
    ctx.check(
        "PUT /api/company/billing-settings",
        "paramètres de facturation (valeurs inchangées)",
        lambda: c.put(
            "/api/company/billing-settings",
            {k: current.get(k) for k in ("defaultVatRate", "invoiceFooter", "invoiceTerms")},
        ),
        write=True,
    )

    for ep, label in (
        ("POST /api/company/logo", "téléversement du logo"),
        ("DELETE /api/company/logo", "suppression du logo"),
        ("POST /api/company/signature", "téléversement de la signature"),
        ("DELETE /api/company/signature", "suppression de la signature"),
    ):
        ctx.skip(ep, label, "remplacerait le logo/la signature imprimés sur les factures", write=True)
