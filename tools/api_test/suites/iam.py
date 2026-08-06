"""erp-iam — authentication, users, roles, mail settings."""

from __future__ import annotations

import uuid

from ..runner import Context, suite
from ._shared import RUN_TAG


@suite("auth", "Authentification (/api/auth)", order=10)
def auth(ctx: Context) -> None:
    c = ctx.client

    # The session token was already obtained during bootstrap; re-issuing it
    # here is what proves the endpoint itself answers.
    ctx.check(
        "POST /api/auth/login",
        "connexion avec les identifiants fournis",
        lambda: c.post("/api/auth/login", {"email": ctx.recall("email"), "password": ctx.recall("password")}, anonymous=True),
        required=True,
    )
    ctx.check(
        "POST /api/auth/login",
        "mot de passe invalide → INVALID_CREDENTIALS",
        lambda: c.post("/api/auth/login", {"email": ctx.recall("email"), "password": "mot-de-passe-faux"}, anonymous=True),
        accept=("INVALID_CREDENTIALS",),
    )
    ctx.check(
        "POST /api/auth/refresh",
        "renouvellement du jeton",
        lambda: c.post("/api/auth/refresh", {"refreshToken": ctx.recall("refreshToken")}, anonymous=True),
    )
    ctx.check(
        "POST /api/auth/forgot-password",
        "demande de code (adresse inconnue → réponse neutre)",
        lambda: c.post("/api/auth/forgot-password", {"email": f"inconnu-{uuid.uuid4().hex[:8]}@example.test"}, anonymous=True),
    )
    ctx.check(
        "POST /api/auth/reset-password",
        "code invalide → RESET_CODE_INVALID",
        lambda: c.post(
            "/api/auth/reset-password",
            {"email": ctx.recall("email"), "code": "000000", "newPassword": "Irrelevant123!"},
            anonymous=True,
        ),
        accept=("RESET_CODE_INVALID", "USER_NOT_FOUND"),
    )
    ctx.check(
        "POST /api/auth/register",
        "inscription libre (désactivée hors SaaS)",
        lambda: c.post(
            "/api/auth/register",
            {
                "email": f"apitest-{uuid.uuid4().hex[:10]}@example.test",
                "firstName": "API",
                "lastName": "Test",
                "password": "ApiTest123!",
            },
            anonymous=True,
        ),
        accept=("SELF_REGISTRATION_DISABLED", "EMAIL_ALREADY_USED"),
        write=True,
    )
    ctx.check(
        "PUT /api/auth/change-password",
        "mot de passe actuel erroné → refus",
        lambda: c.put("/api/auth/change-password", {"currentPassword": "faux", "newPassword": "Autre123!"}),
        accept=("INVALID_CREDENTIALS", "PASSWORD_MISMATCH", "INVALID_PASSWORD", 400),
    )
    # Logout revokes the refresh token, never the access token — running it
    # here would not disturb the rest of the suite, but it would invalidate the
    # refresh token the run was bootstrapped with.
    ctx.skip("POST /api/auth/logout", "déconnexion", "révoquerait le jeton de la session de test")


@suite("users", "Utilisateurs (/api/users)", order=20)
def users(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/users", "liste paginée", lambda: c.get("/api/users", {"page": 0, "size": 20}))
    if res and res.ok:
        me = ctx.first(res.data)
        if me:
            ctx.remember("anyUserId", me.get("id"))
    ctx.check("GET /api/users", "filtre actif", lambda: c.get("/api/users", {"page": 0, "size": 5, "active": "true"}))

    created = ctx.check(
        "POST /api/users",
        "création d'un compte avec mot de passe provisoire",
        lambda: c.post(
            "/api/users",
            {
                "email": f"apitest-{uuid.uuid4().hex[:10]}@example.test",
                "temporaryPassword": "Provisoire123!",
                "firstName": "Compte",
                "lastName": RUN_TAG,
            },
        ),
        write=True,
    )
    new_id = (created.data or {}).get("id") if created and created.ok else None

    if new_id:
        ctx.check(
            "POST /api/users/{userId}/reset-password",
            "réinitialisation administrative",
            lambda: c.post(f"/api/users/{new_id}/reset-password", {"temporaryPassword": "Provisoire456!"}),
            write=True,
        )
        ctx.check(
            "POST /api/users/{userId}/deactivate",
            "désactivation",
            lambda: c.post(f"/api/users/{new_id}/deactivate"),
            write=True,
        )
        ctx.check(
            "POST /api/users/{userId}/activate",
            "réactivation",
            lambda: c.post(f"/api/users/{new_id}/activate"),
            write=True,
        )
        role_id = ctx.recall("anyRoleId")
        if role_id:
            ctx.check(
                "POST /api/users/{userId}/roles/{roleId}",
                "affectation d'un rôle",
                lambda: c.post(f"/api/users/{new_id}/roles/{role_id}"),
                write=True,
            )
    else:
        for ep, label in (
            ("POST /api/users/{userId}/reset-password", "réinitialisation administrative"),
            ("POST /api/users/{userId}/deactivate", "désactivation"),
            ("POST /api/users/{userId}/activate", "réactivation"),
            ("POST /api/users/{userId}/roles/{roleId}", "affectation d'un rôle"),
        ):
            ctx.skip(ep, label, "aucun compte de test créé", write=True)


@suite("roles", "Rôles et permissions (/api/roles)", order=21)
def roles(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check("GET /api/roles", "catalogue des rôles", lambda: c.get("/api/roles"))
    if res and res.ok:
        first = ctx.first(res.data)
        if first:
            ctx.remember("anyRoleId", first.get("id"))

    perms = ctx.check("GET /api/roles/permissions", "catalogue des permissions", lambda: c.get("/api/roles/permissions"))
    if perms and perms.ok and isinstance(perms.data, list):
        ctx.remember("permissionCatalog", [p.get("name") for p in perms.data if isinstance(p, dict)])

    created = ctx.check(
        "POST /api/roles",
        "création d'un rôle",
        lambda: c.post("/api/roles", {"name": f"ROLE_{RUN_TAG}".replace("-", "_"), "description": "Rôle de test API", "permissions": ["USER_READ"]}),
        write=True,
    )
    role_id = (created.data or {}).get("id") if created and created.ok else None

    if role_id:
        ctx.check(
            "PUT /api/roles/{roleId}",
            "mise à jour des permissions",
            lambda: c.put(f"/api/roles/{role_id}", {"description": "Rôle de test API (modifié)", "permissions": ["USER_READ", "ROLE_READ"]}),
            write=True,
        )
        ctx.check(
            "DELETE /api/roles/{roleId}",
            "suppression",
            lambda: c.delete(f"/api/roles/{role_id}"),
            write=True,
        )
    else:
        ctx.skip("PUT /api/roles/{roleId}", "mise à jour des permissions", "aucun rôle de test créé", write=True)
        ctx.skip("DELETE /api/roles/{roleId}", "suppression", "aucun rôle de test créé", write=True)


@suite("mail", "Réglages de messagerie (/api/settings/mail)", order=22)
def mail_settings(ctx: Context) -> None:
    c = ctx.client
    ctx.check("GET /api/settings/mail", "lecture des réglages SMTP", lambda: c.get("/api/settings/mail"))
    ctx.skip("PUT /api/settings/mail", "mise à jour SMTP", "modifierait la configuration d'envoi réelle", write=True)
    ctx.skip("POST /api/settings/mail/test", "envoi d'un message de test", "enverrait un vrai courriel", write=True)
