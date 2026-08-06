"""Command-line entry point for the API verification suite."""

from __future__ import annotations

import argparse
import functools
import http.server
import os
import socketserver
import sys
import time
import webbrowser

from . import __version__
from . import suites  # noqa: F401  (imports register every suite)
from .http import HttpClient
from .runner import Context, print_console, registered_suites, run, summarize, write_html, write_json

DEFAULT_BASE_URL = "http://51.75.248.25:8084"
#: Origin the backend's CORS configuration actually allows. Verified with a
#: preflight against both the dev host and the production gateway.
DEFAULT_ORIGIN = "http://localhost:4200"
#: Port the HTML report is served on, so the result can be opened in a browser.
DEFAULT_REPORT_PORT = 5173

BANNER = r"""
  KIT ERP · vérification des API backend
"""


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="test_api",
        description="Exerce tous les points d'entrée REST du backend KIT ERP et produit un rapport.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Exemples :\n"
            "  python tools/test_api.py                          # lecture seule, rapport servi sur :5173\n"
            "  python tools/test_api.py --mode write             # exécute aussi le flux vente complet\n"
            "  python tools/test_api.py --only products,orders   # limite à quelques suites\n"
            "  python tools/test_api.py --no-serve --json out.json\n"
        ),
    )
    p.add_argument("--base-url", default=os.getenv("ERP_BASE_URL", DEFAULT_BASE_URL), help=f"URL du backend (défaut : {DEFAULT_BASE_URL})")
    p.add_argument("--email", default=os.getenv("ERP_EMAIL", ""), help="adresse de connexion (ou variable ERP_EMAIL)")
    p.add_argument("--password", default=os.getenv("ERP_PASSWORD", ""), help="mot de passe (ou variable ERP_PASSWORD)")
    p.add_argument(
        "--origin",
        default=os.getenv("ERP_ORIGIN", DEFAULT_ORIGIN),
        help=f"en-tête Origin envoyé, pour vérifier aussi la configuration CORS (défaut : {DEFAULT_ORIGIN})",
    )
    p.add_argument("--no-origin", action="store_true", help="n'envoyer aucun en-tête Origin (appel serveur à serveur)")
    p.add_argument(
        "--mode",
        choices=("read", "write"),
        default="read",
        help="read : n'effectue que des lectures. write : crée aussi des documents de test (marqués APITEST-…)",
    )
    p.add_argument("--only", default="", help="liste de suites séparées par des virgules (voir --list)")
    p.add_argument("--list", action="store_true", help="afficher les suites disponibles puis quitter")
    p.add_argument("--timeout", type=int, default=45, help="délai maximal par appel, en secondes")
    p.add_argument("--json", dest="json_path", default="", help="chemin du rapport JSON")
    p.add_argument("--html", dest="html_path", default="rapport-api.html", help="chemin du rapport HTML")
    p.add_argument("--port", type=int, default=DEFAULT_REPORT_PORT, help=f"port du serveur de rapport (défaut : {DEFAULT_REPORT_PORT})")
    p.add_argument("--no-serve", action="store_true", help="ne pas servir le rapport, quitter immédiatement")
    p.add_argument("--no-color", action="store_true", help="désactiver la couleur")
    p.add_argument("-v", "--verbose", action="store_true", help="tracer chaque appel HTTP")
    return p


def main(argv: list[str] | None = None) -> int:
    # The report is written in French; a Windows console defaults to cp1252
    # and would mangle the accents.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    args = build_parser().parse_args(argv)

    if args.list:
        print("Suites disponibles :")
        for s in registered_suites():
            print(f"  {s.key:24} {s.label}")
        return 0

    if not args.email or not args.password:
        print(
            "Identifiants manquants. Passez --email/--password, ou définissez ERP_EMAIL et ERP_PASSWORD.",
            file=sys.stderr,
        )
        return 2

    color = not args.no_color and sys.stdout.isatty()
    origin = "" if args.no_origin else args.origin

    print(BANNER)
    print(f"  Backend    : {args.base_url}")
    print(f"  Compte     : {args.email}")
    print(f"  Origin     : {origin or '(aucun)'}")
    print(f"  Mode       : {'écriture (crée des documents de test)' if args.mode == 'write' else 'lecture seule'}")
    print()

    client = HttpClient(base_url=args.base_url, origin=origin, timeout=args.timeout, verbose=args.verbose)

    started = time.perf_counter()
    login = client.post("/api/auth/login", {"email": args.email, "password": args.password}, anonymous=True)
    if not login.ok or not isinstance(login.data, dict):
        print(f"  Connexion impossible : {login.failure}", file=sys.stderr)
        if login.status == 403 and origin:
            print(
                f"  L'origine « {origin} » est refusée par la configuration CORS du backend.\n"
                f"  Relancez avec --no-origin, ou avec l'origine autorisée.",
                file=sys.stderr,
            )
        return 2

    client.token = login.data.get("accessToken", "")
    user = login.data.get("user") or {}

    ctx = Context(client=client, write_mode=args.mode == "write")
    ctx.remember("email", args.email)
    ctx.remember("password", args.password)
    ctx.remember("refreshToken", login.data.get("refreshToken"))
    ctx.remember("currentUserId", user.get("id"))

    print(f"  Connecté   : {user.get('fullName') or user.get('email')} — {len(user.get('permissions') or [])} permissions")

    only = {s.strip() for s in args.only.split(",") if s.strip()} or None
    if only:
        known = {s.key for s in registered_suites()}
        unknown = only - known
        if unknown:
            print(f"  Suites inconnues : {', '.join(sorted(unknown))}", file=sys.stderr)
            return 2

    for _ in run(ctx, only=only):
        pass

    summary = summarize(ctx.checks, started)
    print_console(ctx.checks, summary, color)

    meta = {
        "backend": args.base_url,
        "compte": args.email,
        "origin": origin or "(aucun)",
        "mode": args.mode,
        "outil": f"api_test {__version__}",
    }
    if args.json_path:
        write_json(args.json_path, ctx.checks, summary, meta)
        print(f"\n  Rapport JSON : {os.path.abspath(args.json_path)}")
    if args.html_path:
        write_html(args.html_path, ctx.checks, summary, meta)
        print(f"  Rapport HTML : {os.path.abspath(args.html_path)}")

    if args.html_path and not args.no_serve:
        _serve(args.html_path, args.port)

    return summary.exit_code


def _serve(html_path: str, port: int) -> None:
    """Serve the report directory so the result opens in a browser."""
    directory = os.path.dirname(os.path.abspath(html_path)) or "."
    filename = os.path.basename(html_path)
    handler = functools.partial(_QuietHandler, directory=directory)
    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
            url = f"http://localhost:{port}/{filename}"
            print(f"\n  Rapport servi sur {url}  (Ctrl+C pour arrêter)")
            try:
                webbrowser.open(url)
            except Exception:  # noqa: BLE001 - headless machines have no browser
                pass
            httpd.serve_forever()
    except OSError as e:
        print(f"\n  Impossible d'ouvrir le port {port} : {e}. Ouvrez le fichier HTML directement.")
    except KeyboardInterrupt:
        print("\n  Serveur arrêté.")


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args: object) -> None:  # noqa: D102 - silence request logging
        pass


if __name__ == "__main__":
    raise SystemExit(main())
