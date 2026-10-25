#!/usr/bin/env python3
"""
Unit test suite for Antigravity safety_guard.py.
Tests all dangerous command variations identified in the security audit.
CRITICAL: These tests only pass payloads to safety_guard.py; they NEVER execute the commands.
"""
import sys
import json
import subprocess
import os

SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "safety_guard.py")

def run_guard(payload_str: str) -> dict:
    proc = subprocess.run(
        [sys.executable, SCRIPT_PATH],
        input=payload_str,
        text=True,
        capture_output=True,
        timeout=5,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"safety_guard.py failed with code {proc.returncode}: {proc.stderr}")
    return json.loads(proc.stdout.strip())

def make_payload(cmd: str) -> str:
    return json.dumps({
        "toolCall": {
            "name": "run_command",
            "args": {
                "CommandLine": cmd
            }
        }
    })

def main():
    test_cases = [
        # (Command, Expected Decision, Description)
        # --- Dangerous variations identified in audit ---
        ("rm -rf /", "deny", "Direct root deletion"),
        ("rm -r -f /", "deny", "Root deletion with split flags -r -f"),
        ("rm -f -r /", "deny", "Root deletion with split flags -f -r"),
        ("rm -rf /*", "deny", "Root wildcard deletion /*"),
        ("rm -rf *", "deny", "Current directory wipe *"),
        ("rm -r -f *", "deny", "Current directory wipe with split flags"),
        ("rm -rf .", "deny", "Current directory wipe ."),
        ("rm -rf ~", "deny", "Home directory deletion ~"),
        ("rm -rf ~/*", "deny", "Home wildcard deletion ~/*"),
        ("rm -rf $HOME", "deny", "Home env deletion"),
        ("git reset --hard", "deny", "Direct hard reset"),
        ("git reset HEAD~1 --hard", "deny", "Hard reset with positional ref before flag"),
        ("git reset --hard HEAD~1", "deny", "Hard reset with positional ref after flag"),
        ("git push origin main -f", "deny", "Force push with shorthand -f"),
        ("git push -f origin main", "deny", "Force push shorthand preceding remote"),
        ("git push origin +main", "deny", "Force push with git refspec + syntax"),
        ("git push origin +HEAD:main", "deny", "Force push with refspec mapping"),
        ("git clean -f -d", "deny", "Git clean with split flags -f -d"),
        ("git clean -fd", "deny", "Git clean with grouped flags -fd"),
        ("git clean -x -f", "deny", "Git clean with ignored files flag -x -f"),
        ("git clean -fx", "deny", "Git clean with grouped -fx"),
        ("echo 123 && rm -rf /", "deny", "Compound command with dangerous root deletion"),
        ("git status; git reset --hard", "deny", "Compound command with semicolon separator"),
        
        # --- Safe commands that should be permitted ---
        ("git status", "allow", "Safe git status query"),
        ("git diff", "allow", "Safe git diff query"),
        ("git branch -a", "allow", "Safe git branch list"),
        ("bun run build", "allow", "Build command"),
        ("bun run lint", "allow", "Lint command"),
        ("npm test", "allow", "Test runner"),
        ("rm -rf .next", "allow", "Deleting local build artifact folder"),
        ("rm temp.txt", "allow", "Deleting non-critical single file without recursive flag"),
    ]

    failed = 0
    passed = 0

    print("Running safety_guard test suite...")
    for cmd, expected, desc in test_cases:
        res = run_guard(make_payload(cmd))
        actual = res.get("decision")
        if actual != expected:
            print(f"  [FAIL] {desc}: got '{actual}', expected '{expected}' (cmd: '{cmd}')")
            failed += 1
        else:
            print(f"  [PASS] {desc}")
            passed += 1

    # Test malformed JSON fallback
    res_bad_json = run_guard("this is not valid json")
    if res_bad_json.get("decision") == "ask":
        print("  [PASS] Malformed JSON fails safe with decision 'ask'")
        passed += 1
    else:
        print(f"  [FAIL] Malformed JSON: got '{res_bad_json.get('decision')}', expected 'ask'")
        failed += 1

    print(f"\nResults: {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
