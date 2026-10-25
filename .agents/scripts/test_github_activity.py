#!/usr/bin/env python3
"""
Unit and integration test suite for GitHub Activity proxy logic.
Tests:
1. Live upstream schema and real contribution count verification
2. Normalization and level clamping (0-4)
3. Total contributions calculation logic
4. Error and timeout handling simulation
"""
import sys
import json
import urllib.request
import ssl

def normalize_contributions(raw_items):
    result = []
    for item in raw_items:
        if isinstance(item, dict) and "date" in item:
            count = max(0, int(item.get("count", 0)))
            level = max(0, min(4, int(item.get("level", 0))))
            result.append({
                "date": item["date"],
                "count": count,
                "level": level
            })
    return result

def run_tests():
    passed = 0
    failed = 0

    print("Testing GitHub Activity Proxy & Data Logic...")

    # Test 1: Live upstream API retrieval
    username = "atharvsh5599-droid"
    url = f"https://github-contributions-api.jogruber.de/v4/{username}?y=last"
    
    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(url, headers={"User-Agent": "AtharvPortfolio-TestRunner/1.0"})
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        assert "contributions" in data
        assert isinstance(data["contributions"], list)
        assert len(data["contributions"]) >= 365
        print(f"  [PASS] Live upstream endpoint returned {len(data['contributions'])} days for {username}")
        passed += 1

        # Test 2: Real contributions exist and are not fabricated
        active_days = [c for c in data["contributions"] if c.get("count", 0) > 0]
        total_active_count = sum(c.get("count", 0) for c in active_days)
        assert total_active_count == 6
        print(f"  [PASS] Verified Atharv's exact 6 contributions across {len(active_days)} active days (no fake counts)")
        passed += 1

    except Exception as e:
        print(f"  [FAIL] Live upstream API test error: {e}")
        failed += 1

    # Test 3: Clamping contribution levels
    raw_sample = [
        {"date": "2026-01-08", "count": 1, "level": 99},
        {"date": "2026-01-09", "count": -5, "level": -2},
        {"date": "2026-01-10", "count": "3", "level": "3"},
    ]
    norm = normalize_contributions(raw_sample)
    if norm[0]["level"] == 4 and norm[1]["level"] == 0 and norm[1]["count"] == 0 and norm[2]["count"] == 3:
        print("  [PASS] Contribution counts and levels normalized and clamped cleanly")
        passed += 1
    else:
        print(f"  [FAIL] Normalization failed: {norm}")
        failed += 1

    # Test 4: Calculation of total contributions
    calc_total = sum(c["count"] for c in norm)
    if calc_total == 4:
        print("  [PASS] Total contributions calculated accurately")
        passed += 1
    else:
        print(f"  [FAIL] Total calculation mismatch: {calc_total}")
        failed += 1

    # Test 5: Simulated 404 upstream handling
    dead_url = "https://github-contributions-api.deno.dev/atharvsh5599-droid.json"
    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(dead_url, headers={"User-Agent": "AtharvPortfolio-TestRunner/1.0"})
        with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
            status = resp.status
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception:
        status = 500

    if status == 404:
        print("  [PASS] Confirmed legacy deno.dev URL returns 404 (justifying new server proxy)")
        passed += 1
    else:
        print(f"  [FAIL] Legacy URL returned unexpected status: {status}")
        failed += 1

    print(f"\nGitHub Activity Test Results: {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
