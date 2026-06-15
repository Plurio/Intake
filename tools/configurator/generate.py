#!/usr/bin/env python3
"""
Intake Configurator — generate.py
Generates a standalone HTML snippet or GTM container JSON for @plurio/intake.

Usage:
  python3 generate.py --fetch-version
  python3 generate.py --mode standalone --interview /tmp/intake_configurator.json [--version 2.2.0] [--preview] [--out PATH]
  python3 generate.py --mode gtm        --interview /tmp/intake_configurator.json [--version 2.2.0] [--preview] [--out PATH]
"""

import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

CDN_STANDALONE = "https://cdn.jsdelivr.net/npm/@plurio/intake@{version}/dist/intake.js"
CDN_GTM = "https://cdn.jsdelivr.net/npm/@plurio/intake@{version}/dist/intake.gtm.js"
NPM_REGISTRY = "https://registry.npmjs.org/@plurio/intake/latest"

SOCIAL_REFERRALS = [
    {"host": "facebook.com",  "medium": "social", "display": "facebook"},
    {"host": "instagram.com", "medium": "social", "display": "instagram"},
    {"host": "linkedin.com",  "medium": "social", "display": "linkedin"},
    {"host": "twitter.com",   "medium": "social", "display": "twitter"},
    {"host": "x.com",         "medium": "social", "display": "twitter"},
    {"host": "youtube.com",   "medium": "social", "display": "youtube"},
    {"host": "tiktok.com",    "medium": "social", "display": "tiktok"},
]


def fetch_version():
    try:
        req = urllib.request.Request(NPM_REGISTRY, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read())
            return data["version"]
    except Exception:
        return "latest"


def fetch_gtm_script(version):
    """Fetch the inline GTM build from jsDelivr. Returns JS source or None on failure."""
    url = CDN_GTM.format(version=version)
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return response.read().decode("utf-8")
    except Exception:
        return None


def build_config(interview):
    config = {}

    # --- Cookie & session ---
    if interview.get("domain"):
        config["domain"] = interview["domain"]
    if interview.get("lifetime") is not None:
        config["lifetime"] = interview["lifetime"]
    if interview.get("session_length") is not None:
        config["session_length"] = interview["session_length"]
    if interview.get("referral_starts_new_session"):
        config["referral_starts_new_session"] = True
    if interview.get("timezone_offset") is not None:
        config["timezone_offset"] = interview["timezone_offset"]

    # --- Consent mode ---
    if interview.get("consent_mode"):
        cm = {
            "enabled": True,
            "default_consent": interview.get("consent_default", "denied"),
            "url_passthrough": interview.get("url_passthrough", True),
        }
        if interview.get("consent_event_names"):
            cm["event_names"] = interview["consent_event_names"]
        config["consent_mode"] = cm

    # --- PII collection ---
    pii = {"enabled": interview.get("pii_collection_enabled", True)}
    if interview.get("pii_email_selectors"):
        pii["email_selectors"] = interview["pii_email_selectors"]
    if interview.get("pii_phone_selectors"):
        pii["phone_selectors"] = interview["pii_phone_selectors"]
    config["pii_collection"] = pii

    # --- Analytics IDs ---
    analytics = {}
    if interview.get("analytics_ga4", True):
        analytics["google_analytics"] = True
    if analytics:
        config["analytics_ids"] = analytics

    # --- GTM dataLayer ---
    config["data_layer"] = interview.get("data_layer", True)

    # --- SPA ---
    if interview.get("spa"):
        config["spa_tracking"] = True

    # --- User ID ---
    if interview.get("user_id_source"):
        uid = {"source": interview["user_id_source"]}
        if interview.get("user_id_key"):
            uid["key"] = interview["user_id_key"]
        config["user_id"] = uid

    # --- User IP ---
    if interview.get("user_ip"):
        config["user_ip"] = interview["user_ip"]

    # --- Promocode ---
    if interview.get("promocode") is not None:
        config["promocode"] = interview["promocode"]

    # --- Referrals (defaults + custom) ---
    referrals = list(SOCIAL_REFERRALS)
    if interview.get("custom_referrals"):
        referrals.extend(interview["custom_referrals"])
    config["referrals"] = referrals

    # --- Organics ---
    if interview.get("organics"):
        config["organics"] = interview["organics"]

    # --- Typein attributes ---
    if interview.get("typein_attributes"):
        config["typein_attributes"] = interview["typein_attributes"]

    # --- Custom UTM fallback params ---
    if interview.get("campaign_param"):
        config["campaign_param"] = interview["campaign_param"]
    if interview.get("term_param"):
        config["term_param"] = interview["term_param"]
    if interview.get("content_param"):
        config["content_param"] = interview["content_param"]

    # --- In-app browser detection ---
    if interview.get("in_app_browsers") is not None:
        config["in_app_browsers"] = interview["in_app_browsers"]

    # --- Link decoration ---
    if interview.get("link_decoration"):
        config["link_decoration"] = interview["link_decoration"]

    return config


def format_config_js(config, indent=2):
    """Serialize config as indented JSON, then unquote simple identifier keys."""
    raw = json.dumps(config, indent=2, ensure_ascii=False)
    lines = raw.split("\n")
    padded = [lines[0]] + [(" " * indent) + line for line in lines[1:]]
    js = "\n".join(padded)
    js = re.sub(r'"([a-zA-Z_][a-zA-Z0-9_]*)":', r"\1:", js)
    return js


