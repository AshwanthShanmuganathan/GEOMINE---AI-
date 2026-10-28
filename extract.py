import fitz  # PyMuPDF
import json
import os
import re

pdf_path = r"D:\project\EVS\Mining_report.pdf"
out_dir = r"D:\project\EVS\data\extracted"
txt_path = os.path.join(out_dir, "tamilnadu_mines_report.txt")
json_path = os.path.join(out_dir, "tamilnadu_mines_report.json")

os.makedirs(out_dir, exist_ok=True)

results = []
full_txt = ""

print(f"Loading PDF from {pdf_path}...")
try:
    doc = fitz.open(pdf_path)
    print(f"Loaded successfully. Pages: {len(doc)}")
except Exception as e:
    print(f"Error opening PDF: {e}")
    exit(1)

current_section = "Unknown Section"
current_heading = "Unknown Heading"

for page_num in range(len(doc)):
    page = doc[page_num]
    
    # Extract blocks to try and find headers based on font size or block order
    blocks = page.get_text("dict")["blocks"]
    text_content = page.get_text("text")
    
    # Naive extraction for heading/section:
    lines = [line.strip() for line in text_content.split('\n') if line.strip()]
    if lines:
        possible_heading = lines[0]
        # Keep it if it looks like a heading
        if len(possible_heading) < 100:
            current_heading = possible_heading

        # simple heuristic for section: if it matches "Chapter X" or "Section Y"
        for line in lines[:5]:
            if re.match(r'^(chapter|section|part|appendix)\s+\d+', line, re.IGNORECASE):
                current_section = line
                break

    page_data = {
        "page": page_num + 1,
        "section": current_section,
        "heading": current_heading,
        "content": text_content
    }
    
    results.append(page_data)
    
    # Build full text format
    full_txt += f"--- PAGE {page_num +1} ---\n"
    full_txt += text_content + "\n\n"

# Write JSON
print(f"Writing JSON to {json_path}...")
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

# Write TXT
print(f"Writing TXT to {txt_path}...")
with open(txt_path, 'w', encoding='utf-8') as f:
    f.write(full_txt)

# Analyze first few pages and random samples to provide a summary
print("\n--- SUMMARY OF EXTRACTION ---")
samples = [0, 5, 10, 50, 100]
for idx in samples:
    if idx < len(results):
        print(f"\nPAGE {idx+1}")
        print(f"Heading: {results[idx]['heading']}")
        print(f"Content (first 200 chars): {results[idx]['content'][:200].replace(chr(10), ' ')}")

print("\nProcessing completed successfully.")
