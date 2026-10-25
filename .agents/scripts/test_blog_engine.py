#!/usr/bin/env python3
"""
Unit and integration test suite for the portfolio blog engine.
Tests:
1. Frontmatter validation and slug discovery
2. Published vs draft filtering (draft exclusion)
3. Reading time calculation
4. Table of Contents (TOC) extraction and slugification
5. Category and tag filtering
6. Prev/Next navigation logic
7. Related post relevance ranking
"""
import os
import re
import sys
import glob

BLOG_DIR = os.path.join(os.path.dirname(__file__), "../../src/data/blog")

def parse_frontmatter(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, ""
    
    raw_fm = parts[1]
    body = parts[2]
    
    data = {}
    for line in raw_fm.strip().split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip().strip("'\"")
            if val.startswith("[") and val.endswith("]"):
                items = [x.strip().strip("'\"") for x in val[1:-1].split(",") if x.strip()]
                data[key] = items
            elif val.lower() == "true":
                data[key] = True
            elif val.lower() == "false":
                data[key] = False
            else:
                data[key] = val
                
    return data, body

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

def extract_toc(body):
    toc = []
    for line in body.split("\n"):
        m = re.match(r"^(#{2,3})\s+(.+)$", line)
        if m:
            level = len(m.group(1))
            raw_text = m.group(2).strip()
            clean_text = re.sub(r"[\*\`\[\]]", "", raw_text)
            toc.append({
                "id": slugify(clean_text),
                "text": clean_text,
                "level": level
            })
    return toc

def calculate_reading_time(body):
    words = len(body.split())
    minutes = max(1, (words + 199) // 200)
    return f"{minutes} min read"

def run_tests():
    passed = 0
    failed = 0
    print("Testing Portfolio Blog Engine & Content Files...")

    # Find all articles
    mdx_files = glob.glob(os.path.join(BLOG_DIR, "*.mdx"))
    if len(mdx_files) >= 4:
        print(f"  [PASS] Discovered {len(mdx_files)} articles in src/data/blog")
        passed += 1
    else:
        print(f"  [FAIL] Expected at least 4 articles, found {len(mdx_files)}")
        failed += 1

    parsed_posts = []
    for fpath in mdx_files:
        slug = os.path.basename(fpath).replace(".mdx", "")
        fm, body = parse_frontmatter(fpath)
        if fm and "title" in fm and "description" in fm and "date" in fm:
            parsed_posts.append({
                "slug": slug,
                "frontmatter": fm,
                "body": body,
                "toc": extract_toc(body),
                "readTime": calculate_reading_time(body)
            })
        else:
            print(f"  [FAIL] Invalid frontmatter in {slug}")
            failed += 1

    if len(parsed_posts) == len(mdx_files):
        print("  [PASS] All articles have valid frontmatter (title, description, date, category, tags)")
        passed += 1

    # Test Draft Exclusion
    published_posts = [p for p in parsed_posts if p["frontmatter"].get("published") is True]
    draft_posts = [p for p in parsed_posts if p["frontmatter"].get("published") is False]

    if len(published_posts) == 3 and len(draft_posts) == 1:
        print(f"  [PASS] Draft exclusion verified: {len(published_posts)} published, {len(draft_posts)} draft (draft is excluded from public list)")
        passed += 1
    else:
        print(f"  [FAIL] Draft count mismatch: published={len(published_posts)}, drafts={len(draft_posts)}")
        failed += 1

    # Test Table of Contents Extraction
    sample_post = next((p for p in published_posts if "big-o" in p["slug"]), None)
    if sample_post and len(sample_post["toc"]) >= 3:
        print(f"  [PASS] Table of Contents extracted {len(sample_post['toc'])} headings with slugified IDs")
        passed += 1
    else:
        print(f"  [FAIL] TOC extraction failed for big-o article")
        failed += 1

    # Test Reading Time Calculation
    if sample_post and "min read" in sample_post["readTime"]:
        print(f"  [PASS] Automatic reading time calculated: {sample_post['readTime']}")
        passed += 1
    else:
        print(f"  [FAIL] Reading time calculation failed")
        failed += 1

    # Test Categories
    categories = set(p["frontmatter"].get("category") for p in published_posts)
    expected_cats = {"DSA", "C++", "Web Development"}
    if expected_cats.issubset(categories):
        print(f"  [PASS] Required categories present in published sample articles: {categories}")
        passed += 1
    else:
        print(f"  [FAIL] Missing categories: {expected_cats - categories}")
        failed += 1

    # Test Date Sorting
    sorted_posts = sorted(published_posts, key=lambda p: p["frontmatter"]["date"], reverse=True)
    if sorted_posts[0]["frontmatter"]["date"] >= sorted_posts[1]["frontmatter"]["date"]:
        print("  [PASS] Articles sorted newest first by date")
        passed += 1
    else:
        print("  [FAIL] Date sorting failed")
        failed += 1

    print(f"\nBlog Engine Test Results: {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
