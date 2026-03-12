import json
import re

out = open("city_match.txt", "w", encoding="utf-8")

try:
    with open("src/js/muftyat-cities.js", "r", encoding="utf-8") as f:
        content = f.read()
        matches = re.findall(r'\{[^{}]*49\.631899[^{}]*\}', content)
        for m in matches:
            out.write("Found in JS: " + m + "\n")
except Exception as e:
    out.write("Error: " + str(e))

out.close()
