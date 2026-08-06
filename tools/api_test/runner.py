"""Suite registry, result collection and report rendering.

A *suite* is a function `(ctx) -> None` that calls `ctx.check(...)` once per
endpoint. Suites register themselves with `@suite("module", "Label")`, so
adding coverage never means touching the runner.
"""

from __future__ import annotations

import html
import json
import time
from collections.abc import Callable, Iterator
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from .http import ApiError, HttpClient, Response

# --------------------------------------------------------------------------- #
# Results
# --------------------------------------------------------------------------- #

PASS = "PASS"
FAIL = "FAIL"
SKIP = "SKIP"


@dataclass
class Check:
    """Outcome of exercising one endpoint."""

    module: str
    endpoint: str
    label: str
    outcome: str
    status: int = 0
    detail: str = ""
    elapsed_ms: float = 0.0
    write: bool = False


@dataclass
class Suite:
    key: str
    label: str
    fn: Callable[["Context"], None]
    order: int


_SUITES: list[Suite] = []


def suite(key: str, label: str, order: int = 100) -> Callable[[Callable[["Context"], None]], Callable[["Context"], None]]:
    """Register a suite. `order` keeps auth first and teardown-ish suites last."""

    def wrap(fn: Callable[["Context"], None]) -> Callable[["Context"], None]:
        _SUITES.append(Suite(key=key, label=label, fn=fn, order=order))
        return fn

    return wrap


def registered_suites() -> list[Suite]:
    return sorted(_SUITES, key=lambda s: (s.order, s.key))


# --------------------------------------------------------------------------- #
# Context
# --------------------------------------------------------------------------- #


@dataclass
class Context:
    """Shared state for a run: the client, the flags, and the fixtures created
    along the way (`ctx.store`) so later suites can reuse them."""

    client: HttpClient
    write_mode: bool
    checks: list[Check] = field(default_factory=list)
    store: dict[str, Any] = field(default_factory=dict)
    current_module: str = ""
    stop_on_auth_failure: bool = True

    # ---- recording ---------------------------------------------------------

    def check(
        self,
        endpoint: str,
        label: str,
        call: Callable[[], Response],
        *,
        write: bool = False,
        accept: tuple[int, ...] = (),
        required: bool = False,
    ) -> Response | None:
        """Run one endpoint and record the outcome.

        `accept` lists non-2xx statuses that still count as a pass — used where
        a business rule legitimately refuses (e.g. cancelling a validated
        invoice must answer `INVOICE_NOT_DRAFT`).
        Returns the response, or None when the check was skipped.
        """
        if write and not self.write_mode:
            self.checks.append(Check(self.current_module, endpoint, label, SKIP, detail="mode lecture seule", write=True))
            return None

        try:
            res = call()
        except ApiError as e:
            self.checks.append(Check(self.current_module, endpoint, label, FAIL, e.status, str(e), write=write))
            return None
        except Exception as e:  # noqa: BLE001 - a crashing suite must not kill the run
            self.checks.append(Check(self.current_module, endpoint, label, FAIL, 0, f"{type(e).__name__}: {e}", write=write))
            return None

        ok = res.ok or res.status in accept or (res.code and res.code in accept)
        self.checks.append(
            Check(
                module=self.current_module,
                endpoint=endpoint,
                label=label,
                outcome=PASS if ok else FAIL,
                status=res.status,
                detail="" if ok else res.failure,
                elapsed_ms=res.elapsed_ms,
                write=write,
            )
        )
        if not ok and required:
            raise ApiError(res.code or "HTTP", res.message or label, res.status)
        return res

    def skip(self, endpoint: str, label: str, reason: str, *, write: bool = False) -> None:
        self.checks.append(Check(self.current_module, endpoint, label, SKIP, detail=reason, write=write))

    # ---- fixtures ----------------------------------------------------------

    def remember(self, key: str, value: Any) -> None:
        if value is not None:
            self.store[key] = value

    def recall(self, key: str, default: Any = None) -> Any:
        return self.store.get(key, default)

    @staticmethod
    def first(page_or_list: Any) -> dict[str, Any] | None:
        """`data` may be a PageResponse or a bare list depending on the endpoint."""
        if isinstance(page_or_list, dict):
            page_or_list = page_or_list.get("content") or []
        if isinstance(page_or_list, list) and page_or_list:
            item = page_or_list[0]
            return item if isinstance(item, dict) else None
        return None


