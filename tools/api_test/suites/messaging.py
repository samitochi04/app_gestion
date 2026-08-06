"""erp-messaging — conversations, messages, flux SSE."""

from __future__ import annotations

from ..runner import Context, suite
from ._shared import RUN_TAG


@suite("messaging", "Messagerie (/api/messaging)", order=85)
def messaging(ctx: Context) -> None:
    c = ctx.client

    res = ctx.check(
        "GET /api/messaging/conversations",
        "liste des fils",
        lambda: c.get("/api/messaging/conversations", {"page": 0, "size": 20}),
    )
    conv_id = None
    if res and res.ok:
        first = ctx.first(res.data)
        if first:
            conv_id = first.get("id")

    ctx.check(
        "GET /api/messaging/correspondents",
        "annuaire restreint (nom + courriel)",
        lambda: c.get("/api/messaging/correspondents", {"page": 0, "size": 20}),
    )

    ticket = ctx.check("POST /api/messaging/stream/ticket", "ticket de flux à usage unique", lambda: c.post("/api/messaging/stream/ticket"))
    if ticket and ticket.ok:
        # The SSE endpoint holds the connection open; consuming the ticket is
        # what proves it, so the check stops at the ticket itself.
        ctx.skip("GET /api/messaging/stream", "flux SSE", "connexion longue durée, non testable en une requête")
    else:
        ctx.skip("GET /api/messaging/stream", "flux SSE", "aucun ticket obtenu")

    if conv_id:
        ctx.check("GET /api/messaging/conversations/{id}", "détail d'un fil", lambda: c.get(f"/api/messaging/conversations/{conv_id}"))
        ctx.check(
            "GET /api/messaging/conversations/{id}/messages",
            "messages d'un fil",
            lambda: c.get(f"/api/messaging/conversations/{conv_id}/messages", {"page": 0, "size": 20}),
        )
        ctx.check(
            "POST /api/messaging/conversations/{id}/read",
            "marquage comme lu",
            lambda: c.post(f"/api/messaging/conversations/{conv_id}/read"),
            write=True,
        )
    else:
        for ep, label in (
            ("GET /api/messaging/conversations/{id}", "détail d'un fil"),
            ("GET /api/messaging/conversations/{id}/messages", "messages d'un fil"),
        ):
            ctx.skip(ep, label, "aucune conversation en base")
        ctx.skip("POST /api/messaging/conversations/{id}/read", "marquage comme lu", "aucune conversation en base", write=True)

    support = ctx.check(
        "POST /api/messaging/conversations/support",
        "ouverture d'un fil de support",
        lambda: c.post(
            "/api/messaging/conversations/support",
            {"subject": f"Retour utilisateur {RUN_TAG}", "message": "Fil ouvert par la suite de test API."},
        ),
        write=True,
    )
    new_conv = (support.data or {}).get("id") if support and support.ok and isinstance(support.data, dict) else None

    if new_conv:
        posted = ctx.check(
            "POST /api/messaging/conversations/{id}/messages",
            "envoi d'un message",
            lambda: c.post(f"/api/messaging/conversations/{new_conv}/messages", {"body": "Message de test."}),
            write=True,
        )
        msg_id = (posted.data or {}).get("id") if posted and posted.ok and isinstance(posted.data, dict) else None
        if msg_id:
            ctx.check(
                "PUT /api/messaging/messages/{messageId}",
                "modification d'un message",
                lambda: c.put(f"/api/messaging/messages/{msg_id}", {"body": "Message de test (modifié)."}),
                write=True,
            )
            ctx.check(
                "DELETE /api/messaging/messages/{messageId}",
                "suppression d'un message",
                lambda: c.delete(f"/api/messaging/messages/{msg_id}"),
                write=True,
            )
        else:
            ctx.skip("PUT /api/messaging/messages/{messageId}", "modification d'un message", "aucun message envoyé", write=True)
            ctx.skip("DELETE /api/messaging/messages/{messageId}", "suppression d'un message", "aucun message envoyé", write=True)

        ctx.check(
            "PUT /api/messaging/conversations/{id}/subject",
            "renommage",
            lambda: c.put(f"/api/messaging/conversations/{new_conv}/subject", {"subject": f"Retour {RUN_TAG} (renommé)"}),
            write=True,
        )
        ctx.check(
            "POST /api/messaging/conversations/{id}/archive",
            "archivage",
            lambda: c.post(f"/api/messaging/conversations/{new_conv}/archive"),
            write=True,
        )
        ctx.check(
            "POST /api/messaging/conversations/{id}/reopen",
            "réouverture",
            lambda: c.post(f"/api/messaging/conversations/{new_conv}/reopen"),
            write=True,
        )
        ctx.check(
            "POST /api/messaging/conversations/{id}/leave",
            "sortie du fil",
            lambda: c.post(f"/api/messaging/conversations/{new_conv}/leave"),
            accept=("LAST_OWNER_CANNOT_LEAVE", "CANNOT_LEAVE_DIRECT", 400),
            write=True,
        )
    else:
        for ep, label in (
            ("POST /api/messaging/conversations/{id}/messages", "envoi d'un message"),
            ("PUT /api/messaging/messages/{messageId}", "modification d'un message"),
            ("DELETE /api/messaging/messages/{messageId}", "suppression d'un message"),
            ("PUT /api/messaging/conversations/{id}/subject", "renommage"),
            ("POST /api/messaging/conversations/{id}/archive", "archivage"),
            ("POST /api/messaging/conversations/{id}/reopen", "réouverture"),
            ("POST /api/messaging/conversations/{id}/leave", "sortie du fil"),
        ):
            ctx.skip(ep, label, "aucun fil de support créé", write=True)

    other = ctx.recall("anyUserId")
    if other:
        direct = ctx.check(
            "POST /api/messaging/conversations/direct",
            "tête-à-tête (idempotent)",
            lambda: c.post("/api/messaging/conversations/direct", {"recipientId": other}),
            accept=("CANNOT_MESSAGE_SELF", "INVALID_RECIPIENT", 400),
            write=True,
        )
        d_id = (direct.data or {}).get("id") if direct and direct.ok and isinstance(direct.data, dict) else None
        if d_id:
            ctx.check(
                "POST /api/messaging/conversations/groups",
                "création d'un groupe",
                lambda: c.post(
                    "/api/messaging/conversations/groups",
                    {"subject": f"Groupe {RUN_TAG}", "memberIds": [other]},
                ),
                write=True,
            )
        else:
            ctx.skip("POST /api/messaging/conversations/groups", "création d'un groupe", "aucun correspondant valide", write=True)
    else:
        ctx.skip("POST /api/messaging/conversations/direct", "tête-à-tête", "aucun autre utilisateur", write=True)
        ctx.skip("POST /api/messaging/conversations/groups", "création d'un groupe", "aucun autre utilisateur", write=True)

    for ep, label in (
        ("POST /api/messaging/conversations/{id}/participants/{userId}", "ajout d'un participant"),
        ("DELETE /api/messaging/conversations/{id}/participants/{userId}", "retrait d'un participant"),
        ("POST /api/messaging/conversations/{id}/participants/{userId}/promote", "promotion d'un participant"),
    ):
        ctx.skip(ep, label, "exige un groupe avec plusieurs membres réels", write=True)
