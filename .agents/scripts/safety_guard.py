#!/usr/bin/env python3
"""
PreToolUse Safety Guard for Antigravity.
Intercepts 'run_command' tool calls to prevent destructive or dangerous operations.
Adheres strictly to the Antigravity PreToolUse hook contract.
"""
import sys
import json
import re
import shlex

CRITICAL_PATHS = {
    "",
    "/",
    "/*",
    "/root",
    "/bin",
    "/sbin",
    "/etc",
    "/usr",
    "/System",
    "/Library",
    "~",
    "~/",
    "~/*",
    "$HOME",
    "${HOME}",
    "*",
    ".",
    "./",
}

def is_recursive_rm_flag(arg: str) -> bool:
    if arg in ("-r", "-R", "--recursive"):
        return True
    if arg.startswith("-") and not arg.startswith("--") and any(c in "rR" for c in arg[1:]):
        return True
    return False

def is_force_rm_flag(arg: str) -> bool:
    if arg in ("-f", "--force"):
        return True
    if arg.startswith("-") and not arg.startswith("--") and any(c in "f" for c in arg[1:]):
        return True
    return False

def check_rm_command(tokens: list[str]) -> tuple[bool, str]:
    has_recursive = any(is_recursive_rm_flag(t) for t in tokens[1:])
    targets = [t for t in tokens[1:] if not t.startswith("-")]

    if not targets and has_recursive:
        return True, "Destructive command: recursive 'rm' without targets specified."

    for target in targets:
        norm_target = target.rstrip("/")
        if norm_target in CRITICAL_PATHS or target in CRITICAL_PATHS or target.startswith("/*") or target.startswith("~/*"):
            if has_recursive:
                return True, f"Destructive command blocked: recursive 'rm' on critical path or wildcard '{target}'."

    if has_recursive and any("*" in t for t in targets):
        return True, f"Destructive command blocked: recursive wildcard deletion 'rm {' '.join(targets)}'."

    return False, ""

def check_git_command(tokens: list[str]) -> tuple[bool, str]:
    if len(tokens) < 2:
        return False, ""

    subcmd = tokens[1]

    if subcmd == "reset":
        for arg in tokens[2:]:
            if arg == "--hard" or arg.startswith("--hard="):
                return True, "Destructive git operation blocked: 'git reset --hard' discards uncommitted changes."

    elif subcmd == "clean":
        has_force = False
        has_dir_or_ignored = False
        for arg in tokens[2:]:
            if arg in ("-f", "--force"):
                has_force = True
            elif arg.startswith("-") and not arg.startswith("--") and "f" in arg and any(c in "dx" for c in arg):
                return True, f"Destructive git clean blocked: 'git clean {arg}' forcibly removes untracked files/directories."
            elif arg.startswith("-") and not arg.startswith("--") and any(c in "dx" for c in arg):
                has_dir_or_ignored = True

        if has_force and has_dir_or_ignored:
            return True, "Destructive git clean blocked: 'git clean' with force and directory deletion flags."

    elif subcmd == "push":
        for arg in tokens[2:]:
            if arg in ("-f", "--force", "--force-with-lease", "--force-if-includes") or arg.startswith("--force-with-lease="):
                return True, f"Force-push blocked: 'git push' with '{arg}' can overwrite remote history."
            if arg.startswith("+") and len(arg) > 1 and not arg.startswith("++"):
                return True, f"Force-push blocked: 'git push' with refspec '{arg}' can overwrite remote history."

    return False, ""