# --------------------------------------------------------------------------- #
# Execution
# --------------------------------------------------------------------------- #


def run(ctx: Context, only: set[str] | None = None) -> Iterator[Suite]:
    """Execute every registered suite, yielding each one as it starts."""
    for s in registered_suites():
        if only and s.key not in only:
            continue
        yield s
        ctx.current_module = s.label
        try:
            s.fn(ctx)
        except ApiError as e:
            ctx.checks.append(Check(s.label, "—", "suite interrompue", FAIL, e.status, str(e)))
        except Exception as e:  # noqa: BLE001
            ctx.checks.append(Check(s.label, "—", "suite interrompue", FAIL, 0, f"{type(e).__name__}: {e}"))


# --------------------------------------------------------------------------- #
# Reporting
# --------------------------------------------------------------------------- #


@dataclass
class Summary:
    total: int
    passed: int
    failed: int
    skipped: int
    duration_s: float

    @property
    def exit_code(self) -> int:
        return 1 if self.failed else 0


def summarize(checks: list[Check], started: float) -> Summary:
    return Summary(
        total=len(checks),
        passed=sum(1 for c in checks if c.outcome == PASS),
        failed=sum(1 for c in checks if c.outcome == FAIL),
        skipped=sum(1 for c in checks if c.outcome == SKIP),
        duration_s=time.perf_counter() - started,
    )


_GLYPH = {PASS: "  OK  ", FAIL: " FAIL ", SKIP: " SKIP "}
_COLOR = {PASS: "\033[32m", FAIL: "\033[31m", SKIP: "\033[33m"}
_RESET = "\033[0m"


def print_console(checks: list[Check], summary: Summary, color: bool) -> None:
    def paint(outcome: str) -> str:
        glyph = _GLYPH[outcome]
        return f"{_COLOR[outcome]}{glyph}{_RESET}" if color else glyph

    current = None
    for c in checks:
        if c.module != current:
            current = c.module
            print(f"\n\033[1m{current}\033[0m" if color else f"\n{current}")
        line = f"  [{paint(c.outcome)}] {c.endpoint:<52} {c.label}"
        if c.elapsed_ms:
            line += f"  ({c.elapsed_ms:.0f} ms)"
        print(line)
        if c.detail:
            print(f"           └─ {c.detail}")

    print("\n" + "─" * 88)
    print(
        f"  {summary.passed} réussis · {summary.failed} échoués · {summary.skipped} ignorés "
        f"— {summary.total} appels en {summary.duration_s:.1f} s"
    )
    print("─" * 88)

    if summary.failed:
        print("\n  Échecs :")
        for c in (c for c in checks if c.outcome == FAIL):
            print(f"   • [{c.module}] {c.endpoint} — {c.detail}")


def write_json(path: str, checks: list[Check], summary: Summary, meta: dict[str, Any]) -> None:
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "meta": meta,
        "summary": {
            "total": summary.total,
            "passed": summary.passed,
            "failed": summary.failed,
            "skipped": summary.skipped,
            "durationSeconds": round(summary.duration_s, 2),
        },
        "checks": [c.__dict__ for c in checks],
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def write_html(path: str, checks: list[Check], summary: Summary, meta: dict[str, Any]) -> None:
    rows: list[str] = []
    current = None
    for c in checks:
        if c.module != current:
            current = c.module
            rows.append(f'<tr class="group"><td colspan="5">{html.escape(current)}</td></tr>')
        rows.append(
            "<tr>"
            f'<td><span class="pill {c.outcome.lower()}">{c.outcome}</span></td>'
            f"<td class='mono'>{html.escape(c.endpoint)}</td>"
            f"<td>{html.escape(c.label)}</td>"
            f"<td class='num'>{c.status or ''}</td>"
            f"<td class='detail'>{html.escape(c.detail)}</td>"
            "</tr>"
        )

    meta_rows = "".join(
        f"<div><dt>{html.escape(str(k))}</dt><dd class='mono'>{html.escape(str(v))}</dd></div>" for k, v in meta.items()
    )

    doc = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>KIT ERP — rapport de test des API</title>
