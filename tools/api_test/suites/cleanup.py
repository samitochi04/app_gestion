"""Nettoyage — exerce les DELETE restants sur les fixtures créées par le run.

Cette suite tourne en dernier (`order=200`). Elle ne supprime QUE ce que le
mode écriture a créé (catégorie, produit, entrepôt marqués APITEST), jamais des
données réelles. Un refus métier « élément utilisé » compte comme un succès :
l'endpoint a répondu correctement.
"""

from __future__ import annotations

from ..runner import Context, suite


@suite("cleanup", "Nettoyage des fixtures (DELETE)", order=200)
def cleanup(ctx: Context) -> None:
    c = ctx.client

    cat_id = ctx.recall("tempCategoryId")
    if cat_id:
        ctx.check(
            "DELETE /api/categories/{id}",
            "suppression de la catégorie de test",
            lambda: c.delete(f"/api/categories/{cat_id}"),
            accept=("CATEGORY_IN_USE", "CATEGORY_HAS_PRODUCTS", 400, 409),
            write=True,
        )
    else:
        ctx.skip("DELETE /api/categories/{id}", "suppression", "aucune catégorie de test créée", write=True)

    # The product was used in movements/orders, so a refusal is the expected,
    # correct answer — we accept it. Only the APITEST product is targeted.
    prod_id = ctx.recall("productId") if ctx.recall("productName", "").startswith("Produit APITEST") else None
    if prod_id:
        ctx.check(
            "DELETE /api/products/{id}",
            "suppression du produit de test (refus si utilisé)",
            lambda: c.delete(f"/api/products/{prod_id}"),
            accept=("PRODUCT_IN_USE", "PRODUCT_HAS_MOVEMENTS", "PRODUCT_REFERENCED", 400, 409),
            write=True,
        )
    else:
        ctx.skip("DELETE /api/products/{id}", "suppression", "produit réel ou réutilisé, non supprimé", write=True)

    wh_id = ctx.recall("warehouseId2")
    if wh_id:
        ctx.check(
            "DELETE /api/warehouses/{id}",
            "suppression de l'entrepôt de test (refus si utilisé)",
            lambda: c.delete(f"/api/warehouses/{wh_id}"),
            accept=(
                "WAREHOUSE_IN_USE", "WAREHOUSE_HAS_STOCK", "WAREHOUSE_REFERENCED",
                "WAREHOUSE_IS_DEFAULT", 400, 409,
            ),
            write=True,
        )
    else:
        ctx.skip("DELETE /api/warehouses/{id}", "suppression", "aucun entrepôt de test créé", write=True)
