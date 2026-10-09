#!/usr/bin/env python3
"""Verify the maintained Platforms package, reviewed facts and deployment paths.

Offline check: rebuild in temporary staging; inspect the resulting committed
package, source provenance and navigable paths. Live interactions belong to
smoke-test.py. No hardware specifications are synthesized by this checker.
"""
from collections import Counter
from hashlib import sha256
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PLATFORMS = ROOT / "platforms"
PROVENANCE = ROOT / "tools/platform-guides/import-provenance.json"
sys.path.insert(0, str(PROVENANCE.parent))
from art_revision import validate_art_revision
SITE_ROOT = "https://example.invalid/hardware-dashboard/"
PAGE_NAMES = ["index.html"] + [f"{oem}-field-guide.html" for oem in
                              ("ucs", "hpe", "dell", "lenovo", "supermicro")]
REPORTS = ("acceptance-results.json", "generation-results.json",
           "physical-design-results.json", "release-quality-results.json",
           "spec-verification-results.json")


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def digest(data):
    return sha256(data).hexdigest()


def json_bytes(data):
    # The retained import provenance sorts keys to isolate record content.
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


class References(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.urls = []
        self.links = []
        self.current_link = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        for name in ("href", "src", "poster", "action"):
            if name in attrs:
                self.urls.append(attrs[name])
        if tag == "a":
            self.current_link = {"href": attrs.get("href", ""),
                                 "active": attrs.get("aria-current"), "text": ""}

    def handle_data(self, data):
        if self.current_link is not None:
            self.current_link["text"] += data

    def handle_endtag(self, tag):
        if tag == "a" and self.current_link is not None:
            self.current_link["text"] = self.current_link["text"].strip()
            self.links.append(self.current_link)
            self.current_link = None


def local_target(page, reference):
    """Resolve a link as GitHub Pages does, under a non-root project path."""
    reference = unescape(reference.strip())
    if not reference or reference.startswith(("#", "data:", "mailto:", "tel:")):
        return None
    require(not re.match(r"(?:file:|javascript:|[A-Za-z]:[\\/])", reference),
            f"{page}: unsafe or machine-local reference {reference!r}")
    parts = urlsplit(reference)
    if parts.scheme or parts.netloc:
        require(parts.hostname not in ("localhost", "127.0.0.1", "0.0.0.0"),
                f"{page}: local development host leaked into {reference!r}")
        return None
    require(not reference.startswith("/"),
            f"{page}: root-relative path loses the project deployment prefix: {reference}")
    address = urljoin(SITE_ROOT + page.as_posix(), reference)
    resolved = urlsplit(address)
    require(resolved.path.startswith("/hardware-dashboard/"),
            f"{page}: link escapes the project deployment directory: {reference}")
    target = ROOT / unquote(resolved.path.removeprefix("/hardware-dashboard/"))
    if target.is_dir():
        target /= "index.html"
    require(target.is_file(), f"{page}: missing local link/asset {reference} -> {target}")
    return target.relative_to(ROOT).as_posix()


def check_navigation(page, active):
    text = (ROOT / page).read_text(encoding="utf-8")
    matches = re.findall(r'<nav\b[^>]*class=[\"\'][^\"\']*\bsite-primary-nav\b[^\"\']*[\"\'][^>]*>(.*?)</nav>',
                         text, flags=re.S)
    require(len(matches) == 1, f"{page}: expected one shared navigation")
    parser = References()
    parser.feed(matches[0])
    require([link["text"] for link in parser.links] == ["Products", "Benchmarks", "Platforms"],
            f"{page}: shared navigation lost a section or changed its order")
    expected = ("index.html", "benchmarks/index.html", "platforms/index.html")
    for link, destination in zip(parser.links, expected):
        require(local_target(page, link["href"]) == destination,
                f"{page}: {link['text']} goes to the wrong page")
        require((link["active"] == "page") == (link["text"] == active),
                f"{page}: wrong active navigation item for {link['text']}")


def check_links(catalog):
    count = 0
    for path in sorted(PLATFORMS.glob("*.html")):
        page = path.relative_to(ROOT)
        text = path.read_text(encoding="utf-8")
        parser = References()
        parser.feed(text)
        for reference in parser.urls:
            local_target(page, reference)
            count += 1
        for reference in re.findall(r'url\(\s*[\"\']?([^\"\')]+)', text):
            local_target(page, reference)
    for model in catalog["models"]:
        local_target(Path("platforms/index.html"), model["guide"])
    check_navigation(Path("index.html"), "Products")
    check_navigation(Path("benchmarks/index.html"), "Benchmarks")
    for name in PAGE_NAMES:
        check_navigation(Path("platforms") / name, "Platforms")
    alias = (PLATFORMS / "amd-platform-finder.html").read_text(encoding="utf-8")
    require("location.search" in alias and "location.hash" in alias and
            ("replace(" in alias or "replace (" in alias),
            "Legacy finder route must replace itself and preserve search/hash state")
    require("index.html" in alias, "Legacy finder route must target the canonical index")
    print(f"PASS: {count} static references and all eight shared navigation surfaces retain the deployment prefix")


def check_preservation(manifest, catalog, provenance):
    review = validate_art_revision(catalog, PROVENANCE.parent)
    actual_models = {model["id"]: model for model in catalog["models"]}
    require(len(actual_models) == len(catalog["models"]), "Duplicate platform model IDs")
    require(set(actual_models) == set(provenance["models"]), "Reviewed model roster changed")
    require(manifest["modelCount"] == len(actual_models), "Manifest model count is stale")
    require(manifest["oemCounts"] == dict(Counter(model["oem"] for model in actual_models.values())),
            "Manifest OEM counts are stale")
    require(manifest["claimRecordCount"] == len(catalog["sources"]), "Source count is stale")
    print(f"PASS: all {len(actual_models)} hardware profiles and original source evidence are unchanged; artwork changes match the reviewed revision")


def check_current_evidence(manifest):
    page_hashes = manifest["pageHashes"]
    require(set(page_hashes) == set(PAGE_NAMES), "Integrated manifest must cover all six canonical pages")
    for name, expected in page_hashes.items():
        require(digest((PLATFORMS / name).read_bytes()) == expected,
                f"{name}: page differs from the integrated build manifest")
    expected_build = digest("\n".join(name + "\0" + value for name, value in page_hashes.items()).encode("utf-8"))
    require(manifest["buildHash"] == expected_build, "Integrated page build hash is stale")
    for name in REPORTS:
        report = read_json(PLATFORMS / name)
        require(report.get("failed") == 0 and report.get("exitCode", 0) == 0,
                f"{name}: retained semantic/review suite did not pass")
        require(report.get("catalogHash") == manifest["contentHash"] and
                report.get("buildHash") == manifest["buildHash"],
                f"{name}: report does not apply to this integrated build")
    review = read_json(PLATFORMS / "spec-verification.json")
    require(review.get("catalogHash") == manifest["contentHash"] and
            review.get("buildHash") == manifest["buildHash"],
            "Specification-review report is not tied to the integrated build")
    for name in ("implementation-evaluation.json", "integration-browser-results.json"):
        path = PLATFORMS / name
        if path.exists():
            report = read_json(path)
            if report.get("status") == "PASS":
                require(report.get("catalogHash") == manifest["contentHash"] and
                        report.get("buildHash") == manifest["buildHash"],
                        f"{name}: prior browser/release PASS must not certify changed pages")
    require(not (PLATFORMS / "release-browser-results.json").exists(),
            "Standalone source browser results must not masquerade as integration results")
    print("PASS: canonical pages and five retained semantic/review suites share this exact build hash")


def main():
    try:
        subprocess.run([sys.executable, str(ROOT / "tools/build-platform-guides.py"), "--check"],
                       cwd=ROOT, check=True, timeout=600)
        manifest = read_json(PLATFORMS / "build-manifest.json")
        catalog = read_json(PLATFORMS / "platform-catalog.json")
        provenance = read_json(PROVENANCE)
        check_preservation(manifest, catalog, provenance)
        check_links(catalog)
        check_current_evidence(manifest)
    except (AssertionError, OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
        print(f"Platform guide integration FAILED: {exc}", file=sys.stderr)
        return 1
    print("Platform guide integration PASS: deterministic package, preserved facts, reviewed artwork, portable links and current evidence")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
