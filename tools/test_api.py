#!/usr/bin/env python3
"""Lanceur de la suite de vérification des API KIT ERP.

    python tools/test_api.py --email <adresse> --password <mot de passe>

Aucune dépendance à installer : bibliothèque standard uniquement.
Voir tools/README.md pour les options.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow `python tools/test_api.py` from anywhere without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tools.api_test.__main__ import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