def generate_standalone(interview, version):
    src = CDN_STANDALONE.format(version=version)
    config = build_config(interview)
    config_js = format_config_js(config, indent=2)

    return (
        f"<!-- Plurio Intake v{version} | https://intake.plurio.ai -->\n"
        f"<!-- Config reference: https://github.com/plurio/Intake/blob/main/CONFIGURATION.md -->\n"
        f'<script src="{src}"></script>\n'
        f"<script>\n"
        f"  intk.init({config_js});\n"
        f"</script>"
    )


def generate_gtm_container(interview, version):
    config = build_config(interview)
    config_js = format_config_js(config, indent=4)

    # Inline the GTM build — no runtime CDN dependency
    gtm_js = fetch_gtm_script(version)
    if gtm_js:
        library_html = f"<script>\n{gtm_js}\n</script>"
    else:
        # Fallback to src reference if fetch fails
        print("Warning: could not fetch intake.gtm.js — falling back to <script src>", file=sys.stderr)
        library_html = f'<script src="{CDN_GTM.format(version=version)}"></script>'

    config_html = f"<script>\n  intk.init({config_js});\n</script>"

    export_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    container = {
        "exportFormatVersion": 2,
        "exportTime": export_time,
        "containerVersion": {
            "path": "accounts/0/containers/0/versions/0",
            "accountId": "0",
            "containerId": "0",
            "containerVersionId": "0",
            "container": {
                "path": "accounts/0/containers/0",
                "accountId": "0",
                "containerId": "0",
                "name": "Intake",
                "publicId": "GTM-XXXXXXX",
                "usageContext": ["WEB"],
                "fingerprint": "0",
                "tagManagerUrl": "https://tagmanager.google.com/",
            },
            "tag": [
                {
                    "accountId": "0",
                    "containerId": "0",
                    "tagId": "1",
                    "name": "Intake – Library",
                    "type": "html",
                    "parameter": [
                        {"type": "TEMPLATE", "key": "html", "value": library_html},
                        {"type": "BOOLEAN", "key": "supportDocumentWrite", "value": "false"},
                    ],
                    "fingerprint": "0",
                    "firingTriggerId": ["1"],
                    "tagFiringOption": "ONCE_PER_EVENT",
                    "monitoringMetadata": {"type": "MAP"},
                    "consentSettings": {"consentStatus": "NOT_SET"},
                },
                {
                    "accountId": "0",
                    "containerId": "0",
                    "tagId": "2",
                    "name": "Intake – Config",
                    "type": "html",
                    "parameter": [
                        {"type": "TEMPLATE", "key": "html", "value": config_html},
                        {"type": "BOOLEAN", "key": "supportDocumentWrite", "value": "false"},
                    ],
                    "setupTag": [
                        {"tagName": "Intake – Library", "stopOnSetupFailure": True}
                    ],
                    "fingerprint": "0",
                    "firingTriggerId": ["1"],
                    "tagFiringOption": "ONCE_PER_EVENT",
                    "monitoringMetadata": {"type": "MAP"},
                    "consentSettings": {"consentStatus": "NOT_SET"},
                },
            ],
            "trigger": [
                {
                    "accountId": "0",
                    "containerId": "0",
                    "triggerId": "1",
                    "name": "Intake – All Pages",
                    "type": "PAGEVIEW",
                    "fingerprint": "0",
                },
            ],
            "variable": [],
            "fingerprint": "0",
        },
    }

    return json.dumps(container, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="Plurio Intake config generator")
    parser.add_argument("--fetch-version", action="store_true", help="Print latest NPM version and exit")
    parser.add_argument("--mode", choices=["standalone", "gtm"], help="Output mode")
    parser.add_argument("--interview", default="/tmp/intake_configurator.json", help="Path to interview JSON")
    parser.add_argument("--version", help="Override library version (default: latest)")
    parser.add_argument("--preview", action="store_true", help="Print only the intk.init() config block, no file output")
    parser.add_argument("--out", help="Output file path (overrides default)")
    args = parser.parse_args()

    if args.fetch_version:
        print(fetch_version())
        return

    if not args.mode:
        print("Error: --mode is required", file=sys.stderr)
        sys.exit(1)

    try:
        with open(args.interview) as f:
            interview = json.load(f)
    except FileNotFoundError:
        interview = {}
    except json.JSONDecodeError as e:
        print(f"Error: invalid JSON in {args.interview}: {e}", file=sys.stderr)
        sys.exit(1)

    version = args.version or "latest"

    if args.preview:
        config = build_config(interview)
        print(f"intk.init({format_config_js(config, indent=2)});")
        return

    downloads = os.path.join(os.path.expanduser("~"), "Downloads")
    if args.mode == "standalone":
        output = generate_standalone(interview, version)
        out_file = args.out or os.path.join(downloads, "intake-snippet.html")
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(output + "\n")
        print(f"Saved to: {out_file}")
        print()
        print(output)
    else:
        output = generate_gtm_container(interview, version)
        out_file = args.out or os.path.join(downloads, "intake-gtm-container.json")
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(output + "\n")
        print(f"Saved to: {out_file}")
        print()
        print(output)


if __name__ == "__main__":
    main()
