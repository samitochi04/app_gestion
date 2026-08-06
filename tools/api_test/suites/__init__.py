"""Endpoint suites, one module per ERP module.

Importing this package registers every suite with the runner. Adding coverage
for a new module means dropping a file here and listing it below — nothing
else in the tool changes.
"""

from . import (  # noqa: F401  (imported for their registration side effect)
    accounting,
    audit,
    billing,
    iam,
    messaging,
    reporting,
    sales,
    stock,
    supplier,
)

__all__ = [
    "accounting",
    "audit",
    "billing",
    "iam",
    "messaging",
    "reporting",
    "sales",
    "stock",
    "supplier",
]
