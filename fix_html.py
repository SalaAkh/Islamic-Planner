path = r'd:\User\Desktop\Programms\Islamic Planner\app.html'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')
# Lines 1996 to 2109 (1-indexed) are the corrupt block
# In 0-indexed that's 1995 to 2108
cut_start = 1995  # 0-indexed, the line AFTER the last good line in getDayData
cut_end = 2108   # 0-indexed, inclusive last bad line

# Verify what we're cutting
print(f"Lines being removed ({cut_start+1}-{cut_end+1}):")
print(repr(lines[cut_start][:80]))
print("...")
print(repr(lines[cut_end][:80]))

# Remove the corrupt block
new_lines = lines[:cut_start] + lines[cut_end+1:]
print(f'New total lines: {len(new_lines)}')

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done!')
