"""erp-audit — journal d'audit (un seul point d'entrée, beaucoup de filtres)."""

from __future__ import annotations

from ..runner import Context, suite


@suite("audit", "Journal d'audit (/api/audit)", order=90)
def audit(ctx: Context) -> None:
    c = ctx.client

    ctx.check("GET /api/audit", "liste paginée", lambda: c.get("/api/audit", {"page": 0, "size": 20}))
    ctx.check("GET /api/audit", "filtre par module", lambda: c.get("/api/audit", {"page": 0, "size": 5, "module": "SALES"}))
    ctx.check("GET /api/audit", "filtre par action", lambda: c.get("/api/audit", {"page": 0, "size": 5, "action": "LOGIN"}))
    ctx.check(
        "GET /api/audit",
        "filtre par type d'entité",
        lambda: c.get("/api/audit", {"page": 0, "size": 5, "entityType": "Order"}),
    )

    user_id = ctx.recall("anyUserId")
    if user_id:
        ctx.check("GET /api/audit", "filtre par utilisateur", lambda: c.get("/api/audit", {"page": 0, "size": 5, "userId": user_id}))
    else:
        ctx.skip("GET /api/audit", "filtre par utilisateur", "aucun identifiant utilisateur connu")
