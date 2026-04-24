import os

scripts_to_remove = [
    "final_reorganize.py",
    "cleanup_scratch.py",
    "reorganize_backend.py"
]

for s in scripts_to_remove:
    if os.path.exists(s):
        os.remove(s)
        print(f"Removed: {s}")
