import fitz
import sys

source = r"D:\project\EVS\Mining_report.pdf"
dest = r"D:\project\EVS\Mining_report_clean.pdf"

print(f"Cleaning {source}...")
try:
    doc = fitz.open(source)
    doc.save(dest, clean=True, deflate=True, garbage=4)
    print("Cleaned and saved to", dest)
except Exception as e:
    print(f"Error: {e}")
