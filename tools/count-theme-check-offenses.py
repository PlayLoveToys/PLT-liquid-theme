#!/usr/bin/env python3
"""Sum theme-check JSON offenses by severity (Shopify CLI 3.91.0)."""
import json
import sys


def collect_offenses(data):
    if isinstance(data, list):
        offenses = []
        for item in data:
            if isinstance(item, dict) and "offenses" in item:
                offenses.extend(item["offenses"])
            elif isinstance(item, dict) and "severity" in item:
                offenses.append(item)
        return offenses
    if isinstance(data, dict):
        if "offenses" in data:
            return data["offenses"]
        offenses = []
        for f in data.get("files", []):
            offenses.extend(f.get("offenses", []))
        return offenses
    return []


def main():
    data = json.load(sys.stdin)
    offenses = collect_offenses(data)
    errors = sum(1 for o in offenses if o.get("severity") == "error")
    warnings = sum(1 for o in offenses if o.get("severity") == "warning")
    suggestions = sum(1 for o in offenses if o.get("severity") == "suggestion")
    print(f"total_offenses={len(offenses)}")
    print(f"errors={errors}")
    print(f"warnings={warnings}")
    if suggestions:
        print(f"suggestions={suggestions}")


if __name__ == "__main__":
    main()