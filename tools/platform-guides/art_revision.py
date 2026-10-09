"""Enforce reviewed artwork changes while keeping every hardware/support fact unchanged."""
import hashlib
import json


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def digest(value):
    return hashlib.sha256(value).hexdigest()


def protected_catalog(catalog):
    data = {k: v for k, v in catalog.items() if k not in ("models", "manifest")}
    data["models"] = [{k: v for k, v in m.items() if k not in ("art", "illustration")} for m in catalog["models"]]
    return data


def validate_art_revision(catalog, package):
    baseline = json.loads((package / "art-review-baseline.json").read_text(encoding="utf-8"))
    review = json.loads((package / "src" / "approved-art-revision.json").read_text(encoding="utf-8"))
    if digest(canonical(protected_catalog(catalog))) != baseline["protectedCatalogSha256"]:
        raise ValueError("Artwork revision changed a protected hardware, support, generation, lifecycle or source field")
    models = {m["id"]: m for m in catalog["models"]}
    if set(models) != set(baseline["models"]):
        raise ValueError("Artwork revision changed the model roster")
    changed = set()
    for model_id, model in models.items():
        before = baseline["models"][model_id]
        art_hash = digest(model["art"].encode("utf-8"))
        evidence_hash = digest(canonical(model["illustration"]))
        if (art_hash, evidence_hash) == (before["artSha256"], before["illustrationSha256"]):
            continue
        changed.add(model_id)
        approval = review["changes"].get(model_id)
        if not approval:
            raise ValueError(f"{model_id}: drawing/evidence changed without a recorded visual review")
        if approval["artSha256"] != art_hash or approval["illustrationSha256"] != evidence_hash:
            raise ValueError(f"{model_id}: drawing differs from its reviewed revision")
        if approval["previousArtSha256"] != before["artSha256"]:
            raise ValueError(f"{model_id}: visual review does not describe the imported drawing")
        if model["illustration"]["reviewStatus"] != "verified":
            raise ValueError(f"{model_id}: replacement is still a schematic")
        for key in ("sourceUrl", "locator", "reviewMethod", "reviewedAt"):
            if not model["illustration"].get(key):
                raise ValueError(f"{model_id}: missing visual review field {key}")
    if changed != set(review["changes"]):
        raise ValueError("Artwork review contains stale or unapplied model changes")
    return review
