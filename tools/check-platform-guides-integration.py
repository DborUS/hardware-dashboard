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


class ShellElements(HTMLParser):
    """Track header ancestry without executing the inline guide applications."""
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
            "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.stack = []

    def handle_starttag(self, tag, attributes):
        element = {"tag": tag, "attrs": dict(attributes),
                   "parents": tuple(self.stack), "text": ""}
        self.elements.append(element)
        if tag not in self.VOID:
            self.stack.append(element)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        for element in self.stack:
            element["text"] += data

    def find(self, *, cls=None, ident=None, tag=None, within=None):
        return [element for element in self.elements
                if (cls is None or cls in element["attrs"].get("class", "").split())
                and (ident is None or element["attrs"].get("id") == ident)
                and (tag is None or element["tag"] == tag)
                and (within is None or any(parent is within for parent in element["parents"]))]


def check_site_shell(manifest):
    """Prevent the Platforms area from drifting into a separately branded app."""
    version = manifest.get("siteVersion")
    require(version == "0.0.5", "Integrated manifest lost the current ChipIndex site version")
    release_script = (ROOT / "js/site-updates.js").read_text(encoding="utf-8")
    require(re.search(r"const\s+releaseVersion\s*=\s*['\"]" + re.escape(version) + r"['\"]", release_script),
            "Shared release history and integration manifest disagree on the site version")
    expected_assets = {"../css/site-shell.css": "20261009-cohesive-platforms-1",
                       "../js/site-updates.js": "20261009-release-005"}
    surfaces = [Path("index.html"), Path("benchmarks/index.html")]
    surfaces.extend(Path("platforms") / name for name in PAGE_NAMES)
    for page in surfaces:
        document = ShellElements()
        document.feed((ROOT / page).read_text(encoding="utf-8"))
        headers = document.find(cls="chipindex-site-header")
        require(len(headers) == 1, f"{page}: expected one shared ChipIndex header wrapper")
        header = headers[0]
        require(len(document.find(cls="topbar", within=header)) == 1,
                f"{page}: expected one shared topbar inside the ChipIndex header")
        require(len(document.find(cls="site-primary-nav", within=header)) == 1,
                f"{page}: primary section navigation must stay in the common header")
        brands = document.find(cls="brand-lockup")
        versions = document.find(cls="brand-lockup-version")
        require(len(brands) == len(versions) == 1,
                f"{page}: expected one identity and one visible site version")
        require(any(parent is header for parent in brands[0]["parents"]) and
                versions[0]["text"].strip() == f"Public beta {version}" and
                f"public beta {version}" in brands[0]["attrs"].get("aria-label", "").lower(),
                f"{page}: visual and accessible identity must expose the current site version")
        triggers = document.find(ident="whatsNewBtn")
        require(len(triggers) == 1, f"{page}: expected one What's new trigger")
        trigger = triggers[0]
        require(trigger["tag"] == "button" and trigger["text"].strip() == "What's new" and
                trigger["attrs"].get("aria-haspopup") == "dialog" and
                trigger["attrs"].get("aria-controls") == "whatsNewDialog" and
                trigger["attrs"].get("aria-expanded") == "false" and
                any(parent is header for parent in trigger["parents"]) and
                any("topbar-tools" in parent["attrs"].get("class", "").split()
                    for parent in trigger["parents"]),
                f"{page}: What's new must remain an accessible global-header action")
        for asset, revision in expected_assets.items():
            expected = (PLATFORMS / asset).resolve().relative_to(ROOT).as_posix()
            matches = []
            for element in document.elements:
                reference = (element["attrs"].get("src") if element["tag"] == "script" else
                             element["attrs"].get("href") if element["tag"] == "link" else None)
                if reference and urlsplit(reference).path.endswith(expected):
                    matches.append(reference)
            require(len(matches) == 1 and local_target(page, matches[0]) == expected and
                    urlsplit(matches[0]).query == "v=" + revision,
                    f"{page}: shared {expected} missing, duplicated or using a stale cache revision")
        require(not any("-field-guide.html" in element["attrs"].get("href", "")
                        for element in document.find(tag="a", within=header)),
                f"{page}: OEM guides belong in Platforms navigation, not the global header")
        if page.parent != Path("platforms"):
            continue
        local_nav = document.find(cls="platform-section-nav")
        require(len(local_nav) == 1 and
                not any(parent is header for parent in local_nav[0]["parents"]),
                f"{page}: expected a separate Platforms section navigation below the global header")
        menu = document.find(cls="learn-menu", within=local_nav[0])
        require(len(menu) == 1 and menu[0]["tag"] == "details",
                f"{page}: expected one keyboard-accessible OEM guides menu")
        finder_links = [link for link in document.find(tag="a", within=local_nav[0])
                        if not any(parent is menu[0] for parent in link["parents"])]
        finder_routes = [urlsplit(urljoin(SITE_ROOT + page.as_posix(),
                                         link["attrs"].get("href", ""))) for link in finder_links]
        require([route.fragment.split("?", 1)[0] for route in finder_routes] ==
                ["finder", "generations", "decode", "qualify"] and
                all(route.path in ("/hardware-dashboard/platforms/", "/hardware-dashboard/platforms/index.html")
                    for route in finder_routes),
                f"{page}: all four shared Platforms tools must retain their canonical Finder routes")
        guide_links = document.find(tag="a", within=menu[0])
        destinations = [local_target(page, link["attrs"].get("href", "")) for link in guide_links]
        require(destinations == ["platforms/" + name for name in PAGE_NAMES[1:]],
                f"{page}: OEM guides menu must expose all five guides in the established order")
        is_guide = page.name != "index.html"
        active_links = [link for link in guide_links if link["attrs"].get("aria-current") == "page"]
        require(len(active_links) == int(is_guide) and
                (not is_guide or local_target(page, active_links[0]["attrs"]["href"]) == page.as_posix()),
                f"{page}: OEM menu current-guide state is incorrect")
        require(not document.find(cls="sidebar") and not document.find(cls="chipindex-return"),
                f"{page}: obsolete standalone branding/navigation must not remain hidden in the page")
        if is_guide:
            require(len(document.find(cls="platform-guide-layout")) == 1 and
                    len(document.find(cls="platform-guide-rail")) == 1 and
                    len(document.find(ident="nav")) == 1,
                    f"{page}: guide needs its in-flow learning context and original lesson navigation")
            require(document.find(ident="crumb") and document.find(ident="modelDialog"),
                    f"{page}: guide lesson breadcrumb or model detail anchor was lost")
    print("PASS: all eight surfaces share the current ChipIndex identity, What's new and assets; OEM guides stay within Platforms")


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
    shared_hashes = manifest.get("sharedAssetHashes", {})
    require(set(shared_hashes) == {"../css/site-shell.css", "../js/site-updates.js"},
            "Integrated manifest must cover the common header and release-history assets")
    for reference, expected in shared_hashes.items():
        asset = (PLATFORMS / reference).resolve()
        require(asset.is_relative_to(ROOT) and asset.is_file() and digest(asset.read_bytes()) == expected,
                f"{reference}: shared shell asset differs from the integrated build manifest")
    expected_build = digest("\n".join(name + "\0" + value for name, value in
                                    [*page_hashes.items(), *shared_hashes.items()]).encode("utf-8"))
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
    print("PASS: canonical pages, shared header assets and five retained semantic/review suites share this exact build hash")


def main():
    try:
        subprocess.run([sys.executable, str(ROOT / "tools/build-platform-guides.py"), "--check"],
                       cwd=ROOT, check=True, timeout=600)
        manifest = read_json(PLATFORMS / "build-manifest.json")
        catalog = read_json(PLATFORMS / "platform-catalog.json")
        provenance = read_json(PROVENANCE)
        check_preservation(manifest, catalog, provenance)
        check_links(catalog)
        check_site_shell(manifest)
        check_current_evidence(manifest)
    except (AssertionError, OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
        print(f"Platform guide integration FAILED: {exc}", file=sys.stderr)
        return 1
    print("Platform guide integration PASS: deterministic package, preserved facts, reviewed artwork, portable links and current evidence")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
