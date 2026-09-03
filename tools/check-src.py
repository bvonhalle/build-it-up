#!/usr/bin/env python3
"""Smoke-check src/ before it ships: valid manifest, no dangling file
references, no JS syntax errors. No dependencies beyond node on PATH.

Usage: python3 tools/check-src.py
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"


def fail(msg):
    print(f"FAIL: {msg}")
    return False


def check_manifest():
    ok = True
    manifest_path = SRC / "manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text())
    except Exception as e:
        return fail(f"manifest.json is not valid JSON: {e}")

    paths = [manifest["action"]["default_popup"], manifest["options_page"]]
    paths += list(manifest["action"]["default_icon"].values())
    paths += list(manifest["icons"].values())
    for p in paths:
        if not (SRC / p).exists():
            ok = fail(f"manifest.json references missing file: {p}")
    return ok


def check_html_refs():
    ok = True
    for html in SRC.glob("*.html"):
        text = html.read_text()
        import re
        for m in re.finditer(r'(?:src|href)="([^"]+)"', text):
            ref = m.group(1)
            if ref.startswith(("http://", "https://", "#")):
                continue
            if not (SRC / ref).exists():
                ok = fail(f"{html.name} references missing file: {ref}")
    return ok


def check_js_syntax():
    ok = True
    for js in SRC.glob("*.js"):
        result = subprocess.run(["node", "--check", str(js)], capture_output=True, text=True)
        if result.returncode != 0:
            ok = fail(f"{js.name} failed to parse:\n{result.stderr}")
    return ok


def main():
    checks = [check_manifest(), check_html_refs(), check_js_syntax()]
    if all(checks):
        print("All checks passed.")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
