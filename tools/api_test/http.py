"""Envelope-aware HTTP client for the KIT ERP backend.

Standard library only — no pip install required.

Every backend endpoint answers with the `ApiResponse<T>` envelope
(`{success, data, error, timestamp}`), so unwrapping lives here and nowhere
else, exactly like `ApiService` does on the Angular side.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from dataclasses import dataclass, field
from typing import Any


class ApiError(Exception):
    """Raised when the envelope reports `success: false`."""

    def __init__(self, code: str, message: str, status: int) -> None:
        super().__init__(f"{code}: {message}")
        self.code = code
        self.message = message
        self.status = status


@dataclass
class Response:
    """One HTTP round-trip, already unwrapped when the body is an envelope."""

    status: int
    ok: bool
    data: Any = None
    code: str = ""
    message: str = ""
    elapsed_ms: float = 0.0
    raw: bytes = b""
    content_type: str = ""

    @property
    def failure(self) -> str:
        """Short human-readable reason, empty when the call succeeded."""
        if self.ok:
            return ""
        if self.code:
            return f"{self.status} {self.code} — {self.message}"
        return f"{self.status} {self.message or 'erreur inconnue'}"


@dataclass
class HttpClient:
    """Minimal JSON/multipart client with bearer-token support."""

    base_url: str
    origin: str = ""
    timeout: int = 30
    token: str = ""
    verbose: bool = False
    calls: list[tuple[str, str, int]] = field(default_factory=list)

    # ---- verbs -------------------------------------------------------------

    def get(self, path: str, params: dict[str, Any] | None = None, **kw: Any) -> Response:
        return self.request("GET", path, params=params, **kw)

    def post(self, path: str, body: Any = None, params: dict[str, Any] | None = None, **kw: Any) -> Response:
        return self.request("POST", path, body=body, params=params, **kw)

    def put(self, path: str, body: Any = None, params: dict[str, Any] | None = None, **kw: Any) -> Response:
        return self.request("PUT", path, body=body, params=params, **kw)

    def delete(self, path: str, params: dict[str, Any] | None = None, **kw: Any) -> Response:
        return self.request("DELETE", path, params=params, **kw)

    # ---- core --------------------------------------------------------------

    def request(
        self,
        method: str,
        path: str,
        body: Any = None,
        params: dict[str, Any] | None = None,
        *,
        multipart: tuple[str, str, bytes] | None = None,
        anonymous: bool = False,
        expect_binary: bool = False,
    ) -> Response:
        url = self.base_url.rstrip("/") + path
        if params:
            clean = {k: v for k, v in params.items() if v is not None and v != ""}
            if clean:
                url += "?" + urllib.parse.urlencode(clean)

        headers: dict[str, str] = {"Accept": "*/*" if expect_binary else "application/json"}
        if self.origin:
            headers["Origin"] = self.origin
        if self.token and not anonymous:
            headers["Authorization"] = f"Bearer {self.token}"

        payload: bytes | None = None
        if multipart is not None:
            field_name, filename, content = multipart
            boundary = f"----kit{uuid.uuid4().hex}"
            payload = _encode_multipart(boundary, field_name, filename, content)
            headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        elif body is not None:
            payload = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = urllib.request.Request(url, data=payload, headers=headers, method=method)
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                status, raw = res.status, res.read()
                ctype = res.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:  # 4xx / 5xx still carry a body
            status, raw = e.code, e.read()
            ctype = e.headers.get("Content-Type", "") if e.headers else ""
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            elapsed = (time.perf_counter() - started) * 1000
            self.calls.append((method, path, 0))
            return Response(status=0, ok=False, message=str(getattr(e, "reason", e)), elapsed_ms=elapsed)

        elapsed = (time.perf_counter() - started) * 1000
        self.calls.append((method, path, status))
        if self.verbose:
            print(f"    {method} {path} -> {status} ({elapsed:.0f} ms)")
        return _build_response(status, raw, ctype, elapsed, expect_binary)

    # ---- convenience -------------------------------------------------------

    def unwrap(self, res: Response, context: str) -> Any:
        """Return `data` or raise — for steps whose result later steps need."""
        if not res.ok:
            raise ApiError(res.code or "HTTP", res.message or context, res.status)
        return res.data


def _build_response(status: int, raw: bytes, ctype: str, elapsed: float, expect_binary: bool) -> Response:
    if expect_binary or "json" not in ctype.lower():
        return Response(
            status=status,
            ok=200 <= status < 300,
            data=None,
            message="" if 200 <= status < 300 else raw[:200].decode("utf-8", "replace"),
            elapsed_ms=elapsed,
            raw=raw,
            content_type=ctype,
        )

    try:
        body = json.loads(raw.decode("utf-8")) if raw else {}
    except (ValueError, UnicodeDecodeError):
        return Response(status=status, ok=False, message="réponse JSON illisible", elapsed_ms=elapsed, raw=raw)

    if isinstance(body, dict) and "success" in body:
        err = body.get("error") or {}
        ok = bool(body.get("success")) and 200 <= status < 300
        return Response(
            status=status,
            ok=ok,
            data=body.get("data"),
            code=err.get("code", "") if not ok else "",
            message=err.get("message", "") if not ok else "",
            elapsed_ms=elapsed,
            raw=raw,
            content_type=ctype,
        )

    # Spring error pages (404 on an unknown URL, 405, ...) are not enveloped.
    message = ""
    if isinstance(body, dict):
        message = str(body.get("message") or body.get("error") or "")
    return Response(
        status=status,
        ok=200 <= status < 300,
        data=body,
        message=message,
        elapsed_ms=elapsed,
        raw=raw,
        content_type=ctype,
    )


def _encode_multipart(boundary: str, field_name: str, filename: str, content: bytes) -> bytes:
    return b"".join(
        [
            f"--{boundary}\r\n".encode(),
            f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode(),
            b"Content-Type: application/octet-stream\r\n\r\n",
            content,
            f"\r\n--{boundary}--\r\n".encode(),
        ]
    )
