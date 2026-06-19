#!/usr/bin/env python3
"""Tests for generate.py — run with:  python3 -m unittest discover -s tools/configurator

No third-party deps; stdlib unittest only. Network calls are avoided by passing an
explicit version everywhere, so these run offline.
"""

import json
import unittest

import generate


# Top-level keys accepted by IntkConfig (src/types/index.ts). If the library adds a
# new option, mirror it here AND in build_config — this test is the drift tripwire.
INTKCONFIG_KEYS = {
    "lifetime", "session_length", "timezone_offset",
    "campaign_param", "term_param", "content_param",
    "user_ip", "promocode", "typein_attributes", "domain",
    "organics", "referrals", "referral_starts_new_session",
    "in_app_browsers", "analytics_ids", "pii_collection",
    "user_id", "spa_tracking", "data_layer", "consent_mode",
    "link_decoration", "callback",
}


class BuildConfigKeys(unittest.TestCase):
    def test_keys_are_subset_of_schema(self):
        """build_config must never emit a key the library does not understand."""
        for interview in ({}, {
            "domain": "example.com", "consent_mode": True, "consent_default": "denied",
            "url_passthrough": True, "pii_collection_enabled": True, "analytics_ga4": True,
            "data_layer": True, "spa": False, "user_id_source": "dataLayer",
            "user_id_key": "userId", "user_ip": "1.2.3.4", "promocode": True,
            "custom_referrals": [{"host": "t.me", "medium": "social", "display": "telegram"}],
            "organics": [{"host": "kagi.com", "param": "q", "display": "kagi"}],
            "typein_attributes": {"source": "(direct)", "medium": "(none)"},
            "campaign_param": "ref", "term_param": "kw", "content_param": "ad",
            "in_app_browsers": False,
            "link_decoration": {"enabled": True, "allowedDomains": ["partner.com"]},
            "lifetime": 12, "session_length": 45, "timezone_offset": 3,
            "referral_starts_new_session": True, "consent_event_names": ["OneTrustGroupsUpdated"],
        }):
            extra = set(generate.build_config(interview)) - INTKCONFIG_KEYS
            self.assertEqual(extra, set(), f"unknown keys emitted: {extra}")


class SpaTracking(unittest.TestCase):
    def test_spa_no_disables_explicitly(self):
        # Regression: answering "No" must emit spa_tracking=false, not omit it
        # (library default is ON, so omitting would leave it running).
        self.assertEqual(generate.build_config({"spa": False})["spa_tracking"], False)

    def test_spa_yes_enables(self):
        self.assertEqual(generate.build_config({"spa": True})["spa_tracking"], True)

    def test_spa_unspecified_is_omitted(self):
        self.assertNotIn("spa_tracking", generate.build_config({}))


class GtmContainer(unittest.TestCase):
    def test_container_is_valid_json_and_shaped(self):
        raw = generate.generate_gtm_container({"spa": False}, version="2.2.0")
        container = json.loads(raw)  # must parse
        self.assertEqual(container["exportFormatVersion"], 2)
        cv = container["containerVersion"]
        self.assertEqual(len(cv["tag"]), 2)
        self.assertEqual(len(cv["trigger"]), 1)
        names = {t["name"] for t in cv["tag"]}
        self.assertEqual(names, {"Intake – Library", "Intake – Config"})


class Validation(unittest.TestCase):
    def test_bad_consent_default(self):
        self.assertTrue(generate.validate_interview({"consent_default": "maybe"}))

    def test_user_id_source_requires_key(self):
        self.assertTrue(generate.validate_interview({"user_id_source": "cookie"}))
        self.assertFalse(
            generate.validate_interview({"user_id_source": "cookie", "user_id_key": "uid"})
        )

    def test_malformed_in_app_browsers(self):
        self.assertTrue(generate.validate_interview({"in_app_browsers": ["Instagram"]}))
        self.assertFalse(
            generate.validate_interview(
                {"in_app_browsers": [{"pattern": "Instagram", "source": "instagram"}]}
            )
        )

    def test_clean_interview_passes(self):
        self.assertEqual(generate.validate_interview({"spa": False, "consent_default": "denied"}), [])


if __name__ == "__main__":
    unittest.main()
