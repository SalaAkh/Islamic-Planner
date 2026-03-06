import urllib.request
import json
import ssl
import os

ssl._create_default_https_context = ssl._create_unverified_context

url = "https://api.muftyat.kz/cities/?format=json&limit=1000"
all_cities = []
page = 1

while url:
    print(f"Fetching {url} ...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            results = data.get('results', [])
            all_cities.extend(results)
            print(f"Got {len(results)} cities. Total so far: {len(all_cities)}")
            url = data.get('next')
    except Exception as e:
        print("Error:", e)
        break

# Transform to save space
minified_cities = []
for city in all_cities:
    # Only keep id, title, lat, lng, timezone, region
    minified_cities.append({
        "i": city.get("id"),
        "t": city.get("title"),
        "la": city.get("lat"),
        "lo": city.get("lng"),
        "tz": city.get("timezone"),
        "r": city.get("region")
    })

js_content = "const MUFTYAT_CITIES = " + json.dumps(minified_cities, ensure_ascii=False) + ";\n"

out_path = os.path.join("src", "js", "muftyat-cities.js")
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Saved {len(all_cities)} cities to {out_path}")
