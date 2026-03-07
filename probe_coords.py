import urllib.request
import json
import urllib.error

urls = [
    "https://api.muftyat.kz/prayer-times/2026/49.631899/72.859245", # Exact
    "https://api.muftyat.kz/prayer-times/2026/49.63189/72.85924",   # 5 decimals
    "https://api.muftyat.kz/prayer-times/2026/49.6319/72.8592",     # 4 decimals
    "https://api.muftyat.kz/prayer-times/2026/49.632/72.859",       # 3 decimals
    "https://api.muftyat.kz/prayer-times/2026/49.63/72.86",         # 2 decimals
    "https://api.muftyat.kz/prayer-times/2026/49.6/72.9",           # 1 decimal
]

with open("coord_match.txt", "w", encoding="utf-8") as out:
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                out.write(f"SUCCESS {url}: {response.status}\n")
        except urllib.error.HTTPError as e:
            out.write(f"FAIL {url}: {e.code}\n")
        except Exception as e:
            out.write(f"ERROR {url}: {e}\n")
