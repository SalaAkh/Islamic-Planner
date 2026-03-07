import json
import os

with open("api_all_cities.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    for c in data.get("results", []):
        if c.get("lat") and c.get("lat").startswith("49.63"):
            print(f"Found in all_cities: {c['title']} - {c['lat']} / {c['lng']}")

# Wait, `api_all_cities.json` only contains 5000 limit, but there are 5694 total.
# Let's search inside the actual muftyat-cities.js
try:
    with open("src/js/muftyat-cities.js", "r", encoding="utf-8") as f:
        content = f.read()
        import re
        matches = re.findall(r'\{[^{}]*49\.631899[^{}]*\}', content)
        for m in matches:
            print("Found in JS:", m)
except Exception as e:
    print("Error reading JS:", e)
