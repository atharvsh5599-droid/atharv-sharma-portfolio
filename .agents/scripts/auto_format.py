#!/usr/bin/env python3
import sys
import json
import shutil
import subprocess

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({}))
            return

        payload = json.loads(raw_input)
        tool_call = payload.get("toolCall", {})
        tool_name = tool_call.get("name", "")
        args = tool_call.get("args", {})

        if tool_name in ("edit_file", "write_file"):
            file_path = args.get("Path", "")
            if file_path and any(file_path.endswith(ext) for ext in [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".css"]):
                # Try prettier if available in environment
                prettier_bin = shutil.which("prettier") or shutil.which("bunx")
                if prettier_bin:
                    if "prettier" in prettier_bin:
                        subprocess.run([prettier_bin, "--write", file_path], capture_output=True, timeout=10)
                    elif "bunx" in prettier_bin:
                        subprocess.run([prettier_bin, "prettier", "--write", file_path], capture_output=True, timeout=10)

        print(json.dumps({}))
    except Exception:
        # Always output valid JSON to comply with PostToolUse hook contract
        print(json.dumps({}))

if __name__ == "__main__":
    main()
