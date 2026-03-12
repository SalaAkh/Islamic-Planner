import urllib.request
import json
import urllib.error

urls_to_test = [
    "https://api.muftyat.kz/prayer-times/2026/3",          # Astana ID
    "https://api.muftyat.kz/prayer-times/2026/?city=3",
    "https://api.muftyat.kz/prayer-times/2026/?city_id=3",
    "https://api.muftyat.kz/prayer-times/2026/?id=3",
    "https://api.muftyat.kz/v1/prayer-times/2026/3",
    "https://api.muftyat.kz/prayer-times/2026/49.806406/73.085485" # Karaganda coordinates from /cities/
]

for url in urls_to_test:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(f"SUCCESS {url}: {response.status}")
            print("Data summary:", len(data.get('result', [])))
    except urllib.error.HTTPError as e:
        print(f"FAIL {url}: {e.code}")
    except Exception as e:
        print(f"ERROR {url}: {e}")
