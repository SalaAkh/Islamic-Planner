import urllib.request
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

# Try the format mentioned in the search results: https://api.muftyat.kz/prayer-times/Год/Широта/Долгота
endpoints = [
    "https://api.muftyat.kz/prayer-times/2026/51.133333/71.433333",
    "https://api.muftyat.kz/prayer-times/2026/51.133333/71.433333/",
    "https://api.muftyat.kz/times/2026/51.133333/71.433333",
    "https://api.muftyat.kz/prayer-times/?format=json",
    "https://api.muftyat.kz/v1/prayer-times/2026/51.13/71.43"
]

for url in endpoints:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            print(f"SUCCESS {url}: {response.status}")
            data = response.read().decode('utf-8')
            try:
                j = json.loads(data)
                print("JSON Data:", str(j)[:200], "...")
            except:
                print("Response starts with:", data[:100])
    except urllib.error.URLError as e:
        status = e.code if hasattr(e, 'code') else str(e)
        print(f"FAIL {url}: {status}")