<style>
  :root {{ color-scheme: light dark; --bg:#fff; --fg:#101828; --muted:#667085; --line:#e4e7ec;
           --pass:#067647; --pass-bg:#ecfdf3; --fail:#b42318; --fail-bg:#fef3f2; --skip:#b54708; --skip-bg:#fffaeb; }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --bg:#0c111d; --fg:#ecedf0; --muted:#94969c; --line:#22262f;
             --pass:#75e0a7; --pass-bg:#053321; --fail:#fda29b; --fail-bg:#55160c; --skip:#fec84b; --skip-bg:#4e1d09; }}
  }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; padding:32px 24px; background:var(--bg); color:var(--fg);
          font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }}
  .wrap {{ max-width:1100px; margin:0 auto; }}
  h1 {{ font-size:22px; margin:0 0 4px; }}
  p.sub {{ color:var(--muted); margin:0 0 24px; }}
  .cards {{ display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px; }}
  .card {{ flex:1 1 140px; border:1px solid var(--line); border-radius:10px; padding:12px 14px; }}
  .card b {{ display:block; font-size:24px; }}
  .card span {{ color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.04em; }}
  dl {{ display:flex; flex-wrap:wrap; gap:8px 28px; border:1px solid var(--line); border-radius:10px;
        padding:14px; margin:0 0 24px; }}
  dl div {{ min-width:170px; }} dt {{ color:var(--muted); font-size:12px; }} dd {{ margin:2px 0 0; }}
  .scroll {{ overflow-x:auto; border:1px solid var(--line); border-radius:10px; }}
  table {{ border-collapse:collapse; width:100%; min-width:820px; }}
  th, td {{ text-align:left; padding:8px 12px; border-bottom:1px solid var(--line); vertical-align:top; }}
  thead th {{ font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }}
  tr.group td {{ background:color-mix(in srgb, var(--fg) 6%, transparent); font-weight:600; }}
  .mono {{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; }}
  .num {{ text-align:right; font-variant-numeric:tabular-nums; }}
  .detail {{ color:var(--muted); }}
  .pill {{ display:inline-block; min-width:52px; text-align:center; padding:2px 8px; border-radius:999px;
           font-size:11px; font-weight:700; letter-spacing:.03em; }}
  .pill.pass {{ color:var(--pass); background:var(--pass-bg); }}
  .pill.fail {{ color:var(--fail); background:var(--fail-bg); }}
  .pill.skip {{ color:var(--skip); background:var(--skip-bg); }}
</style></head>
<body><div class="wrap">
  <h1>KIT ERP — rapport de test des API</h1>
  <p class="sub">Généré le {html.escape(datetime.now().strftime('%d/%m/%Y à %H:%M:%S'))}</p>
  <div class="cards">
    <div class="card"><b>{summary.total}</b><span>appels</span></div>
    <div class="card"><b style="color:var(--pass)">{summary.passed}</b><span>réussis</span></div>
    <div class="card"><b style="color:var(--fail)">{summary.failed}</b><span>échoués</span></div>
    <div class="card"><b style="color:var(--skip)">{summary.skipped}</b><span>ignorés</span></div>
    <div class="card"><b>{summary.duration_s:.1f}s</b><span>durée</span></div>
  </div>
  <dl>{meta_rows}</dl>
  <div class="scroll"><table>
    <thead><tr><th>Résultat</th><th>Endpoint</th><th>Cas</th><th>HTTP</th><th>Détail</th></tr></thead>
    <tbody>{''.join(rows)}</tbody>
  </table></div>
</div></body></html>"""

    with open(path, "w", encoding="utf-8") as f:
        f.write(doc)