def check_single_command(cmd_str: str) -> tuple[bool, str]:
    cmd_str = cmd_str.strip()
    if not cmd_str:
        return False, ""

    # Fast fallback regex checks for patterns that might attempt to evade shlex
    fallback_patterns = [
        (r"\brm\s+.*-(?:[a-zA-Z]*[rR][a-zA-Z]*)\s+(?:/\*?|~|\$HOME|\*|\.(?:\s|$|/))", "Recursive rm on critical path or wildcard"),
        (r"\brm\s+(?:/\*?|~|\$HOME|\*|\.(?:\s|$|/))\s+.*-(?:[a-zA-Z]*[rR][a-zA-Z]*)", "Recursive rm on critical path or wildcard"),
        (r"\bgit\s+reset\s+.*--hard", "git reset --hard"),
        (r"\bgit\s+push\s+.*(?:-f\b|--force\b|\+[a-zA-Z0-9_])", "git push --force or +refspec"),
        (r"\bgit\s+clean\s+.*-(?:[a-zA-Z]*f[a-zA-Z]*d|[a-zA-Z]*d[a-zA-Z]*f)", "git clean -fd"),
        (r"\bchmod\s+.*-R\s+777\s+/(?:$|\s)", "recursive chmod 777 on /"),
    ]

    for pat, desc in fallback_patterns:
        if re.search(pat, cmd_str):
            return True, f"Command contains prohibited dangerous pattern: {desc}."

    try:
        tokens = shlex.split(cmd_str, comments=False)
    except Exception as e:
        # If shlex parsing fails, require user approval rather than allowing
        return True, f"Command syntax could not be safely parsed ({e})."

    if not tokens:
        return False, ""

    bin_name = tokens[0].split("/")[-1]

    if bin_name == "rm":
        return check_rm_command(tokens)
    elif bin_name == "git":
        return check_git_command(tokens)
    elif bin_name == "chmod":
        if any(t in ("-R", "-r") for t in tokens[1:]) and "777" in tokens[1:]:
            targets = [t for t in tokens[1:] if not t.startswith("-") and t != "777"]
            if any(t.rstrip("/") in CRITICAL_PATHS for t in targets):
                return True, "Dangerous chmod blocked: recursive chmod 777 on root/system path."

    return False, ""

def split_pipeline_safely(command_line: str) -> list[str]:
    parts = []
    current = []
    in_single_quote = False
    in_double_quote = False
    escape = False

    i = 0
    n = len(command_line)
    while i < n:
        c = command_line[i]

        if escape:
            current.append(c)
            escape = False
            i += 1
            continue

        if c == "\\" and not in_single_quote:
            escape = True
            current.append(c)
            i += 1
            continue

        if c == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
            current.append(c)
            i += 1
            continue

        if c == '"' and not in_single_quote:
            in_double_quote = not in_double_quote
            current.append(c)
            i += 1
            continue

        if not in_single_quote and not in_double_quote:
            if c in (";", "\n"):
                parts.append("".join(current))
                current = []
                i += 1
                continue
            if c == "&":
                if i + 1 < n and command_line[i + 1] == "&":
                    parts.append("".join(current))
                    current = []
                    i += 2
                    continue
                else:
                    parts.append("".join(current))
                    current = []
                    i += 1
                    continue
            if c == "|":
                if i + 1 < n and command_line[i + 1] == "|":
                    parts.append("".join(current))
                    current = []
                    i += 2
                    continue
                else:
                    parts.append("".join(current))
                    current = []
                    i += 1
                    continue

        current.append(c)
        i += 1

    if current:
        parts.append("".join(current))

    return [p.strip() for p in parts if p.strip()]

def evaluate_command_line(command_line: str) -> tuple[str, str]:
    if not command_line or not command_line.strip():
        return "allow", "Empty command"

    pipeline_parts = split_pipeline_safely(command_line)
    for part in pipeline_parts:
        blocked, reason = check_single_command(part)
        if blocked:
            return "deny", reason

    return "allow", "Command verified safe by safety guard"

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"decision": "allow"}))
            return

        try:
            payload = json.loads(raw_input)
        except Exception as json_err:
            # Do NOT default to allowing when payload parsing fails
            print(json.dumps({
                "decision": "ask",
                "reason": f"Safety guard could not parse JSON payload ({json_err}). User approval required."
            }))
            return

        tool_call = payload.get("toolCall", {})
        tool_name = tool_call.get("name", "")
        args = tool_call.get("args", {})

        if tool_name == "run_command":
            cmd = args.get("CommandLine", "")
            decision, reason = evaluate_command_line(cmd)
            if decision == "deny":
                print(json.dumps({
                    "decision": "deny",
                    "reason": reason
                }))
                return

        print(json.dumps({"decision": "allow"}))
    except Exception as err:
        # Fail safe: ask user for permission rather than blindly allowing
        print(json.dumps({
            "decision": "ask",
            "reason": f"Safety guard encountered an internal evaluation error: {err}. User approval required."
        }))

if __name__ == "__main__":
    main()
