#!/usr/bin/env python3
"""
Unit and integration test suite for GeeksforGeeks heatmap logic.
Tests:
1. Rolling calendar date normalization
2. Zero-activity generation strictly within coverage boundaries
3. Preserving non-zero counts and levels
4. Upstream response parsing and failure fallback behavior
"""
import sys
import datetime
import json
import urllib.request
import ssl

def format_iso(d: datetime.date) -> str:
    return d.strftime("%Y-%m-%d")

def build_rolling_calendar(active_contributions, coverage_start, coverage_end, ref_today=None):
    if ref_today is None:
        ref_today = datetime.date.today()
    
    active_map = {item["date"]: item for item in active_contributions if "date" in item}
    one_year_ago = ref_today - datetime.timedelta(days=364)
    
    result = []
    curr = one_year_ago
    while curr <= ref_today:
        d_str = format_iso(curr)
        if d_str in active_map:
            entry = active_map[d_str]
            level = max(0, min(4, int(entry.get("level", 0))))
            result.append({
                "date": d_str,
                "count": max(0, int(entry.get("count", 0))),
                "level": level
            })
        elif coverage_start <= d_str <= coverage_end:
            result.append({
                "date": d_str,
                "count": 0,
                "level": 0
            })
        else:
            # Excluded: outside verified coverage window
            pass
        curr += datetime.timedelta(days=1)
        
    return result

def run_tests():
    passed = 0
    failed = 0

    print("Testing GeeksforGeeks Heatmap Data & Date Logic...")

    # Test 1: Rolling window length and coverage
    ref_today = datetime.date(2026, 10, 25)
    coverage_start = "2024-01-01"
    coverage_end = "2026-10-25"
    sample_active = [
        {"date": "2026-10-25", "count": 3, "level": 3},
        {"date": "2026-05-15", "count": 1, "level": 1},
    ]

    cal = build_rolling_calendar(sample_active, coverage_start, coverage_end, ref_today)
    if len(cal) == 365:
        print("  [PASS] 365-day rolling window generated successfully")
        passed += 1
    else:
        print(f"  [FAIL] Expected 365 days, got {len(cal)}")
        failed += 1

    # Test 2: Active days preserve non-zero counts
    last_day = cal[-1]
    if last_day["date"] == "2026-10-25" and last_day["count"] == 3 and last_day["level"] == 3:
        print("  [PASS] Active day preserves exact non-zero count and level")
        passed += 1
    else:
        print(f"  [FAIL] Active day mismatch: {last_day}")
        failed += 1

    # Test 3: Unrecorded day within coverage window is 0
    day_before = cal[-2]
    if day_before["date"] == "2026-10-24" and day_before["count"] == 0 and day_before["level"] == 0:
        print("  [PASS] Zero activity day within coverage correctly assigned 0")
        passed += 1
    else:
        print(f"  [FAIL] Zero activity day mismatch: {day_before}")
        failed += 1

    # Test 4: Dates outside coverage window are NOT assumed to be 0
    recent_coverage_start = "2026-06-01"
    partial_cal = build_rolling_calendar(sample_active, recent_coverage_start, coverage_end, ref_today)
    # Days before 2026-06-01 should not be in partial_cal (unless active)
    old_inactive = [d for d in partial_cal if d["date"] == "2026-01-15"]
    if len(old_inactive) == 0:
        print("  [PASS] Pre-coverage dates are omitted rather than fabricated as zero")
        passed += 1
    else:
        print(f"  [FAIL] Pre-coverage date fabricated: {old_inactive}")
        failed += 1

    # Test 5: Clamping level values
    overflow_active = [{"date": "2026-10-25", "count": 20, "level": 99}]
    clamped_cal = build_rolling_calendar(overflow_active, coverage_start, coverage_end, ref_today)
    if clamped_cal[-1]["level"] == 4:
        print("  [PASS] Contribution level clamped to maxLevel (4)")
        passed += 1
    else:
        print(f"  [FAIL] Level not clamped: {clamped_cal[-1]['level']}")
        failed += 1

    # Test 6: Leap year handling
    leap_today = datetime.date(2024, 3, 1) # 2024 is leap year
    leap_cal = build_rolling_calendar([], "2023-01-01", "2024-03-01", leap_today)
    has_feb29 = any(d["date"] == "2024-02-29" for d in leap_cal)
    if has_feb29 and len(leap_cal) == 365:
        print("  [PASS] Leap year February 29 handled accurately")
        passed += 1
    else:
        print(f"  [FAIL] Leap year handling failed: has_feb29={has_feb29}, len={len(leap_cal)}")
        failed += 1

    # Test 7: Live upstream endpoint schema contract
    try:
        ctx = ssl._create_unverified_context()
        headers = {"User-Agent": "AtharvPortfolio-TestRunner/1.0"}
        url = "https://gfg-stats.tashif.codes/as9817467007/heatmap"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        assert data.get("status") == "success"
        d = data.get("data", {})
        assert "totalSubmissions" in d
        assert "totalActiveDays" in d
        assert "dailyContributions" in d
        print(f"  [PASS] Live GFG API contract verified: {d.get('totalSubmissions')} total problems, {d.get('totalActiveDays')} active days")
        passed += 1
    except Exception as e:
        print(f"  [FAIL] Live GFG API contract verification error: {e}")
        failed += 1

    print(f"\nHeatmap Test Results: {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
